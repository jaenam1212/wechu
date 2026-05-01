"use client";

import GlobalWaitTimerBar from "@/components/wait/GlobalWaitTimerBar";
import { WaitTimerProvider } from "@/components/wait/WaitTimerContext";
import { WaitTimerReservePadding } from "@/components/wait/WaitTimerReservePadding";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WaitTimerProvider>
      <WaitTimerReservePadding />
      <GlobalWaitTimerBar />
      {children}
    </WaitTimerProvider>
  );
}
