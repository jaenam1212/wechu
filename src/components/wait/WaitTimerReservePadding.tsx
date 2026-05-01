"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { useWaitTimer } from "./WaitTimerContext";

const FLOAT_GAP = "0.75rem";
const PILL_H = "3.5rem";
const runBlock = `calc(env(safe-area-inset-top, 0px) + ${FLOAT_GAP} + ${PILL_H})`;

/** fixed 상단 타이머 알약 아래 본문이 가리지 않도록 #wechu-app-shell 패딩 (리워드 토스트는 오버레이라 패딩 없음) */
export function WaitTimerReservePadding() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/" || pathname === "";
  const { run } = useWaitTimer();

  useLayoutEffect(() => {
    const el = document.getElementById("wechu-app-shell");
    if (!el) return;

    if (isHome) {
      el.style.paddingTop = "";
      return () => {
        el.style.paddingTop = "";
      };
    }

    const calc = run ? runBlock : "";

    el.style.paddingTop = calc || "";
    return () => {
      el.style.paddingTop = "";
    };
  }, [isHome, run]);

  return null;
}
