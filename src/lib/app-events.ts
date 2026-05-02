import "server-only";

import { getSql } from "@/lib/db/neon";

export type AppEventKind =
  | "wait_start"
  | "wait_complete"
  | "vote"
  | "shop_buy"
  | "equip";

export async function appendAppEvent(
  kind: AppEventKind,
  userId: string,
  detail: Record<string, unknown>,
) {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO app_events (user_id, kind, detail)
      VALUES (${userId}::uuid, ${kind}, ${JSON.stringify(detail)}::jsonb)
    `;
  } catch (e) {
    console.error("appendAppEvent", kind, e);
  }
}
