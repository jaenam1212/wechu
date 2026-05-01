"use client";

import { buyWechuItem, equipWechu } from "@/app/actions/shop";
import { Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Row = {
  item_key: string;
  name: string;
  slot: "hat" | "body" | "acc";
  cost: number;
};

export default function WechuCustomizer({
  items,
  ownedKeys,
  balance,
  avatar,
}: {
  items: Row[];
  ownedKeys: Set<string>;
  balance: number;
  avatar: { hat_key: string; body_key: string; acc_key: string };
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g = { hat: [] as Row[], body: [] as Row[], acc: [] as Row[] };
    for (const it of items) {
      g[it.slot].push(it);
    }
    return g;
  }, [items]);

  const titles: Record<string, string> = {
    hat: "모자 · 헤어",
    body: "의상 · 코디",
    acc: "악세서리",
  };

  const equip = async (slot: Row["slot"], itemKey: string) => {
    setErr(null);
    setBusy(`${slot}:${itemKey}`);
    try {
      const res = await equipWechu({ slot, itemKey });
      if (!res.ok) setErr(res.message);
      else router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const buy = async (itemKey: string) => {
    setErr(null);
    setBusy(`buy:${itemKey}`);
    try {
      const res = await buyWechuItem(itemKey);
      if (!res.ok) setErr(res.message);
      else router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const equipped = avatar;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-2 text-xs uppercase tracking-widest text-zinc-500">
          프리뷰
        </h2>
        <div className="flex gap-6">
          <div className="flex h-44 w-40 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-white/15 to-purple-900/40">
            <Shirt size={72} strokeWidth={1.25} className="text-white/85" />
            <span className="mt-4 text-[11px] text-zinc-400">표시용 간단 픽토</span>
          </div>
          <dl className="flex flex-1 flex-col justify-center gap-2 text-sm text-zinc-300">
            <div>
              <dt className="text-xs text-zinc-500">모자</dt>
              <dd>{items.find((i) => i.item_key === equipped.hat_key)?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">옷</dt>
              <dd>{items.find((i) => i.item_key === equipped.body_key)?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">참</dt>
              <dd>{items.find((i) => i.item_key === equipped.acc_key)?.name}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          리워드 {balance} · 보유 아이템 {ownedKeys.size}개
        </p>
      </section>

      {err ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {err}
        </p>
      ) : null}

      {(["hat", "body", "acc"] as const).map((slot) => (
        <section key={slot} className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{titles[slot]}</h2>
          <div className="grid gap-2">
            {grouped[slot].map((item) => {
              const owns = ownedKeys.has(item.item_key);
              const isBusy = busy?.includes(item.item_key) ?? false;
              const equipKey =
                slot === "hat"
                  ? equipped.hat_key
                  : slot === "body"
                    ? equipped.body_key
                    : equipped.acc_key;

              return (
                <div
                  key={item.item_key}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
                >
                  <span className="flex-1 text-sm text-white">{item.name}</span>
                  <span className="text-xs text-zinc-500">
                    {item.cost === 0 ? "기본" : `${item.cost} RP`}
                  </span>
                  {owns ? (
                    <button
                      type="button"
                      disabled={isBusy || equipKey === item.item_key}
                      onClick={() => void equip(slot, item.item_key)}
                      className="rounded-lg bg-purple-600/70 px-3 py-1 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-45"
                    >
                      {equipKey === item.item_key ? "착용 중" : "착용"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy || balance < item.cost}
                      onClick={() => void buy(item.item_key)}
                      className="rounded-lg bg-pink-600/80 px-3 py-1 text-xs font-medium text-white hover:bg-pink-500 disabled:opacity-45"
                    >
                      구매
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
