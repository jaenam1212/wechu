"use server";

import { requireUserId } from "@/lib/auth/session";
import { getPool, getSql } from "@/lib/db/neon";
import { neonRows } from "@/lib/db/rows";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function buyWechuItem(itemKeyRaw: unknown) {
  const itemKey = z.string().min(1).parse(itemKeyRaw);
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

    const owned = await client.query(
      `SELECT 1 FROM user_wechu_owned WHERE user_id = $1::uuid AND item_key = $2`,
      [userId, itemKey],
    );
    if ((owned.rowCount ?? 0) > 0) {
      await client.query("ROLLBACK");
      return { ok: false as const, message: "이미 보유한 아이템이에요." };
    }

    const itRes = await client.query<{ cost: string | number }>(
      `SELECT cost FROM wechu_items WHERE item_key = $1`,
      [itemKey],
    );
    const item = itRes.rows[0];
    if (!item) {
      await client.query("ROLLBACK");
      return { ok: false as const, message: "알 수 없는 아이템이에요." };
    }

    const cost = Number(item.cost);

    const pay = await client.query(
      `UPDATE wallets SET balance = balance - $2
       WHERE user_id = $1::uuid AND balance >= $2`,
      [userId, cost],
    );
    if (pay.rowCount !== 1) {
      await client.query("ROLLBACK");
      return { ok: false as const, message: `리워드가 부족해요 (필요 ${cost}).` };
    }

    await client.query(
      `INSERT INTO user_wechu_owned (user_id, item_key)
       VALUES ($1::uuid, $2)`,
      [userId, itemKey],
    );

    await client.query("COMMIT");
    revalidatePath("/wechu");
    revalidatePath("/recap");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false as const, message: "구매 처리에 실패했어요." };
  } finally {
    client.release();
  }
}

const equipSchema = z.object({
  slot: z.enum(["hat", "body", "acc"]),
  itemKey: z.string().min(1),
});

export async function equipWechu(payload: unknown) {
  const { slot, itemKey } = equipSchema.parse(payload);

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false as const, message: "세션이 필요합니다." };
  }

  try {
    const sql = getSql();

    const ownedRows = neonRows<{ item_key: string }>(await sql`
      SELECT item_key FROM user_wechu_owned
      WHERE user_id = ${userId}::uuid AND item_key = ${itemKey}
    `);

    if (ownedRows.length === 0) {
      return { ok: false as const, message: "보유한 아이템만 장착할 수 있어요." };
    }

    if (slot === "hat") {
      await sql`
        UPDATE wechu_avatar SET hat_key = ${itemKey}
        WHERE user_id = ${userId}::uuid
      `;
    } else if (slot === "body") {
      await sql`
        UPDATE wechu_avatar SET body_key = ${itemKey}
        WHERE user_id = ${userId}::uuid
      `;
    } else {
      await sql`
        UPDATE wechu_avatar SET acc_key = ${itemKey}
        WHERE user_id = ${userId}::uuid
      `;
    }

    revalidatePath("/wechu");
    revalidatePath("/recap");
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: "장착에 실패했어요." };
  }
}
