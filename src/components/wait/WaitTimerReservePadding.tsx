"use client";

import { useLayoutEffect } from "react";
import { useWaitTimer } from "./WaitTimerContext";

/**
 * 글로벌 플로팅 타이머( safe + 12pxgap + 알약 높이 ) + 보조 배너
 * GlobalWaitTimerBar 의 topInset / h-[3.5rem] 과 맞출 것
 */
const FLOAT_GAP = "0.75rem";
const PILL_H = "3.5rem";
const runBlock = `calc(env(safe-area-inset-top, 0px) + ${FLOAT_GAP} + ${PILL_H})`;
const MSG_APPROX = "3.625rem"; /* 둥근 보상 카드 한 덩어리 */

/** fixed 상단 알약 아래 본문이 가리지 않도록 #wechu-app-shell 패딩 */
export function WaitTimerReservePadding() {
  const { run, rewardBanner } = useWaitTimer();

  useLayoutEffect(() => {
    const el = document.getElementById("wechu-app-shell");
    if (!el) return;

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
  }, [rewardBanner, run]);

  return null;
}
