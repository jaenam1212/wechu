"use client";

import { useLayoutEffect } from "react";
import { useWaitTimer } from "./WaitTimerContext";

const RUN_BAR_CSS = "3rem"; /* 타이머 한 줄바 높이(대략) */
const MSG_CSS = "2.625rem"; /* 보상·에러 안내 줄 */

/** fixed 상단바 아래 본문이 가리지 않도록 #wechu-app-shell 패딩으로 밀어냅니다 */
export function WaitTimerReservePadding() {
  const { run, rewardBanner } = useWaitTimer();

  useLayoutEffect(() => {
    const el = document.getElementById("wechu-app-shell");
    if (!el) return;

    let calc = "";
    if (run && rewardBanner) {
      calc = `calc(env(safe-area-inset-top, 0px) + ${RUN_BAR_CSS} + ${MSG_CSS})`;
    } else if (run) {
      calc = `calc(env(safe-area-inset-top, 0px) + ${RUN_BAR_CSS})`;
    } else if (rewardBanner) {
      calc = `calc(env(safe-area-inset-top, 0px) + ${MSG_CSS})`;
    }

    el.style.paddingTop = calc || "";
    return () => {
      el.style.paddingTop = "";
    };
  }, [rewardBanner, run]);

  return null;
}
