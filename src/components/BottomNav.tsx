"use client";

import { Home, Layers, Shirt, Smartphone, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "홈", icon: Home },
  { href: "/scan", label: "스캔", icon: Smartphone },
  { href: "/wechu", label: "위츄", icon: Shirt },
  { href: "/vote", label: "투표", icon: Layers },
  { href: "/recap", label: "리캡", icon: Trophy },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className="app-column-w fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 justify-center border-x border-white/8 border-t border-white/10 bg-[#0a0b12]/93 pb-[env(safe-area-inset-bottom)] backdrop-blur-md supports-[backdrop-filter]:bg-[#0a0b12]/80"
    >
      <div className="grid w-full grid-cols-5 gap-0.5 px-1 pt-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-0.5 py-1 text-[11px] font-semibold tracking-tight transition ${
                active
                  ? "text-pink-300"
                  : "text-zinc-500 hover:text-zinc-300"
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
