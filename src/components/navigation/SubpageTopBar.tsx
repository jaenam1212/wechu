"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/wechu": "위츄",
  "/vote": "투표",
  "/recap": "리캡",
  "/scan": "스캔",
};

export default function SubpageTopBar() {
  const pathname = usePathname() ?? "";

  if (pathname === "/" || pathname === "") {
    return null;
  }

  const title =
    titles[pathname] ??
    pathname
      .replace(/^\//, "")
      .split("/")[0]
      ?.replace(/-/g, " ") ??
    "Wechu";

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-sky-200/35 bg-[color-mix(in_srgb,var(--wechu-base)_96%,transparent)] px-4 py-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-md">
      <Link
        href="/"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/40 bg-[var(--wechu-main)] text-lg font-semibold text-sky-900 transition hover:brightness-[0.97]"
        aria-label="메인 줄 타이머"
      >
        ⌂
      </Link>
      <h2 className="flex-1 text-center text-sm font-semibold tracking-tight text-slate-800">
        {title}
      </h2>
      <span className="w-10" aria-hidden />
    </header>
  );
}
