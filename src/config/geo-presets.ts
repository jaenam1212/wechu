export type GeoFixedPreset = Readonly<{
  lat: number;
  lng: number;
  label: string;
}>;

function isLat(n: number): boolean {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function isLng(n: number): boolean {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

/**
 * 홈 줄 시작 시 브라우저 GPS 대신, 아래에서 고른 좌표를 사용합니다.
 * 비우면 항상 실제 GPS만 씁니다.
 *
 * dev / prod 빌드 모두 번들에 포함되며, env 없이 이 파일만 수정하면 됩니다.
 * WGS84 십진 도 (구글맵 핀: 앞이 lat, 뒤가 lng). DB `venues` 반경 안이어야 서버가 통과시킵니다.
 *
 * 예 (001_init.sql 의 hall-a 중심 근처):
 *   { lat: 37.5796, lng: 126.9769, label: "A홀 시드" },
 */
export const GEO_FIXED_PRESETS: GeoFixedPreset[] = [
];

export function getGeoFixedPresets(): readonly GeoFixedPreset[] | null {
  const out: GeoFixedPreset[] = [];
  for (const p of GEO_FIXED_PRESETS) {
    if (!p || typeof p.label !== "string") continue;
    const label = p.label.trim();
    if (!label) continue;
    if (!isLat(p.lat) || !isLng(p.lng)) continue;
    out.push({ lat: p.lat, lng: p.lng, label });
  }
  return out.length ? out : null;
}
