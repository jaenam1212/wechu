import { redirect } from "next/navigation";

/** 홈 탭 없음 — 앱 시작 시 위츄가 기본 화면 */
export default function HomePage() {
  redirect("/wechu");
}
