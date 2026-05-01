"use client";

import { fmtClock } from "@/lib/fmt-clock";
import { Loader2, Timer } from "lucide-react";
import { useEffect } from "react";
import { useWaitTimer } from "./WaitTimerContext";

export default function GlobalWaitTimerBar() {
  const {
    run,
    elapsedSec,
    rewardBanner,
    endRun,
    endRunBusy,
    dismissReward,
  } = useWaitTimer();

  useEffect(() => {
    if (!rewardBanner || run) return undefined;
    const t = window.setTimeout(dismissReward, 8000);
    return () => window.clearTimeout(t);
  }, [dismissReward, rewardBanner, run]);

  return (
    <>
      {rewardBanner ? (
        <div
          role="status"
          className={`app-column-w fixed left-1/2 z-40 flex w-full max-w-none -translate-x-1/2 justify-center ${
            run
              ? "top-[calc(env(safe-area-inset-top)+3rem)]"
              : "border-x border-b border-zinc-200 pt-[env(safe-area-inset-top)] shadow-sm"
          }`}
        >
          <p className="w-full border-x border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-xs text-emerald-900 md:text-sm">
            {rewardBanner}{" "}
            <button
              type="button"
              className="text-emerald-800 underline-offset-2 hover:underline"
              onClick={dismissReward}
            >
              닫기
            </button>
          </p>
        </div>
      ) : null}

      {run ? (
        <div className="app-column-w fixed left-1/2 top-0 z-40 flex w-full max-w-none -translate-x-1/2 justify-center border-x border-zinc-200 pt-[env(safe-area-inset-top)] shadow-md backdrop-blur-sm">
          <div className="flex h-12 w-full items-center gap-3 border-b border-zinc-200 bg-white/95 px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
              <Timer className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                대기 중 · {run.venueName}
              </p>
              <p className="font-mono text-lg font-semibold tabular-nums leading-tight text-pink-700">
                {fmtClock(elapsedSec)}
              </p>
            </div>
            <button
              type="button"
              disabled={endRunBusy}
              onClick={() => void endRun()}
              className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-55"
            >
              {endRunBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
