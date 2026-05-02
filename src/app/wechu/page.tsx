import WechuCustomizer from "@/components/WechuCustomizer";
import { getSessionUserId } from "@/lib/auth/session";
import { getSql } from "@/lib/db/neon";
import { neonRows } from "@/lib/db/rows";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "위츄",
};

export const dynamic = "force-dynamic";

async function fetchWechuBoard(userId: string) {
  const sql = getSql();

  const [items, owned, avatarRows, walletRows] = await Promise.all([
    sql`
      SELECT item_key, name, slot, cost
      FROM wechu_items
      ORDER BY slot ASC, cost ASC
    `,
    sql`
      SELECT item_key FROM user_wechu_owned
      WHERE user_id = ${userId}::uuid
    `,
    sql`
      SELECT hat_key, body_key, acc_key FROM wechu_avatar
      WHERE user_id = ${userId}::uuid
    `,
    sql`
      SELECT balance FROM wallets
      WHERE user_id = ${userId}::uuid
    `,
  ]);

  const ownedKeys = new Set(
    neonRows<{ item_key: string }>(owned).map((r) => r.item_key),
  );

  const av = neonRows<{
    hat_key: string;
    body_key: string;
    acc_key: string;
  }>(avatarRows)[0];

  const w = neonRows<{ balance: string | number }>(walletRows)[0];

  return {
    items: neonRows<{
      item_key: string;
      name: string;
      slot: "hat" | "body" | "acc";
      cost: number;
    }>(items),
    ownedKeys,
    balance: Number(w?.balance ?? 0),
    avatar:
      av ??
      ({
        hat_key: "hat_default",
        body_key: "body_default",
        acc_key: "acc_default",
      } as const),
  };
}

export default async function WechuPage() {
  if (!process.env.DATABASE_URL?.trim()) {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <h1 className="text-xl font-semibold text-zinc-900">환경 변수 필요</h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          `.env.local`에 Neon 연결 문자열 `DATABASE_URL`을 넣어 주세요.
          Neon 콘솔에서{' '}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-pink-700">
            neon/migrations/001_init.sql
          </code>{' '}
          을 실행해 스키마를 만드세요.
        </p>
      </main>
    );
  }

  const uid = await getSessionUserId();
  if (!uid) {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <p className="text-sm text-zinc-600">
          세션 준비 중입니다. 새로고침 해 주세요.
        </p>
      </main>
    );
  }

  let board: Awaited<ReturnType<typeof fetchWechuBoard>>;
  try {
    board = await fetchWechuBoard(uid);
  } catch {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <p className="text-sm text-zinc-600">
          DB 연결 또는 스키마를 확인해 주세요. `DATABASE_URL`과 마이그레이션
          SQL 실행 여부를 봐 주세요.
        </p>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-col gap-6 px-5 py-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">위츄</h1>
        <p className="mt-2 text-sm text-zinc-600">
          줄 선 시간으로 받은 리워드(RP)로 코디템을 사고 장착해요.
        </p>
      </header>

      <WechuCustomizer
        items={board.items}
        ownedKeys={board.ownedKeys}
        balance={Number(board.balance)}
        avatar={{
          hat_key: board.avatar.hat_key,
          body_key: board.avatar.body_key,
          acc_key: board.avatar.acc_key,
        }}
      />
    </main>
  );
}
