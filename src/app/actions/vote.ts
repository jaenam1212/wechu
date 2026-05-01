"use server";

import { VOTE_COST } from "@/lib/constants";
import { requireUserId } from "@/lib/auth/session";
import { getPool } from "@/lib/db/neon";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function castOutfitVote(optionIdRaw: unknown) {
  const optionId = z.string().uuid().parse(optionIdRaw);

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

    const opt = await client.query(`SELECT id FROM poll_options WHERE id = $1`, [
      optionId,
    ]);
    if (opt.rowCount !== 1) {
      await client.query("ROLLBACK");
      return { ok: false as const, message: "투표 항목을 찾을 수 없어요." };
    }

    const pay = await client.query(
      `UPDATE wallets SET balance = balance - $2
       WHERE user_id = $1::uuid AND balance >= $2`,
      [userId, VOTE_COST],
    );
    if (pay.rowCount !== 1) {
      await client.query("ROLLBACK");
      return {
        ok: false as const,
        message: `리워드가 부족해요 (한 표 ${VOTE_COST}).`,
      };
    }

    await client.query(
      `INSERT INTO outfit_votes (user_id, option_id, reward_spent)
       VALUES ($1::uuid, $2::uuid, $3)`,
      [userId, optionId, VOTE_COST],
    );

    await client.query("COMMIT");
    revalidatePath("/vote");
    revalidatePath("/recap");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false as const, message: "투표 저장에 실패했어요." };
  } finally {
    client.release();
  }
}
