"use client";

import { fmtClock } from "@/lib/fmt-clock";
import { Loader2, Timer } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useWaitTimer } from "./WaitTimerContext";

/** safe-area 바로 아래 여백 (아이폰 알림처럼 살짝 띄움) */
const topInsetClass =
  "pt-[calc(env(safe-area-inset-top)+0.75rem)]";

export default function GlobalWaitTimerBar() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/" || pathname === "";

  const {
    run,
    elapsedSec,
    rewardBanner,
    endRun,
    endRunBusy,
    dismissReward,
  } = useWaitTimer();

  useEffect(() => {
    if (isHome || !rewardBanner || run) return undefined;
    const t = window.setTimeout(dismissReward, 8000);
    return () => window.clearTimeout(t);
  }, [dismissReward, isHome, rewardBanner, run]);

  /** 타이머 아래 보상 줄 (타이머 돌 때 동시 노출 거의 없음 — 겹치면 간격 분리) */
  const rewardTopWhenRun =
    "top-[calc(env(safe-area-inset-top)+0.75rem+3.75rem+0.375rem)]";

  if (isHome) {
    return null;
  }

  return (
    <>
      {rewardBanner ? (
        <div
          role="status"
          className={`app-column-w pointer-events-none fixed left-1/2 z-40 flex w-full max-w-none -translate-x-1/2 justify-center px-3 ${
            run ? rewardTopWhenRun : `${topInsetClass}`
          }`}
        >
          <p className="pointer-events-auto w-full max-w-none rounded-[1.25rem] border border-sky-200/80 bg-[color-mix(in_srgb,var(--wechu-sub)_92%,white)] px-4 py-3 text-center text-xs text-slate-800 shadow-lg shadow-sky-900/10 backdrop-blur-xl md:text-[13px]">
            {rewardBanner}{" "}
            <button
              type="button"
              className="font-medium text-sky-900 underline-offset-2 hover:underline"
              onClick={dismissReward}
            >
              닫기
            </button>
          </p>
        </div>
      ) : null}

      {run ? (
        <div
          className={`app-column-w pointer-events-none fixed left-1/2 z-40 flex w-full max-w-none -translate-x-1/2 justify-center px-3 ${topInsetClass}`}
        >
          <div className="pointer-events-auto flex h-[3.5rem] w-full max-w-[min(100%,22rem)] items-center gap-2.5 rounded-[1.375rem] border border-sky-200/70 bg-[color-mix(in_srgb,var(--wechu-base)_92%,white)] pl-3.5 pr-2 shadow-[0_8px_32px_rgba(30,41,59,0.1),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--wechu-main)] text-sky-900">
              <Timer className="h-[1.125rem] w-[1.125rem]" aria-hidden strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-slate-500">
                {run.venueName}
              </p>
              <p className="font-mono text-[17px] font-semibold tabular-nums leading-[1.2] tracking-tight text-sky-950">
                {fmtClock(elapsedSec)}
              </p>
            </div>
            <button
              type="button"
              disabled={endRunBusy}
              onClick={() => void endRun()}
              className="shrink-0 rounded-[0.9375rem] bg-slate-800 px-[0.9375rem] py-2 text-[13px] font-semibold tracking-tight text-white shadow-inner transition hover:bg-slate-900 disabled:opacity-55"
            >
              {endRunBusy ? (
                <Loader2 className="h-[1.0625rem] w-[1.0625rem] animate-spin" />
              ) : (
                "종료"
              )}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
