import "server-only";

import { getSql } from "@/lib/db/neon";
import { neonRows } from "@/lib/db/rows";

export async function getPollBoard() {
  const sql = getSql();
  const options = neonRows<{ id: string; label: string; sort_order: number }>(
    await sql`
    SELECT id, label, sort_order
    FROM poll_options
    ORDER BY sort_order ASC
  `,
  );
  const votes = neonRows<{ option_id: string }>(
    await sql`
    SELECT option_id
    FROM outfit_votes
  `,
  );

  const counts = new Map<string, number>();
  for (const v of votes) {
    const id = v.option_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return options.map((o) => ({
    id: o.id,
    label: o.label,
    count: counts.get(o.id) ?? 0,
  }));
}
