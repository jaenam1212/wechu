"use client";

import { startWaitSession } from "@/app/actions/wait";
import { useWaitTimer } from "@/components/wait/WaitTimerContext";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";

/** 디버깅용: 아무 장소 코드 대신 고정 장소로 세션을 엽니다 (스키마 `wechu-demo`). */
const TEMP_DEMO_SLUG = "wechu-demo";

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
  const { beginRun, run } = useWaitTimer();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const captureRef = useRef<HTMLInputElement>(null);

  const bootFromPhotoPlaceholder = useCallback(async () => {
    if (run) return;

    setBusy(true);
    setErr(null);

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
        venueSlug: TEMP_DEMO_SLUG,
        lat: pos.lat,
        lng: pos.lng,
      });

      if (!res.ok) {
        setErr(res.message);
        return;
      }

      beginRun({
        sessionId: res.sessionId,
        venueName: res.venueName,
        startedAtMs: Date.now(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }, [beginRun, run]);

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      <input
        ref={captureRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          e.target.value = "";
          void bootFromPhotoPlaceholder();
        }}
      />

      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          줄 서기 시작
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          임시로 <strong className="font-medium text-zinc-800">사진 한 장 찍으면</strong>
          바로 줄 대기 타이머가 올라갑니다. (실제 줄 위치 검증 없음)
          <br />
          위치 권한은 장소 검증용으로만 쓰이며, SKIP 설정은 문서 참고해 주세요.
        </p>
      </header>

      {run ? (
        <p className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-zinc-800">
          타이머는 <strong>화면 최상단</strong>에서 돌아가요. 종료도 거기서 눌러 리워드를
          받을 수 있어요.
        </p>
      ) : null}

      {err ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 p-8 shadow-sm">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-pink-100 text-pink-600 ring-8 ring-pink-50">
          <Sparkles className="h-14 w-14" strokeWidth={1.25} aria-hidden />
        </div>
        <p className="mb-6 text-center text-sm text-zinc-600">
          사진 선택·촬영이 끝나면 즉시 타이머가 시작해요.
        </p>
        <button
          type="button"
          disabled={busy || !!run}
          onClick={() => captureRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 py-4 text-base font-semibold text-white shadow-md shadow-pink-600/25 transition hover:bg-pink-500 disabled:opacity-55"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" aria-hidden />
          )}
          사진 찍어서 시작
        </button>
      </section>
    </div>
  );
}
