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
import { Loader2, MapPin, Pause, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const R = 118;
const CIR = 2 * Math.PI * R;
/** 링 한 바퀴 = 약 1시간 */
const RING_SECONDS = 3600;

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
}: {
  initialBalance: number;
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

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden text-slate-900"
      style={{
        background:
          "linear-gradient(180deg, var(--wechu-sub) 0%, #e3f0fd 42%, var(--wechu-main) 100%)",
      }}
    >
      <header className="relative z-10 flex px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
        <Link
          href="/wechu"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/50 bg-white/45 shadow-md backdrop-blur-md transition active:scale-95"
          aria-label="위츄"
        >
          <span className="text-xl" aria-hidden>
            🏬
          </span>
        </Link>
        <div className="flex flex-1 items-start justify-center gap-2 px-3 pt-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/55 bg-[color-mix(in_srgb,var(--wechu-base)_82%,transparent)] px-3 py-1.5 text-sm font-semibold shadow-md backdrop-blur-md">
            <MapPin className="h-4 w-4 text-sky-800" aria-hidden />
            <span className="tabular-nums">{balance}</span>
          </div>
        </div>
        <Link
          href="/recap"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/50 bg-white/45 shadow-md backdrop-blur-md transition active:scale-95"
          aria-label="리캡"
        >
          <span className="text-xl" aria-hidden>
            🔎
          </span>
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

      <p className="relative z-10 px-8 pb-3 text-center text-sm text-slate-700">
        {run
          ? `${run.venueName} · 대기 중`
          : fixedOverride
            ? `고정 좌표: ${fixedOverride.label} — 원 탭 시 이 위치로 매칭`
            : "등록된 장소 근처에서 원을 탭해 GPS로 시작해 주세요."}
      </p>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-[max(10.5rem,calc(env(safe-area-inset-bottom)+8rem))]">
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            aria-label={
              run
                ? `대기 시간 ${fmtClock(elapsedSec)}`
                : "GPS로 줄 줄 시작하기"
            }
            disabled={busyStart || endRunBusy}
            onClick={() => void (!run ? onTapIdle() : undefined)}
            className={`relative flex h-[296px] w-[296px] flex-col items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-transparent transition focus-visible:ring-4 focus-visible:ring-[#c1e5ff]/90 ${run || busyStart ? "" : "active:scale-[0.985]"}`}
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

            <div className="absolute flex flex-col items-center gap-1 text-center">
              {busyStart ? (
                <Loader2 className="h-10 w-10 animate-spin text-sky-800" aria-hidden />
              ) : (
                <>
                  <p className="font-mono text-[2.125rem] font-bold tabular-nums tracking-tight text-sky-950 drop-shadow-sm">
                    {run ? fmtClock(elapsedSec) : "0:00"}
                  </p>
                 
                  
                </>
              )}
            </div>
          </button>

          <div className="mt-5 flex h-14 items-center justify-center">
            {run ? (
              <button
                type="button"
                aria-label="대기 종료"
                disabled={endRunBusy}
                onClick={() => void endRun()}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/60 bg-white/50 shadow-lg backdrop-blur-md transition hover:bg-white/65 disabled:opacity-50"
              >
                {endRunBusy ? (
                  <Loader2 className="h-6 w-6 animate-spin text-sky-900" />
                ) : (
                  <Pause className="h-8 w-8 text-slate-900" aria-hidden strokeWidth={2.25} />
                )}
              </button>
            ) : (
              <span className="h-14 w-14" aria-hidden />
            )}
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

      <div className="pointer-events-none absolute bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] left-0 right-0 z-10 flex justify-center px-8">
        <div className="pointer-events-none flex flex-col items-center gap-3">
          <div className="flex min-h-[9.75rem] w-[9rem] flex-col justify-end overflow-visible rounded-[2rem] border border-sky-200/55 bg-[color-mix(in_srgb,var(--wechu-base)_58%,transparent)] px-3 pb-2 pt-5 shadow-xl backdrop-blur-md">
            <div className="flex w-full flex-1 items-end justify-center [min-height:7.5rem]">
              <Image
                src={encodeURI("/wechu/기본 위츄.png")}
                alt=""
                width={512}
                height={512}
                sizes="200px"
                quality={93}
                draggable={false}
                className="h-[7.5rem] w-auto max-w-[8.75rem] object-contain object-bottom drop-shadow-lg [image-rendering:auto]"
              />
            </div>
          </div>
          <Sparkles
            className="h-8 w-8 drop-shadow-md"
            aria-hidden
            style={{ color: "#c49a3dff" }}
          />
        </div>
      </div>

      <footer className="pointer-events-auto relative z-10 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 text-center text-[11px] font-semibold text-slate-600">
        <nav className="flex justify-center gap-4">
          <Link
            href="/vote"
            className="underline-offset-4 hover:text-slate-900 hover:underline"
          >
            투표
          </Link>
          <span aria-hidden>|</span>
          <Link
            href="/wechu"
            className="underline-offset-4 hover:text-slate-900 hover:underline"
          >
            위츄
          </Link>
          <span aria-hidden>|</span>
          <Link
            href="/recap"
            className="underline-offset-4 hover:text-slate-900 hover:underline"
          >
            리캡
          </Link>
        </nav>
      </footer>
    </div>
  );
}
