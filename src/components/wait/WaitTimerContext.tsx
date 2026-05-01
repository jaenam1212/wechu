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
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rewardBanner, setRewardBanner] = useState<string | null>(null);
  const [endRunBusy, setEndRunBusy] = useState(false);

  useEffect(() => {
    if (!run) {
      setElapsedSec(0);
      return undefined;
    }
    const tick = () =>
      setElapsedSec(
        Math.max(0, Math.floor((Date.now() - run.startedAtMs) / 1000)),
      );
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [run]);

  const beginRun = useCallback((r: ActiveWaitRun) => {
    setRun(r);
    setRewardBanner(null);
  }, []);

  const dismissReward = useCallback(() => setRewardBanner(null), []);

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
