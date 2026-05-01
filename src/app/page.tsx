import Link from "next/link";
import { Sparkles, Timer, Vote } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-5 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-pink-300/90">
          Fan wait · Tamagotchi
        </p>
        <h1 className="text-3xl font-bold leading-tight text-white">
          Wechu
          <span className="block text-lg font-normal text-zinc-400">
            줄 선 만큼 쌓이는 리워드로 위츄를 꾸미고, 헤메코에 투표해요.
          </span>
        </h1>
      </header>

      <section className="grid gap-3">
        <Link
          href="/scan"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-pink-400/40 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20 text-pink-200">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-white">QR 스캔 · 대기 타이머</h2>
            <p className="text-sm text-zinc-400">
              장소 인증 후 타이머 시작, 종료 시 리워드 지급
            </p>
          </div>
        </Link>

        <Link
          href="/wechu"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-400/40 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-white">위츄 커스터마이즈</h2>
            <p className="text-sm text-zinc-400">모자 · 의상 · 악세서리</p>
          </div>
        </Link>

        <Link
          href="/vote"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-400/40 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-100">
            <Vote className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-white">헤메코 투표</h2>
            <p className="text-sm text-zinc-400">리워드로 원하는 무대 룩에 표</p>
          </div>
        </Link>

        <Link
          href="/recap"
          className="flex items-center justify-center rounded-2xl border border-dashed border-white/15 py-4 text-sm text-zinc-400 transition hover:border-pink-300/40 hover:text-pink-100"
        >
          올해 나의 대기 리캡 보기 →
        </Link>
      </section>
    </main>
  );
}
