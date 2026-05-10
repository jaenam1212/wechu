"use client";

import {
  resolveVenueFromGps,
  startWaitSession,
} from "@/app/actions/wait";
import { getWalletBalance } from "@/app/actions/shop";
import { useWaitTimer } from "@/components/wait/WaitTimerContext";
import { fmtClock } from "@/lib/fmt-clock";
import { getGeoFixedPresets } from "@/config/geo-presets";
import { getBrowserGeoCoordinates } from "@/lib/geo-client";
import {
  getWechuOverlayLayers,
  WECHU_BASE_SPRITE_SRC,
} from "@/lib/wechu-items";
import {
  BarChart3,
  Loader2,
  Play,
  ShoppingBag,
  Square,
  Star,
  Vote,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

const R = 118;
const CIR = 2 * Math.PI * R;
/** 링 한 바퀴 = 약 1시간 */
const RING_SECONDS = 3600;

/** 하단 캐릭터 박스 Tailwind `w-60`/`h-60` (= 15rem → 240px @16px rem) */
const HOME_CHAR_PANEL_PX = 240;
/** `h-[3.6rem]` / `w-[3.6rem]` 오버레이 (≈58px) */
const HOME_CHAR_OVERLAY_TOP_PX = Math.round(3.6 * 16);
/** `h-[3.8rem]` / `w-[3.8rem]` 오버레이 (≈61px) */
const HOME_CHAR_OVERLAY_SLOT_PX = Math.round(3.8 * 16);

/**
 * next/image `sizes`: 앱 칼럼 최대 430px(md 전)·640px(md) 기준, 표시 CSS px에 맞춤.
 * (`unoptimized`일 때도 레이아웃·추후 최적화 재활성 시 동일 기준)
 */
const HOME_CHAR_BASE_SIZES = `(max-width: 430px) ${HOME_CHAR_PANEL_PX}px, (max-width: 768px) ${HOME_CHAR_PANEL_PX}px, ${HOME_CHAR_PANEL_PX}px`;
const HOME_CHAR_OVERLAY_TOP_SIZES = `(max-width: 768px) ${HOME_CHAR_OVERLAY_TOP_PX}px, ${HOME_CHAR_OVERLAY_TOP_PX}px`;
const HOME_CHAR_OVERLAY_SLOT_SIZES = `(max-width: 768px) ${HOME_CHAR_OVERLAY_SLOT_PX}px, ${HOME_CHAR_OVERLAY_SLOT_PX}px`;

async function geoOnce(
  fixedOverride: Readonly<{ lat: number; lng: number }> | null,
): Promise<{ lat: number; lng: number }> {
  if (fixedOverride) {
    const loc = { lat: fixedOverride.lat, lng: fixedOverride.lng };
    console.log("[wechu] 내 위치", {
      ...loc,
      source: "고정 좌표(config/geo-presets)",
    });
    return loc;
  }
  const g = await getBrowserGeoCoordinates();
  console.log("[wechu] 내 위치", {
    lat: g.lat,
    lng: g.lng,
    source: "브라우저 GPS",
    accuracy_m: g.accuracy_m,
  });
  return { lat: g.lat, lng: g.lng };
}

export default function HomeRadialClient({
  initialBalance,
  initialAvatar,
}: {
  initialBalance: number;
  initialAvatar: { hat_key: string; body_key: string; acc_key: string };
}) {
  const {
    run,
    elapsedSec,
    beginRun,
    endRun,
    endRunBusy,
    rewardBanner,
  } = useWaitTimer();
  const [balance, setBalance] = useState(initialBalance);
  const [busyStart, setBusyStart] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const fixedPresets = useMemo(() => getGeoFixedPresets(), []);
  const [fixedPresetIdx, setFixedPresetIdx] = useState(0);
  const fixedOverride = fixedPresets?.[fixedPresetIdx] ?? null;
  const layers = useMemo(
    () =>
      getWechuOverlayLayers(
        initialAvatar.hat_key,
        initialAvatar.body_key,
        initialAvatar.acc_key,
      ),
    [initialAvatar.acc_key, initialAvatar.body_key, initialAvatar.hat_key],
  );

  const lapProgress =
    ((elapsedSec % RING_SECONDS) / RING_SECONDS) * CIR;
  const ringDashOffset = run ? CIR - lapProgress : CIR;

  useEffect(() => {
    void getWalletBalance().then(setBalance);
  }, [run, rewardBanner]);

  useEffect(() => {
    if (!hint) return undefined;
    const id = window.setTimeout(() => setHint(null), 3500);
    return () => window.clearTimeout(id);
  }, [hint]);

  const onTapIdle = useCallback(async () => {
    if (run || busyStart) return;
    setBusyStart(true);
    setHint(null);
    if (!fixedOverride) {
      setHint(
        "위치 허용 창이 뜨면 「허용」을 눌러 주세요. 카카오톡·인스타 안쪽 브라우저에서는 창이 안 뜨거나 막히는 경우가 많아요. Safari·Chrome으로 열어 보세요.",
      );
    }
    try {
      const loc = await geoOnce(fixedOverride);
      const pick = await resolveVenueFromGps(loc);
      if (!pick.ok) {
        console.warn("[wechu] 줄 존 매칭 실패", pick.message, loc);
        setHint(pick.message);
        return;
      }
      const res = await startWaitSession({
        venueSlug: pick.slug,
        lat: loc.lat,
        lng: loc.lng,
      });
      if (!res.ok) {
        console.warn("[wechu] 세션 시작 거절", res.message, {
          venueSlug: pick.slug,
          loc,
        });
        setHint(res.message);
        return;
      }
      setHint(null);
      beginRun({
        sessionId: res.sessionId,
        venueName: res.venueName,
        startedAtMs: Date.parse(res.startedAtIso),
      });
    } catch (e) {
      setHint(e instanceof Error ? e.message : "시작하지 못했어요.");
    } finally {
      setBusyStart(false);
    }
  }, [beginRun, busyStart, fixedOverride, run]);

  const onTapRing = useCallback(() => {
    if (busyStart) return;
    if (run) {
      if (!endRunBusy) void endRun();
      return;
    }
    void onTapIdle();
  }, [busyStart, endRun, endRunBusy, onTapIdle, run]);

  const onTogglePlayStop = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (endRunBusy || busyStart) return;
      if (!run) {
        void onTapIdle();
        return;
      }
      void endRun();
    },
    [busyStart, endRun, endRunBusy, onTapIdle, run],
  );

  const toggleDisabled = endRunBusy || busyStart;

  return (
    <div
      className="relative flex min-h-0 flex-1 w-full flex-col overflow-hidden overscroll-none text-slate-900 [-webkit-overflow-scrolling:touch]"
      style={{
        backgroundImage: [
          "linear-gradient(180deg, color-mix(in srgb, var(--wechu-sub) 58%, transparent) 0%, color-mix(in srgb, #e3f0fd 52%, transparent) 42%, color-mix(in srgb, var(--wechu-main) 55%, transparent) 100%)",
          "url(/img/main-bg.jpg)",
        ].join(", "),
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center bottom",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 flex justify-center px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/55 bg-[color-mix(in_srgb,var(--wechu-base)_82%,transparent)] px-3.5 py-2 text-base font-semibold shadow-md backdrop-blur-md">
          <Star className="h-4 w-4 text-sky-800" aria-hidden />
          <span className="tabular-nums">{balance}</span>
        </div>
      </div>
      <p className="relative z-10 px-8 pt-[calc(env(safe-area-inset-top)+0.625rem)] pb-2 text-center text-sm text-slate-700">
        {run
          ? `${run.venueName} · 대기 중 — 원을 다시 탭하면 종료`
          : fixedOverride
            ? `고정 좌표: ${fixedOverride.label} — 원 탭 시 이 위치로 매칭`
            : "등록된 장소 근처에서 원을 탭해 GPS로 시작해 주세요."}
      </p>

      <header className="relative z-10 mt-6 flex shrink-0 px-4 pb-2 sm:mt-10">
        <div className="flex w-14 flex-col items-center gap-2">
          <Link
            href="/wechu"
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/50 bg-white/45 shadow-md backdrop-blur-md transition active:scale-95"
            aria-label="위츄"
          >
            <ShoppingBag className="h-6 w-6 text-sky-900" aria-hidden strokeWidth={2.2} />
          </Link>
          <Link
            href="/vote"
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/50 bg-white/45 shadow-md backdrop-blur-md transition active:scale-95"
            aria-label="투표"
          >
            <Vote className="h-6 w-6 text-sky-900" aria-hidden strokeWidth={2.2} />
          </Link>
        </div>
        <div className="flex-1" />
        <Link
          href="/recap"
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/50 bg-white/45 shadow-md backdrop-blur-md transition active:scale-95"
          aria-label="리캡"
        >
          <BarChart3 className="h-6 w-6 text-sky-900" aria-hidden strokeWidth={2.2} />
        </Link>
      </header>

      {hint ? (
        <div
          role="status"
          aria-live="polite"
          className="app-column-w pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.625rem)] z-[55] flex w-full max-w-none -translate-x-1/2 justify-center px-3"
        >
          <p className="pointer-events-auto flex w-full max-w-[min(100%,22rem)] items-center justify-center gap-x-2 rounded-[1.125rem] border border-rose-200/80 bg-[color-mix(in_srgb,var(--wechu-base)_94%,white)] px-4 py-2.5 text-center text-[13px] font-medium leading-snug text-rose-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
            <span className="min-w-0 flex-1 text-balance">{hint}</span>
            <button
              type="button"
              className="shrink-0 whitespace-nowrap text-xs font-semibold text-rose-800 underline-offset-2 hover:underline"
              onClick={() => setHint(null)}
            >
              닫기
            </button>
          </p>
        </div>
      ) : null}

      <div className="relative z-10 flex flex-1 min-h-0 -translate-y-12 flex-col items-center justify-center px-6 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.25rem))]">
        <div className="relative h-[296px] w-[296px] shrink-0">
          <div
            role="button"
            tabIndex={toggleDisabled ? -1 : 0}
            aria-disabled={toggleDisabled}
            aria-label={
              run
                ? `대기 시간 ${fmtClock(elapsedSec)}, 다시 탭하면 종료`
                : "GPS로 줄 줄 시작하기"
            }
            onClick={onTapRing}
            onKeyDown={(e) => {
              if (toggleDisabled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTapRing();
              }
            }}
            className={`relative flex h-full w-full flex-col items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-transparent transition focus-visible:ring-4 focus-visible:ring-[#c1e5ff]/90 ${toggleDisabled ? "cursor-not-allowed opacity-90" : "cursor-pointer active:scale-[0.985]"}`}
          >
            <svg
              className="-rotate-90"
              width={296}
              height={296}
              viewBox="-150 -150 300 300"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id="wechu-ring-g"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#7cb8f5" />
                </linearGradient>
              </defs>
              <circle
                r={R}
                cx={0}
                cy={0}
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={14}
              />
              <circle
                r={R}
                cx={0}
                cy={0}
                fill="none"
                stroke="url(#wechu-ring-g)"
                strokeWidth={14}
                strokeLinecap="round"
                strokeDasharray={`${CIR} ${CIR}`}
                style={{
                  strokeDashoffset: ringDashOffset,
                  transition:
                    run != null ? "stroke-dashoffset 400ms linear" : "none",
                }}
              />
            </svg>

            <div className="pointer-events-none absolute inset-[22%] rounded-full border-[3px] border-white/65 bg-[color-mix(in_srgb,var(--wechu-base)_55%,transparent)] shadow-inner backdrop-blur-sm" />

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
              {busyStart ? (
                <Loader2 className="h-10 w-10 animate-spin text-sky-800" aria-hidden />
              ) : (
                <>
                  <p className="pointer-events-none font-mono text-[2.125rem] font-bold tabular-nums tracking-tight text-sky-950 drop-shadow-sm">
                    {run ? fmtClock(elapsedSec) : "0:00"}
                  </p>
                  {endRunBusy ? (
                    <Loader2
                      className="pointer-events-none h-7 w-7 shrink-0 animate-spin text-sky-800"
                      aria-hidden
                    />
                  ) : (
                    <button
                      type="button"
                      className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-300/70 bg-[color-mix(in_srgb,var(--wechu-base)_92%,transparent)] text-sky-950 shadow-md backdrop-blur-sm transition hover:border-sky-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label={run ? "정지 · 대기 종료" : "재생 · 줄 시작"}
                      disabled={toggleDisabled}
                      onClick={onTogglePlayStop}
                    >
                      {run ? (
                        <Square className="h-3.5 w-3.5 fill-current" aria-hidden strokeWidth={0} />
                      ) : (
                        <Play className="h-4 w-4" aria-hidden strokeWidth={2.2} />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {fixedPresets && fixedPresets.length > 0 ? (
        <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+10.75rem)] left-3 right-3 z-20 mx-auto max-w-md rounded-xl border border-amber-400/70 bg-amber-50/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-900">
            고정 좌표 (config/geo-presets.ts) · {fixedPresets.length}곳
          </p>
          <div className="flex flex-wrap gap-1.5">
            {fixedPresets.map((p, i) => (
              <button
                key={`${p.label}-${p.lat}-${p.lng}`}
                type="button"
                onClick={() => setFixedPresetIdx(i)}
                className={`rounded-lg border px-2 py-1 text-left text-[11px] font-medium leading-tight transition ${
                  i === fixedPresetIdx
                    ? "border-amber-600 bg-amber-200/90 text-amber-950"
                    : "border-amber-300/80 bg-white/80 text-amber-950 hover:bg-amber-100/80"
                }`}
              >
                {p.label}
                <span className="mt-0.5 block font-mono text-[9px] font-normal text-amber-800/90">
                  {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-12 left-0 right-0 z-10 flex translate-y-[clamp(1rem,min(50px,6vh),52px)] justify-center px-8">
        <div className="pointer-events-none flex flex-col items-center gap-3">
          <div className="flex min-h-78 w-72 flex-col justify-center overflow-visible rounded-[4rem] border-0 bg-transparent px-6 py-6 shadow-none">
            <div className="flex min-h-60 w-full flex-1 items-center justify-center">
              <div className="relative h-60 w-60">
                <Image
                  src={WECHU_BASE_SPRITE_SRC}
                  alt=""
                  fill
                  sizes={HOME_CHAR_BASE_SIZES}
                  draggable={false}
                  className="object-contain object-center drop-shadow-lg"
                />
                {layers.topSrc ? (
                  <div className="pointer-events-none absolute left-[60%] top-[18%] h-[3.6rem] w-[3.6rem] -translate-x-1/2 rotate-35">
                    <Image
                      src={layers.topSrc}
                      alt=""
                      fill
                      sizes={HOME_CHAR_OVERLAY_TOP_SIZES}
                      draggable={false}
                      className="object-contain object-center"
                    />
                  </div>
                ) : null}
                {layers.midSrc ? (
                  <div className="pointer-events-none absolute left-1/2 top-[64%] h-[3.8rem] w-[3.8rem] -translate-x-1/2 -translate-y-1/2">
                    <Image
                      src={layers.midSrc}
                      alt=""
                      fill
                      sizes={HOME_CHAR_OVERLAY_SLOT_SIZES}
                      draggable={false}
                      className="object-contain object-center"
                    />
                  </div>
                ) : null}
                {layers.bottomSrc ? (
                  <div className="pointer-events-none absolute bottom-[12%] left-1/2 h-[3.8rem] w-[3.8rem] -translate-x-1/2">
                    <Image
                      src={layers.bottomSrc}
                      alt=""
                      fill
                      sizes={HOME_CHAR_OVERLAY_SLOT_SIZES}
                      draggable={false}
                      className="object-contain object-center"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
