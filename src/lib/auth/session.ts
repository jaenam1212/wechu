import "server-only";

import {
  WECHU_UID_COOKIE,
  WECHU_UID_HEADER,
  isUuid,
} from "@/lib/auth/constants";
import { getSql } from "@/lib/db/neon";
import { cookies, headers } from "next/headers";

export { WECHU_UID_COOKIE, WECHU_UID_HEADER, isUuid } from "@/lib/auth/constants";

/** 미들웨어가 헤더에 실어 준 값(동일 요청) 또는 이후 요청의 httpOnly 쿠키 */
export async function getSessionUserId(): Promise<string | null> {
  const h = (await headers()).get(WECHU_UID_HEADER);
  if (h && isUuid(h)) return h;
  const v = (await cookies()).get(WECHU_UID_COOKIE)?.value;
  if (v && isUuid(v)) return v;
  return null;
}

export async function ensureUserRow(userId: string) {
  const sql = getSql();
  await sql`
    INSERT INTO users (id)
    VALUES (${userId}::uuid)
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function requireUserId(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) {
    throw new Error("세션 없음: 페이지 새로고침 후 다시 시도해 주세요.");
  }
  await ensureUserRow(id);
  return id;
}
