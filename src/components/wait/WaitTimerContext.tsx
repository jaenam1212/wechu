"use client";

import { endWaitSession } from "@/app/actions/wait";
import { fmtClock } from "@/lib/fmt-clock";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ActiveWaitRun = {
  sessionId: string;
  venueName: string;
  startedAtMs: number;
};

type Ctx = {
  run: ActiveWaitRun | null;
  elapsedSec: number;
  rewardBanner: string | null;
  beginRun: (r: ActiveWaitRun) => void;
  endRunBusy: boolean;
  endRun: () => Promise<void>;
  dismissReward: () => void;
};

const WaitTimerContext = createContext<Ctx | null>(null);

export function WaitTimerProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState<ActiveWaitRun | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [rewardBanner, setRewardBanner] = useState<string | null>(null);
  const [endRunBusy, setEndRunBusy] = useState(false);

  useEffect(() => {
    if (!run) return undefined;
    const tick = () => {
      setNowMs(Date.now());
    };
    const t0 = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 500);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(id);
    };
  }, [run]);

  const elapsedSec =
    run === null
      ? 0
      : Math.max(0, Math.floor((nowMs - run.startedAtMs) / 1000));

  const beginRun = useCallback((r: ActiveWaitRun) => {
    setRun((prev) => prev ?? r);
    setRewardBanner(null);
  }, []);

  const dismissReward = useCallback(() => setRewardBanner(null), []);

  useEffect(() => {
    if (!rewardBanner) return undefined;
    const id = window.setTimeout(() => dismissReward(), 3000);
    return () => window.clearTimeout(id);
  }, [rewardBanner, dismissReward]);

  const endRun = useCallback(async () => {
    const sid = run?.sessionId;
    if (!sid) return;
    setEndRunBusy(true);
    try {
      const res = await endWaitSession(sid);
      if (!res.ok) {
        setRewardBanner(null);
        return;
      }
      setRun(null);
      setRewardBanner(
        `대기 ${fmtClock(res.durationSec)} · +${res.rewardPoints} 리워드`,
      );
    } finally {
      setEndRunBusy(false);
    }
  }, [run?.sessionId]);

  const value = useMemo(
    () => ({
      run,
      elapsedSec,
      rewardBanner,
      beginRun,
      endRunBusy,
      endRun,
      dismissReward,
    }),
    [
      beginRun,
      dismissReward,
      elapsedSec,
      endRun,
      endRunBusy,
      rewardBanner,
      run,
    ],
  );

  return (
    <WaitTimerContext.Provider value={value}>
      {children}
    </WaitTimerContext.Provider>
  );
}

export function useWaitTimer() {
  const v = useContext(WaitTimerContext);
  if (!v) throw new Error("useWaitTimer must be used inside WaitTimerProvider");
  return v;
}
