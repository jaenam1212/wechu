/**
 * 모바일에서 고정만 쓰면 응답이 없거나 매우 느린 경우가 있어,
 * 저정밀 재시도 + 하드 타임아웃 + 권한/오류별 메시지를 둠.
 */

function mapPositionError(err: GeolocationPositionError): Error {
  if (err.code === err.PERMISSION_DENIED) {
    return new Error(
      '위치 권한이 꺼져 있어요. 주소창 자물쇠 또는 설정에서 이 사이트의 「위치」를 허용한 뒤 다시 탭해 주세요.',
    );
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return new Error(
      "단말이 위치를 알려 주지 않아요. GPS·네트워크 위치를 켠 뒤 다시 시도해 주세요.",
    );
  }
  if (err.code === err.TIMEOUT) {
    return new Error(
      "위치 확인 시간이 초과됐어요. 실내·지하에서는 밖으로 나간 뒤 다시 탭해 주세요.",
    );
  }
  return new Error("위치를 가져오지 못했어요.");
}

function waitForPosition(opts: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("이 환경에서는 위치 API를 쓸 수 없어요."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

/** 일부 브라우저는 timeout 이후에도 콜백을 안 부름 → 강제 상한 */
function withHardCap<T>(
  p: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let settled = false;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }, ms);
    p.then(
      (v) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export type BrowserGeoCoords = Readonly<{
  lat: number;
  lng: number;
  accuracy_m: number | null;
}>;

export async function getBrowserGeoCoordinates(): Promise<BrowserGeoCoords> {
  const hardCapHighMs = 14_000;
  const hardCapLowMs = 19_000;

  try {
    const pos = await withHardCap(
      waitForPosition({
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10_000,
      }),
      hardCapHighMs,
      "위치 응답이 없어요. 권한 팝업을 허용했는지 확인하거나, 인앱 브라우저(카톡·인스타 등)에서는 Safari·Chrome으로 열어 보세요.",
    );
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    return { lat, lng, accuracy_m: accuracy ?? null };
  } catch (eHigh) {
    console.warn("[wechu] 고정밀 GPS 실패, 저정밀·캐시 허용으로 재시도", eHigh);
    try {
      const pos = await withHardCap(
        waitForPosition({
          enableHighAccuracy: false,
          maximumAge: 120_000,
          timeout: 15_000,
        }),
        hardCapLowMs,
        "위치를 아직 받지 못했어요. 브라우저 설정에서 위치를 허용했는지, 사이트를 https로 여는지 확인해 주세요.",
      );
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      return { lat, lng, accuracy_m: accuracy ?? null };
    } catch (eLow) {
      if (eLow instanceof GeolocationPositionError) {
        throw mapPositionError(eLow);
      }
      if (eLow instanceof Error) throw eLow;
      throw new Error("위치를 확인하지 못했어요.");
    }
  }
}
