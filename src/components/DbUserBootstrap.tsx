import { ensureUserRow, getSessionUserId } from "@/lib/auth/session";

/** 첫 요청 시 users 행 생성(트리거로 지갑·위츄 기본값) */
export default async function DbUserBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const id = await getSessionUserId();
  if (!id) return children;
  try {
    await ensureUserRow(id);
  } catch {
    /* DATABASE_URL 미설정 등은 각 페이지에서 안내 */
  }
  return children;
}
