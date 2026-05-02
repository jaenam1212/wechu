"use client";

import { usePathname } from "next/navigation";

/** 메인(/)은 한 화면 고정으로 세로 스크롤 차단 · 그 외는 본문만 스크롤 */
export default function RouteScrollArea({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/" || pathname === "";

  if (isHome) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden overscroll-none">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
      {children}
    </div>
  );
}
