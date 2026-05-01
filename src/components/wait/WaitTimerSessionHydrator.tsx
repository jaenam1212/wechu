"use client";

import { getActiveWaitSession } from "@/app/actions/wait";
import { useEffect } from "react";
import { useWaitTimer } from "./WaitTimerContext";

/** 마운트 시 서버에 열린 대기 세션이 있으면 `started_at` 기준으로 타이머 복구 */
export default function WaitTimerSessionHydrator() {
  const { beginRun } = useWaitTimer();

  useEffect(() => {
    let cancel = false;
    void getActiveWaitSession().then((data) => {
      if (cancel || !data.active) return;
      beginRun({
        sessionId: data.sessionId,
        venueName: data.venueName,
        startedAtMs: Date.parse(data.startedAtIso),
      });
    });
    return () => {
      cancel = true;
    };
  }, [beginRun]);

  return null;
}
