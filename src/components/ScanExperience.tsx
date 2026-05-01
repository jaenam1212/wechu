"use client";

import { startWaitSession } from "@/app/actions/wait";
import { useWaitTimer } from "@/components/wait/WaitTimerContext";
import { Camera, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";

/** 스키마 `neon/migrations` 의 데모 장소 (서버에서 이 슬러그는 지오 검증 생략) */
const TEMP_DEMO_SLUG = "wechu-demo";

const SEOUL_DEMO = { lat: 37.5665, lng: 126.978 };

function geoPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("no-geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error("geo-denied")),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );
  });
}

/** 사진 스텁 플로우: GPS 실패해도 데모 좌표로 진행 (서버는 wechu-demo 지오 생략) */
async function coordsForStubStart(): Promise<{ lat: number; lng: number }> {
  try {
    return await geoPosition();
  } catch {
    return SEOUL_DEMO;
  }
}

export default function ScanExperience() {
  const { beginRun, run } = useWaitTimer();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const bootFromPhotoStub = useCallback(async () => {
    if (run) return;

    setBusy(true);
    setErr(null);

    try {
      const pos = await coordsForStubStart();

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
        startedAtMs: Date.parse(res.startedAtIso),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }, [beginRun, run]);

  const onFileChosen = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const hasFile = !!input.files && input.files.length > 0;
      if (!hasFile) return;

      void (async () => {
        await bootFromPhotoStub();
      })().finally(() => {
        input.value = "";
      });
    },
    [bootFromPhotoStub],
  );

  const openPicker = useCallback(() => pickerRef.current?.click(), []);

  const openCamera = useCallback(() => cameraRef.current?.click(), []);

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      {/* 카메라 전용은 일부 브라우저에서만 동작 — 갤러리용은 capture 없음 */}
      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFileChosen}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFileChosen}
      />

      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          줄 서기 시작
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          <strong className="font-medium text-zinc-800">사진 한 장</strong>(촬영·앨범
          무엇이든) 고르면 데모 장소 타이머가 시작합니다. 내용 분석 없음.
        </p>
      </header>

      {run ? (
        <p className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-zinc-800">
          타이머는 <strong>화면 최상단</strong>입니다. 종료 후 리워드를 받아요.
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
        <p className="mb-4 text-center text-sm text-zinc-600">
          사진·촬영을 끝내면 바로 시작해요.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy || !!run}
            onClick={openPicker}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 py-4 text-base font-semibold text-white shadow-md shadow-pink-600/25 transition hover:bg-pink-500 disabled:opacity-55"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" aria-hidden />
            )}
            사진·앨범에서 선택
          </button>
          <button
            type="button"
            disabled={busy || !!run}
            onClick={openCamera}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white py-4 text-base font-semibold text-pink-800 transition hover:bg-pink-50 disabled:opacity-55"
          >
            <Camera className="h-5 w-5" aria-hidden />
            카메라로 촬영
          </button>
        </div>
      </section>
    </div>
  );
}
