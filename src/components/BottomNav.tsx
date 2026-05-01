"use client";

import { Layers, Shirt, Smartphone, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/wechu", label: "위츄", icon: Shirt },
  { href: "/scan", label: "스캔", icon: Smartphone },
  { href: "/vote", label: "투표", icon: Layers },
  { href: "/recap", label: "리캡", icon: Trophy },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className="app-column-w fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 justify-center border-x border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md"
    >
      <div className="grid w-full grid-cols-4 gap-0.5 px-1 pt-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-0.5 py-1 text-[11px] font-semibold tracking-tight transition ${
                active
                  ? "text-pink-600"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
