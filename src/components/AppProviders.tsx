"use client";

import GlobalWaitTimerBar from "@/components/wait/GlobalWaitTimerBar";
import { WaitTimerProvider } from "@/components/wait/WaitTimerContext";
import { WaitTimerReservePadding } from "@/components/wait/WaitTimerReservePadding";
import WaitTimerSessionHydrator from "@/components/wait/WaitTimerSessionHydrator";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WaitTimerProvider>
      <WaitTimerSessionHydrator />
      <WaitTimerReservePadding />
      <GlobalWaitTimerBar />
      {children}
    </WaitTimerProvider>
  );
}
