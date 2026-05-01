"use client";

import { startWaitSession } from "@/app/actions/wait";
import { useWaitTimer } from "@/components/wait/WaitTimerContext";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

const CAMERA_INPUT_ID = "wechu-camera-only";

/** 스키마 `neon/migrations` 의 데모 장소 — 서버에서 반경 검증 생략 */
const TEMP_DEMO_SLUG = "wechu-demo";

/** 모바일에서 geolocation 이 응답 없이 걸리면 스피너만 도는 증상이 있어, 데모 플로우는 고정 좌표만 전달 */
const STUB_COORDS = { lat: 37.5665, lng: 126.978 };

export default function ScanExperience() {
  const { beginRun, run } = useWaitTimer();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** 라벨 이중 탭 방지 — 진행 중엔 라벨만 막고, 파일 input 은 busy 때도 비활성하지 않음(iOS 안정화) */
  const labelBlocked = busy || !!run;
  const inputDisabled = !!run;

  const bootFromPhotoStub = useCallback(async () => {
    if (run) return;

    setBusy(true);
    setErr(null);

    try {
      const res = await startWaitSession({
        venueSlug: TEMP_DEMO_SLUG,
        lat: STUB_COORDS.lat,
        lng: STUB_COORDS.lng,
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
      if (!input.files?.length) return;

      void bootFromPhotoStub().finally(() => {
        input.value = "";
      });
    },
    [bootFromPhotoStub],
  );

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      <input
        id={CAMERA_INPUT_ID}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={false}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={inputDisabled}
        onChange={onFileChosen}
      />

      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          줄 서기 시작
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          <strong className="font-medium text-zinc-800">카메라로 촬영</strong> 후 저장하면 줄
          대기가 시작돼요. (데모: 위치 권한 없이 진행)
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
        <p className="mb-6 text-center text-sm text-zinc-600">
          셔터를 눌러 저장하면 줄 대기가 바로 시작해요.
        </p>

        <label
          htmlFor={CAMERA_INPUT_ID}
          className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-pink-600 py-4 text-base font-semibold text-white shadow-md shadow-pink-600/25 transition hover:bg-pink-500 ${labelBlocked ? "pointer-events-none opacity-55" : ""}`}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-5 w-5" aria-hidden />
          )}
          카메라로 촬영해서 시작
        </label>
      </section>
    </div>
  );
}
