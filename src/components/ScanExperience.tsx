"use client";

import { endWaitSession, startWaitSession } from "@/app/actions/wait";
import { parseVenueFromQr } from "@/lib/qr";
import { Loader2 } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

function fmtClock(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function geoPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("이 환경에서는 위치를 쓸 수 없어요."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error("위치 권한이 필요합니다.")),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 14000 },
    );
  });
}

const SEOUL_DEMO = { lat: 37.5665, lng: 126.978 };

export default function ScanExperience() {
  const [manualSlug, setManualSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<"scan" | "run">("scan");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [venueLabel, setVenueLabel] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);
  const startedAtRef = useRef(0);

  const bootSession = useCallback(async (slug: string) => {
    setBusy(true);
    setErr(null);
    setRewardMsg(null);
    try {
      let pos: { lat: number; lng: number };
      try {
        pos = await geoPosition();
      } catch (e) {
        if (process.env.NEXT_PUBLIC_SKIP_GEO_VALIDATION === "true") {
          pos = SEOUL_DEMO;
          console.warn("geo fallback (NEXT_PUBLIC_SKIP_GEO_VALIDATION)", e);
        } else {
          throw e instanceof Error ? e : new Error("위치 오류");
        }
      }

      const res = await startWaitSession({
        venueSlug: slug,
        lat: pos.lat,
        lng: pos.lng,
      });
      if (!res.ok) {
        setErr(res.message);
        setPhase("scan");
        return;
      }
      startedAtRef.current = Date.now();
      setElapsed(0);
      setSessionId(res.sessionId);
      setVenueLabel(res.venueName);
      setPhase("run");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "시작하지 못했어요.");
      setPhase("scan");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (phase !== "scan") return undefined;

    const s = new Html5QrcodeScanner(
      "wechu-qr-reader",
      { fps: 8, qrbox: { width: 240, height: 240 } },
      false,
    );

    let handled = false;
    void s.render(
      (decoded) => {
        if (handled) return;
        const slug = parseVenueFromQr(decoded);
        if (!slug) {
          setErr("QR 형식을 인식하지 못했어요.");
          return;
        }
        handled = true;
        void s.clear().catch(() => {});
        void bootSession(slug);
      },
      () => {},
    );

    return () => {
      void s.clear().catch(() => {});
    };
  }, [phase, bootSession]);

  useEffect(() => {
    if (phase !== "run") return undefined;
    const id = window.setInterval(() => {
      setElapsed(
        Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)),
      );
    }, 500);
    return () => window.clearInterval(id);
  }, [phase]);

  const onManualStart = async () => {
    const slug = manualSlug.trim().toLowerCase();
    if (!slug) {
      setErr("장소 코드를 입력해 주세요.");
      return;
    }
    await bootSession(slug);
  };

  const onEnd = async () => {
    if (!sessionId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await endWaitSession(sessionId);
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      setRewardMsg(
        `대기 시간 ${fmtClock(res.durationSec)} · +${res.rewardPoints} 리워드`,
      );
      setPhase("scan");
      setSessionId(null);
      setVenueLabel("");
      setElapsed(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-white">QR 스캔 타이머</h1>
        <p className="text-sm text-zinc-400">
          현장 QR을 스캔하거나 데모용 코드를 입력하세요 ({`예: wechu-demo`}).{" "}
          <span className="text-zinc-500">
            (GPS는 geolib로 검증합니다. SKIP은 .env 참고.)
          </span>
        </p>
      </header>

      {rewardMsg ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {rewardMsg}
        </p>
      ) : null}

      {err ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {err}
        </p>
      ) : null}

      {phase === "scan" ? (
        <>
          <div
            id="wechu-qr-reader"
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 [&_video]:invert-0"
          />
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              또는 장소 코드
            </label>
            <div className="flex gap-2">
              <input
                value={manualSlug}
                onChange={(e) => setManualSlug(e.target.value)}
                placeholder="wechu-demo"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-pink-400/50"
              />
              <button
                type="button"
                onClick={() => void onManualStart()}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                시작
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 rounded-2xl border border-pink-500/30 bg-black/40 p-6">
          <div>
            <p className="text-xs text-zinc-500">현재 존</p>
            <p className="text-lg font-medium text-white">{venueLabel}</p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              타이머
            </p>
            <p className="mt-2 font-mono text-5xl tabular-nums text-pink-200">
              {fmtClock(elapsed)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onEnd()}
            disabled={busy}
            className="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                정리 중…
              </>
            ) : (
              "대기 종료 · 리워드 받기"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
