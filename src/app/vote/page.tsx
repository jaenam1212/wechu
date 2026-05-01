import VotePanel from "@/components/VotePanel";
import { ensureUserRow, getSessionUserId } from "@/lib/auth/session";
import { getSql } from "@/lib/db/neon";
import { neonRows } from "@/lib/db/rows";
import { getPollBoard } from "@/lib/vote-totals";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "헤메코 투표",
};

export const dynamic = "force-dynamic";

export default async function VotePage() {
  if (!process.env.DATABASE_URL?.trim()) {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <p className="text-sm text-zinc-400">
          `DATABASE_URL`(Neon)이 필요합니다.
        </p>
      </main>
    );
  }

  const uid = await getSessionUserId();
  if (!uid) {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <p className="text-sm text-zinc-400">세션 불러오는 중… 새로고침 해 주세요.</p>
      </main>
    );
  }

  let rows: Awaited<ReturnType<typeof getPollBoard>>;
  let balance = 0;
  try {
    await ensureUserRow(uid);
    const sql = getSql();
    rows = await getPollBoard();

    const [w] = neonRows<{ balance: string | number }>(
      await sql`SELECT balance FROM wallets WHERE user_id = ${uid}::uuid`,
    );

    balance = Number(w?.balance ?? 0);
  } catch {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <p className="text-sm text-zinc-400">DB 로드 실패 — 연결 문자열과 스키마를 확인해 주세요.</p>
      </main>
    );
  }

  rows = [...rows].sort((a, b) => {
    const by = b.count - a.count;
    if (by !== 0) return by;
    return a.label.localeCompare(b.label);
  });

  return (
    <main className="flex w-full flex-col gap-6 px-5 py-8">
      <header>
        <h1 className="text-2xl font-bold text-white">다음 헤메코 컨셉</h1>
        <p className="mt-2 text-sm text-zinc-400">
          리워드로 투표해 보세요. 순위 바는 라이브 카운트를 반영합니다.
        </p>
      </header>

      <VotePanel rows={rows} balance={balance} />
    </main>
  );
}
