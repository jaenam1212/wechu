"use client";

import { castOutfitVote } from "@/app/actions/vote";
import { VOTE_COST } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Row = { id: string; label: string; count: number };

export default function VotePanel({ rows, balance }: { rows: Row[]; balance: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
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
