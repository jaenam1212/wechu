"use client";

import { fmtClock } from "@/lib/fmt-clock";
import { Loader2, Timer } from "lucide-react";
import { usePathname } from "next/navigation";
import { useWaitTimer } from "./WaitTimerContext";

/** 고정 레이어: 본문 흐름과 무관하게 safe-area 바로 아래 */
const rewardTopSolo =
  "top-[calc(env(safe-area-inset-top)+0.625rem)]";
/** 타이머 알약 아래 리워드 스택 */
const rewardTopBelowRun =
  "top-[calc(env(safe-area-inset-top)+0.75rem+3.75rem+0.375rem)]";

const pillTopInsetClass =
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

  const rewardToast = rewardBanner ? (
    <div
      role="status"
      aria-live="polite"
      className={`app-column-w pointer-events-none fixed left-1/2 z-[50] flex w-full max-w-none -translate-x-1/2 justify-center px-3 ${
        !isHome && run ? rewardTopBelowRun : rewardTopSolo
      }`}
    >
      <p className="pointer-events-auto flex w-full max-w-[min(100%,22rem)] items-center justify-center gap-x-3 gap-y-1 rounded-[1.125rem] border border-sky-200/80 bg-[color-mix(in_srgb,var(--wechu-sub)_94%,white)] px-4 py-2.5 text-center text-[13px] font-medium leading-snug text-slate-900 shadow-xl shadow-sky-900/15 backdrop-blur-xl">
        <span className="min-w-0 flex-1 text-balance">{rewardBanner}</span>
        <button
          type="button"
          className="shrink-0 whitespace-nowrap text-xs font-semibold text-sky-900 underline-offset-2 hover:underline"
          onClick={dismissReward}
        >
          닫기
        </button>
      </p>
    </div>
  ) : null;

  if (isHome) {
    return <>{rewardToast}</>;
  }

  return (
    <>
      {rewardToast}

      {run ? (
        <div
          className={`app-column-w pointer-events-none fixed left-1/2 z-40 flex w-full max-w-none -translate-x-1/2 justify-center px-3 ${pillTopInsetClass}`}
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
