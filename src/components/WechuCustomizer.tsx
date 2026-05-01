"use client";

import { buyWechuItem, equipWechu } from "@/app/actions/shop";
import { wechuSpriteUrl } from "@/lib/wechu-sprites";
import { Shirt } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Row = {
  item_key: string;
  name: string;
  slot: "hat" | "body" | "acc";
  cost: number;
};

function WechuPreviewSprite({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  return !broken ? (
    <Image
      src={src}
      alt="위츄 캐릭터"
      width={176}
      height={176}
      className="max-h-[10.5rem] w-auto object-contain object-bottom"
      unoptimized
      onError={() => setBroken(true)}
    />
  ) : (
    <>
      <Shirt size={72} strokeWidth={1.25} className="text-violet-600" />
      <span className="mt-3 text-center text-[11px] text-zinc-500">
        이미지를 불러오지 못했어요
      </span>
    </>
  );
}

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

  useEffect(() => {
    if (!err) return undefined;
    const id = window.setTimeout(() => setErr(null), 3500);
    return () => window.clearTimeout(id);
  }, [err]);

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

  const spriteSrc = useMemo(
    () => wechuSpriteUrl(equipped.hat_key, equipped.body_key),
    [equipped.hat_key, equipped.body_key],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-xs uppercase tracking-widest text-zinc-500">
          프리뷰
        </h2>
        <div className="flex gap-6">
          <div className="relative flex h-48 w-44 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-violet-100 to-pink-100 px-2 pt-3 pb-2">
            <WechuPreviewSprite key={spriteSrc} src={spriteSrc} />
          </div>
          <dl className="flex flex-1 flex-col justify-center gap-2 text-sm text-zinc-800">
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

      {(["hat", "body", "acc"] as const).map((slot) => (
        <section key={slot} className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">{titles[slot]}</h2>
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
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2"
                >
                  <span className="flex-1 text-sm text-zinc-900">{item.name}</span>
                  <span className="text-xs text-zinc-500">
                    {item.cost === 0 ? "기본" : `${item.cost} RP`}
                  </span>
                  {owns ? (
                    <button
                      type="button"
                      disabled={isBusy || equipKey === item.item_key}
                      onClick={() => void equip(slot, item.item_key)}
                      className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-45"
                    >
                      {equipKey === item.item_key ? "착용 중" : "착용"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy || balance < item.cost}
                      onClick={() => void buy(item.item_key)}
                      className="rounded-lg bg-pink-600 px-3 py-1 text-xs font-medium text-white hover:bg-pink-500 disabled:opacity-45"
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
