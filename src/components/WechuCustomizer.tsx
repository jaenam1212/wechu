"use client";

import { buyWechuItem, equipWechu } from "@/app/actions/shop";
import {
  getItemThumbSrc,
  getWechuOverlayLayers,
  WECHU_BASE_SPRITE_SRC,
} from "@/lib/wechu-items";
import { Check, Shirt } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Row = {
  item_key: string;
  name: string;
  slot: "hat" | "body" | "acc";
  cost: number;
  description: string;
};

/** 스토리 상점 노출 순서 (리쿠 → 유우시 → 재희 → 시온 → 사쿠야) */
const SHOP_ITEM_ORDER = [
  "acc_item1",
  "acc_item2",
  "body_item4",
  "hat_item3",
  "hat_item5",
] as const;

function WechuPreviewSprite({
  topSrc,
  midSrc,
  bottomSrc,
  className = "relative h-full w-full max-h-[13.5rem] max-w-[13.5rem]",
}: {
  topSrc: string | null;
  midSrc: string | null;
  bottomSrc: string | null;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  return !broken ? (
    <div className={className}>
      <Image
        src={WECHU_BASE_SPRITE_SRC}
        alt="위츄 캐릭터"
        fill
        sizes="220px"
        className="object-contain object-center"
        onError={() => setBroken(true)}
      />
      {topSrc ? (
        <div className="pointer-events-none absolute left-[63%] top-[18%] h-[25%] w-[25%] -translate-x-1/2 rotate-35">
          <Image src={topSrc} alt="" fill sizes="56px" className="object-contain" />
        </div>
      ) : null}
      {midSrc ? (
        <div className="pointer-events-none absolute left-1/2 top-[60%] h-[25%] w-[25%] -translate-x-1/2 -translate-y-1/2">
          <Image src={midSrc} alt="" fill sizes="56px" className="object-contain" />
        </div>
      ) : null}
      {bottomSrc ? (
        <div className="pointer-events-none absolute bottom-[16%] left-1/2 h-[25%] w-[25%] -translate-x-1/2">
          <Image src={bottomSrc} alt="" fill sizes="56px" className="object-contain" />
        </div>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2">
      <Shirt size={88} strokeWidth={1.25} className="text-zinc-400" />
      <span className="text-center text-[11px] text-zinc-500">
        이미지를 불러오지 못했어요
      </span>
    </div>
  );
}

function previewLayersForItem(
  item: Row,
  equipped: { hat_key: string; body_key: string; acc_key: string },
) {
  const hat = item.slot === "hat" ? item.item_key : equipped.hat_key;
  const body = item.slot === "body" ? item.item_key : equipped.body_key;
  const acc = item.slot === "acc" ? item.item_key : equipped.acc_key;
  return getWechuOverlayLayers(hat, body, acc);
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
  const [selected, setSelected] = useState<Row | null>(null);
  const [confirmBuy, setConfirmBuy] = useState(false);

  useEffect(() => {
    if (!err) return undefined;
    const id = window.setTimeout(() => setErr(null), 3500);
    return () => window.clearTimeout(id);
  }, [err]);

  const closeDetail = useCallback(() => {
    setSelected(null);
    setConfirmBuy(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmBuy) setConfirmBuy(false);
      else if (selected) closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, confirmBuy, closeDetail]);

  useEffect(() => {
    if (!selected && !confirmBuy) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected, confirmBuy]);

  const equipped = avatar;

  const shopItems = useMemo(() => {
    const order = new Map<string, number>(
      SHOP_ITEM_ORDER.map((k, i) => [k, i]),
    );
    return items
      .filter((it) => order.has(it.item_key))
      .sort((a, b) => (order.get(a.item_key) ?? 0) - (order.get(b.item_key) ?? 0));
  }, [items]);

  const listLayers = useMemo(
    () =>
      getWechuOverlayLayers(
        equipped.hat_key,
        equipped.body_key,
        equipped.acc_key,
      ),
    [equipped.acc_key, equipped.body_key, equipped.hat_key],
  );

  const detailLayers = useMemo(() => {
    if (!selected) return listLayers;
    return previewLayersForItem(selected, equipped);
  }, [selected, equipped, listLayers]);

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
      else {
        setConfirmBuy(false);
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  const openDetail = useCallback((item: Row) => {
    setSelected(item);
    setConfirmBuy(false);
  }, []);

  const equipKeyForSlot = (slot: Row["slot"]) =>
    slot === "hat"
      ? equipped.hat_key
      : slot === "body"
        ? equipped.body_key
        : equipped.acc_key;

  const isBusyItem = selected
    ? (busy?.includes(selected.item_key) ?? false)
    : false;

  return (
    <div className="flex flex-col gap-5">
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

      <p className="rounded-2xl border border-sky-200/45 bg-[color-mix(in_srgb,var(--wechu-main)_22%,transparent)] px-3 py-2.5 text-center text-[11px] leading-snug text-slate-800">
        리워드 지급 방식은{" "}
        <span className="font-semibold">1분에 10토큰</span> 이에요.
      </p>

      <div className="flex flex-col items-center justify-center pt-1">
        <div className="relative flex h-[min(18rem,52vw)] w-full max-w-[16rem] items-center justify-center rounded-[2rem] border border-transparent bg-transparent px-4 py-6">
          <div className="relative h-full w-full">
            <WechuPreviewSprite
              key={`${equipped.hat_key}:${equipped.body_key}:${equipped.acc_key}`}
              topSrc={listLayers.topSrc}
              midSrc={listLayers.midSrc}
              bottomSrc={listLayers.bottomSrc}
              className="relative mx-auto aspect-square h-full max-h-[14rem] w-full max-w-[14rem]"
            />
          </div>
        </div>
        <p className="mt-1 text-center text-xs text-zinc-500">
          잔액{" "}
          <span className="font-semibold tabular-nums text-zinc-700">{balance}</span>{" "}
          토큰
        </p>
      </div>

      <div className="grid grid-cols-3 gap-x-2.5 gap-y-4">
        {shopItems.map((item) => {
          const owns = ownedKeys.has(item.item_key);
          const thumb = getItemThumbSrc(item.item_key);
          return (
            <button
              key={item.item_key}
              type="button"
              onClick={() => openDetail(item)}
              className="group flex flex-col items-center gap-1.5 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-zinc-200/90 bg-zinc-100 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition group-active:scale-[0.97]">
                {thumb ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      sizes="(max-width:430px) 28vw, 120px"
                      className="object-contain p-1.5"
                    />
                  </div>
                ) : (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    {item.slot === "hat"
                      ? "hat"
                      : item.slot === "body"
                        ? "mid"
                        : "acc"}
                  </span>
                )}
              </div>
              <span className="line-clamp-2 min-h-[2rem] w-full text-[11px] font-semibold leading-tight text-zinc-900">
                {item.name}
              </span>
              {owns ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                  <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
                  보유중
                </span>
              ) : (
                <span className="text-[10px] font-semibold tabular-nums text-zinc-600">
                  {item.cost === 0 ? "기본" : `${item.cost} 토큰`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[58] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wechu-detail-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="닫기"
            onClick={closeDetail}
          />
          <div
            className="relative z-10 flex max-h-[min(92dvh,640px)] w-full max-w-md flex-col gap-5 overflow-y-auto overscroll-contain rounded-3xl border border-zinc-200/80 bg-[color-mix(in_srgb,var(--wechu-base)_98%,white)] px-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] pt-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="wechu-detail-title" className="sr-only">
              {selected.name} 상세
            </h2>
            <div className="flex flex-col items-center">
              <div className="relative flex h-[min(12rem,38vw)] w-full max-w-[15rem] items-center justify-center rounded-2xl bg-transparent py-2">
                <WechuPreviewSprite
                  key={`detail-${selected.item_key}:${equipped.hat_key}:${equipped.body_key}:${equipped.acc_key}`}
                  topSrc={detailLayers.topSrc}
                  midSrc={detailLayers.midSrc}
                  bottomSrc={detailLayers.bottomSrc}
                  className="relative mx-auto aspect-square h-full max-h-[11rem] w-full max-w-[11rem]"
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-zinc-100/95 px-4 py-5 shadow-inner">
              <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-1.5">
                  {getItemThumbSrc(selected.item_key) ? (
                    <Image
                      src={getItemThumbSrc(selected.item_key)!}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                      N/A
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-semibold text-zinc-900">{selected.name}</p>
                  <p className="mt-1 text-xs font-medium tabular-nums text-zinc-600">
                    {selected.cost === 0 ? "기본" : `${selected.cost} 토큰`}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
                    {selected.description?.trim() || "설명이 없어요."}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                {ownedKeys.has(selected.item_key) ? (
                  <button
                    type="button"
                    disabled={isBusyItem || equipKeyForSlot(selected.slot) === selected.item_key}
                    onClick={() => void equip(selected.slot, selected.item_key)}
                    className="min-h-[3rem] flex-1 rounded-2xl bg-zinc-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-500 disabled:opacity-45"
                  >
                    {equipKeyForSlot(selected.slot) === selected.item_key
                      ? "착용 중"
                      : "착용"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBusyItem || balance < selected.cost}
                    onClick={() => setConfirmBuy(true)}
                    className="min-h-[3rem] flex-1 rounded-2xl bg-zinc-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-500 disabled:opacity-45"
                  >
                    구매
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDetail}
                  className="min-h-[3rem] min-w-[7.5rem] rounded-2xl bg-zinc-200 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300"
                >
                  뒤로가기
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {confirmBuy && selected ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-5 py-10 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wechu-buy-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h2
              id="wechu-buy-title"
              className="text-center text-[15px] font-bold leading-snug text-zinc-900"
            >
              {selected.name} 을 구매하시겠습니까?
            </h2>
            <hr className="my-4 border-zinc-200" />
            <p className="text-center text-sm text-zinc-600">
              {selected.cost} 토큰을 사용하여 아이템을 구매합니다.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                disabled={isBusyItem || balance < selected.cost}
                onClick={() => void buy(selected.item_key)}
                className="min-h-12 flex-1 rounded-2xl bg-zinc-600 text-sm font-semibold text-white transition hover:bg-zinc-500 disabled:opacity-45"
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => setConfirmBuy(false)}
                className="min-h-12 flex-1 rounded-2xl bg-zinc-200 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300"
              >
                NO
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
