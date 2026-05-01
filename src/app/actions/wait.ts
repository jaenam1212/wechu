"use server";

import {
  MAX_GPS_VENUE_RADIUS_M,
  MAX_REWARD_PER_SESSION,
  MAX_SESSION_SECONDS,
  REWARD_SECONDS_PER_POINT,
} from "@/lib/constants";
import { distanceMeters } from "@/lib/geo";
import { requireUserId } from "@/lib/auth/session";
import { getPool, getSql } from "@/lib/db/neon";
import { neonRows } from "@/lib/db/rows";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const startSchema = z.object({
  venueSlug: z.string().min(1).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

async function uidOrFail() {
  try {
    return await requireUserId();
  } catch {
    return null;
  }
}

export async function startWaitSession(form: unknown) {
  const { venueSlug, lat, lng } = startSchema.parse(form);
  const userId = await uidOrFail();
  if (!userId) {
    return { ok: false as const, message: "세션 준비 중입니다. 새로고침 후 다시 시도해 주세요." };
  }

  try {
    const sql = getSql();

    const [active] = neonRows<{ c: number }>(await sql`
      SELECT count(*)::int AS c
      FROM wait_sessions
      WHERE user_id = ${userId}::uuid AND ended_at IS NULL
    `);
    if (Number(active?.c ?? 0) > 0) {
      return { ok: false as const, message: "이미 진행 중인 대기 세션이 있어요." };
    }

    const venues = neonRows<{
      slug: string;
      name: string;
      lat: number;
      lng: number;
      radius_m: number;
    }>(
      await sql`
      SELECT slug, name, lat, lng, radius_m
      FROM venues
      WHERE slug = ${venueSlug}
    `,
    );

    const venue = venues[0];

    if (!venue) {
      return { ok: false as const, message: "등록된 QR 장소가 아니에요." };
    }

    /** 로컬/스테이징만. 운영에서는 비우거나 false 권장. */
    const skipGeo = process.env.SKIP_GEO_VALIDATION === "true";

    if (!skipGeo) {
      const allowedM = Math.min(venue.radius_m, MAX_GPS_VENUE_RADIUS_M);
      const d = distanceMeters({ lat, lng }, { lat: venue.lat, lng: venue.lng });
      if (d > allowedM) {
        return {
          ok: false as const,
          message: `장소 근처가 아니에요 (약 ${Math.round(d)}m, 허용 약 ${Math.round(allowedM)}m).`,
        };
      }
    }

    const inserted = neonRows<{ id: string; started_at: string | Date }>(
      await sql`
      INSERT INTO wait_sessions (user_id, venue_slug)
      VALUES (${userId}::uuid, ${venue.slug})
      RETURNING id, started_at
    `,
    );

    const row = inserted[0];
    if (!row) {
      return { ok: false as const, message: "세션 시작에 실패했어요." };
    }

    const startedAtIso = new Date(row.started_at).toISOString();

    return {
      ok: true as const,
      sessionId: row.id,
      venueName: venue.name,
      startedAtIso,
    };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: "세션 시작에 실패했어요." };
  }
}

/** GPS 좌표로 가장 가깝고 반경 안에 포함되는 등록 존 선택 */
export async function resolveVenueFromGps(form: unknown) {
  const schema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  });

  try {
    const { lat, lng } = schema.parse(form);
    const sql = getSql();
    const venues = neonRows<{
      slug: string;
      name: string;
      lat: number;
      lng: number;
      radius_m: number;
    }>(
      await sql`
        SELECT slug, name, lat, lng, radius_m
        FROM venues
        WHERE radius_m <= ${MAX_GPS_VENUE_RADIUS_M}
      `,
    );

    const scored = venues
      .map((v) => ({
        ...v,
        dist: distanceMeters({ lat, lng }, { lat: v.lat, lng: v.lng }),
      }))
      .sort((a, b) => a.dist - b.dist);

    const hit = scored.find((v) => v.dist <= v.radius_m);

    if (!hit) {
      return {
        ok: false as const,
        message: "등록된 줄 존 근처가 아니에요.",
      };
    }

    return {
      ok: true as const,
      slug: hit.slug,
      name: hit.name,
    };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: "위치를 확인하지 못했어요." };
  }
}

export type ActiveWaitSessionResult =
  | { active: false }
  | {
      active: true;
      sessionId: string;
      venueName: string;
      startedAtIso: string;
    };

/** 앱/Web 재접속 시 클라 타이머 복구용 */
export async function getActiveWaitSession(): Promise<ActiveWaitSessionResult> {
  const userId = await uidOrFail();
  if (!userId) {
    return { active: false };
  }

  try {
    const sql = getSql();
    const rows = neonRows<{
      id: string;
      started_at: string | Date;
      venue_name: string;
    }>(
      await sql`
        SELECT ws.id, ws.started_at, v.name AS venue_name
        FROM wait_sessions ws
        JOIN venues v ON v.slug = ws.venue_slug
        WHERE ws.user_id = ${userId}::uuid
          AND ws.ended_at IS NULL
        LIMIT 1
      `,
    );
    const r = rows[0];
    if (!r) {
      return { active: false };
    }

    return {
      active: true,
      sessionId: r.id,
      venueName: r.venue_name,
      startedAtIso: new Date(r.started_at).toISOString(),
    };
  } catch (e) {
    console.error(e);
    return { active: false };
  }
}

export async function endWaitSession(sessionIdRaw: unknown) {
  const sessionId = z.string().uuid().parse(sessionIdRaw);

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false as const, message: "세션이 필요합니다." };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const lock = await client.query<{ started_at: Date }>(
      `SELECT started_at FROM wait_sessions
       WHERE id = $1 AND user_id = $2 AND ended_at IS NULL
       FOR UPDATE`,
      [sessionId, userId],
    );

    if (lock.rowCount !== 1 || !lock.rows[0]?.started_at) {
      await client.query("ROLLBACK");
      return { ok: false as const, message: "유효한 대기 세션이 없어요." };
    }

    const started = new Date(lock.rows[0].started_at);
    let ds = Math.floor((Date.now() - started.getTime()) / 1000);
    if (ds < 0) ds = 0;
    if (ds > MAX_SESSION_SECONDS) ds = MAX_SESSION_SECONDS;

    const rw = Math.min(
      Math.max(Math.floor(ds / REWARD_SECONDS_PER_POINT), 1),
      MAX_REWARD_PER_SESSION,
    );

    await client.query(
      `UPDATE wait_sessions
       SET ended_at = NOW(),
           duration_sec = $1,
           reward_points = $2
       WHERE id = $3 AND user_id = $4::uuid`,
      [ds, rw, sessionId, userId],
    );

    await client.query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1::uuid, $2::bigint)
       ON CONFLICT (user_id)
       DO UPDATE SET balance = wallets.balance + EXCLUDED.balance`,
      [userId, rw],
    );

    await client.query("COMMIT");
    revalidatePath("/recap");

    return {
      ok: true as const,
      durationSec: ds,
      rewardPoints: rw,
    };
  } catch (e) {
    console.error(e);
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false as const, message: "세션 종료에 실패했어요." };
  } finally {
    client.release();
  }
}
