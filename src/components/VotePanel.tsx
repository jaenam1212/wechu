"use client";

import { castOutfitVote } from "@/app/actions/vote";
import { VOTE_COST } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Row = { id: string; label: string; count: number };

export default function VotePanel({ rows, balance }: { rows: Row[]; balance: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!err) return undefined;
    const id = window.setTimeout(() => setErr(null), 3500);
    return () => window.clearTimeout(id);
  }, [err]);

  const maxVotes = useMemo(
    () => Math.max(1, ...rows.map((r) => r.count)),
    [rows],
  );

  const vote = async (id: string) => {
    setErr(null);
    setBusy(id);
    try {
      const res = await castOutfitVote(id);
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        한 표당 <span className="font-semibold text-zinc-900">{VOTE_COST}</span>{" "}
        리워드입니다. (보유 {balance})
      </p>

      {err ? (
        <div
          role="status"
          aria-live="polite"
          className="app-column-w pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.625rem)] z-[55] flex w-full max-w-none -translate-x-1/2 justify-center px-3"
        >
          <p className="pointer-events-auto flex w-full max-w-[min(100%,22rem)] items-center justify-center gap-x-2 rounded-[1.125rem] border border-rose-200/80 bg-[color-mix(in_srgb,var(--wechu-base)_94%,white)] px-4 py-2.5 text-center text-[13px] font-medium leading-snug text-rose-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
            <span className="min-w-0 flex-1 text-balance">{err}</span>
            <button
              type="button"
              className="shrink-0 whitespace-nowrap text-xs font-semibold text-rose-800 underline-offset-2 hover:underline"
              onClick={() => setErr(null)}
            >
              닫기
            </button>
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {rows.map((o) => {
          const pct = Math.round((o.count / maxVotes) * 100);
          const loading = busy === o.id;

          return (
            <button
              type="button"
              key={o.id}
              onClick={() => void vote(o.id)}
              disabled={loading || balance < VOTE_COST}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50/50 disabled:opacity-45"
            >
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 bg-sky-200/60 transition-all"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-4">
                <span className="font-medium text-zinc-900">{o.label}</span>
                <span className="text-sm tabular-nums text-zinc-600">
                  {o.count}표
                  {loading ? (
                    <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                  ) : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
