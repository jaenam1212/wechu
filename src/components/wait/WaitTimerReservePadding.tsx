"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { useWaitTimer } from "./WaitTimerContext";

const FLOAT_GAP = "0.75rem";
const PILL_H = "3.5rem";
const runBlock = `calc(env(safe-area-inset-top, 0px) + ${FLOAT_GAP} + ${PILL_H})`;
const MSG_APPROX = "3.625rem";

/** fixed 상단 알약 아래 본문이 가리지 않도록 #wechu-app-shell 패딩 */
export function WaitTimerReservePadding() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/" || pathname === "";
  const { run, rewardBanner } = useWaitTimer();

  useLayoutEffect(() => {
    const el = document.getElementById("wechu-app-shell");
    if (!el) return;

    if (isHome) {
      el.style.paddingTop = "";
      return () => {
        el.style.paddingTop = "";
      };
    }

    let calc = "";
    if (run && rewardBanner) {
      calc = `calc(${runBlock} + 0.375rem + ${MSG_APPROX})`;
    } else if (run) {
      calc = runBlock;
    } else if (rewardBanner) {
      calc = `calc(env(safe-area-inset-top, 0px) + ${FLOAT_GAP} + ${MSG_APPROX})`;
    }

    el.style.paddingTop = calc || "";
    return () => {
      el.style.paddingTop = "";
    };
  }, [isHome, rewardBanner, run]);

  return null;
}
