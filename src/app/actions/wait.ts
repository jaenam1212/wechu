"use server";

import {
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

    const skipGeo = process.env.SKIP_GEO_VALIDATION === "true";
    if (!skipGeo) {
      const d = distanceMeters({ lat, lng }, { lat: venue.lat, lng: venue.lng });
      if (d > venue.radius_m) {
        return {
          ok: false as const,
          message: `장소 근처가 아니에요 (약 ${Math.round(d)}m, 허용 ${venue.radius_m}m).`,
        };
      }
    }

    const inserted = neonRows<{ id: string }>(
      await sql`
      INSERT INTO wait_sessions (user_id, venue_slug)
      VALUES (${userId}::uuid, ${venue.slug})
      RETURNING id
    `,
    );

    const row = inserted[0];
    if (!row) {
      return { ok: false as const, message: "세션 시작에 실패했어요." };
    }

    return { ok: true as const, sessionId: row.id, venueName: venue.name };
  } catch (e) {
    console.error(e);
    return { ok: false as const, message: "세션 시작에 실패했어요." };
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
