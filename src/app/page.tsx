import HomeRadialClient from "@/components/home/HomeRadialClient";
import { getEquippedWechuAvatar, getWalletBalance } from "@/app/actions/shop";

export const dynamic = "force-dynamic";

/** 메인 줄 타이머 (GPS 줄 시작 + 방사형 1시간 링 UI) */
export default async function HomePage() {
  const [balance, avatar] = await Promise.all([
    getWalletBalance(),
    getEquippedWechuAvatar(),
  ]);
  return <HomeRadialClient initialBalance={balance} initialAvatar={avatar} />;
}
