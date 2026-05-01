import { ensureUserRow, getSessionUserId } from "@/lib/auth/session";
import { getSql } from "@/lib/db/neon";
import { neonRows } from "@/lib/db/rows";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "리캡",
};

export const dynamic = "force-dynamic";

function fmtHm(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h <= 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

type AvatarRow = {
  hat_key: string;
  body_key: string;
  acc_key: string;
};

export default async function RecapPage() {
  if (!process.env.DATABASE_URL?.trim()) {
    return (
      <main className="flex w-full flex-col px-5 py-10">
        <p className="text-sm text-zinc-400">`DATABASE_URL`이 없습니다.</p>
      </main>
    );
  }

  const uid = await getSessionUserId();
  if (!uid) {
    return (
      <main className="flex w-full flex-col px-5 py-10">
        <p className="text-sm text-zinc-400">세션 불러오는 중…</p>
      </main>
    );
  }

  let sessions: { duration_sec: number | null; venue_slug: string }[] = [];
  let votesCount = 0;
  let walletBal = 0;
  let displayAvatar: AvatarRow = {
    hat_key: "hat_default",
    body_key: "body_default",
    acc_key: "acc_default",
  };
  let items: { item_key: string; name: string }[] = [];
  let ownedLen = 0;
  let venues: { slug: string; name: string }[] = [];

  try {
    await ensureUserRow(uid);
    const sql = getSql();

    const [sess, voteAgg, wal, av, it, ow, vn] = await Promise.all([
      sql`
        SELECT duration_sec, venue_slug
        FROM wait_sessions
        WHERE user_id = ${uid}::uuid AND ended_at IS NOT NULL
      `,
      sql`
        SELECT count(*)::int AS c FROM outfit_votes
        WHERE user_id = ${uid}::uuid
      `,
      sql`SELECT balance FROM wallets WHERE user_id = ${uid}::uuid`,
      sql`
        SELECT hat_key, body_key, acc_key FROM wechu_avatar
        WHERE user_id = ${uid}::uuid
      `,
      sql`SELECT item_key, name FROM wechu_items`,
      sql`
        SELECT item_key FROM user_wechu_owned
        WHERE user_id = ${uid}::uuid
      `,
      sql`SELECT slug, name FROM venues`,
    ]);

    sessions = neonRows<{ duration_sec: number | null; venue_slug: string }>(
      sess,
    );

    votesCount = Number(
      neonRows<{ c: number }>(voteAgg)[0]?.c ?? 0,
    );
    walletBal = Number(
      neonRows<{ balance?: string | number }>(wal)[0]?.balance ?? 0,
    );
    const ar = neonRows<AvatarRow>(av)[0];
    if (ar) displayAvatar = ar;
    items = neonRows<{ item_key: string; name: string }>(it);

    ownedLen = neonRows<{ item_key: string }>(ow).length;
    venues = neonRows<{ slug: string; name: string }>(vn);
  } catch {
    return (
      <main className="flex w-full flex-col px-5 py-10">
        <p className="text-sm text-zinc-400">데이터를 불러오지 못했어요.</p>
      </main>
    );
  }

  const itemName = new Map(items.map((r) => [r.item_key, r.name]));

  const totalSec = sessions.reduce(
    (a, r) => a + Number(r.duration_sec ?? 0),
    0,
  );

  const byVenue = new Map<string, number>();
  for (const s of sessions) {
    if (!s.venue_slug) continue;
    byVenue.set(
      s.venue_slug,
      (byVenue.get(s.venue_slug) ?? 0) + Number(s.duration_sec ?? 0),
    );
  }
  let faveSlug: string | null = null;
  let faveSec = 0;
  for (const [slug, sec] of byVenue.entries()) {
    if (sec > faveSec) {
      faveSlug = slug;
      faveSec = sec;
    }
  }
  const venueName =
    venues.find((v) => v.slug === faveSlug)?.name ??
    faveSlug ??
    "아직 데이터 없음";

  return (
    <main className="flex w-full flex-col gap-6 px-5 py-10">
      <header>
        <h1 className="text-2xl font-bold text-white">팬대기 리캡</h1>
        <p className="mt-2 text-sm text-zinc-400">
          총 대기 시간과 위츄, 투표 요약이에요.
        </p>
      </header>

      <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">숫자</h2>
        <dl className="grid gap-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">총 대기</dt>
            <dd className="font-semibold text-white">{fmtHm(totalSec)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">가장 오래 줄 선 곳</dt>
            <dd className="text-right font-medium text-white">{venueName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">현재 리워드</dt>
            <dd className="font-semibold text-pink-200">{walletBal} RP</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">투표 참여 횟수</dt>
            <dd className="font-semibold text-white">{votesCount}회</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-2 rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          내 위츄 코디
        </h2>
        <ul className="space-y-2 text-sm text-white">
          <li>
            모자 ·{" "}
            <span className="text-zinc-300">
              {itemName.get(displayAvatar.hat_key) ?? displayAvatar.hat_key}
            </span>
          </li>
          <li>
            옷 ·{" "}
            <span className="text-zinc-300">
              {itemName.get(displayAvatar.body_key) ?? displayAvatar.body_key}
            </span>
          </li>
          <li>
            참 ·{" "}
            <span className="text-zinc-300">
              {itemName.get(displayAvatar.acc_key) ?? displayAvatar.acc_key}
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-zinc-500">
          코디 칸당 보유 가능한 아이템 {ownedLen}종
        </p>
      </section>
    </main>
  );
}
