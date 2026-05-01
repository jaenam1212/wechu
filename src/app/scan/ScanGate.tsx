"use client";

import dynamic from "next/dynamic";

const ScanExperience = dynamic(() => import("@/components/ScanExperience"), {
  ssr: false,
  loading: () => (
    <p className="px-6 py-10 text-center text-sm text-zinc-600">
      카메라·스캐너 불러오는 중…
    </p>
  ),
});

export default function ScanGate() {
  return <ScanExperience />;
}
