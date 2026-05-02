"use server";

import { getSql } from "@/lib/db/neon";
import { headers } from "next/headers";

/** 앱 진입 시 1회(클라이언트 빔) 호출 · Vercel/프록시의 국가 헤더로 일별 카운트 */
export async function pingVisitGeo() {
  try {
    const h = await headers();
    const raw =
      h.get("x-vercel-ip-country")?.trim() ||
      h.get("cf-ipcountry")?.trim() ||
      "";
    const country =
      raw.length === 0
        ? "ZZ"
        : raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);

    const sql = getSql();
    await sql`
      INSERT INTO visit_geo_daily (day, country, visits)
      VALUES (
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date,
        ${country === "" ? "ZZ" : country},
        1
      )
      ON CONFLICT (day, country) DO UPDATE SET
        visits = visit_geo_daily.visits + EXCLUDED.visits
    `;
  } catch (e) {
    console.error("pingVisitGeo", e);
  }
}
