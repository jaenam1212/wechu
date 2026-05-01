/** QR 텍스트 → venues.slug 후보를 뽑습니다 (html5-qrcode 스캔 결과). */

export function parseVenueFromQr(raw: string): string | null {
  const trimmed = raw.trim();
  try {
    const j = JSON.parse(trimmed) as { venue?: string; slug?: string };
    if (typeof j.venue === "string") return j.venue.toLowerCase();
    if (typeof j.slug === "string") return j.slug.toLowerCase();
  } catch {
    /* not json */
  }
  try {
    const u = new URL(trimmed);
    const qp =
      u.searchParams.get("venue") ??
      u.searchParams.get("slug") ??
      u.searchParams.get("q");
    if (qp) return qp.toLowerCase();
    const parts = u.pathname.split("/").filter(Boolean);
    const tail = parts.at(-1);
    if (tail && /^[a-z0-9][a-z0-9-]{0,79}$/.test(tail)) return tail.toLowerCase();
    return null;
  } catch {
    if (/^[a-z0-9][a-z0-9-]{0,79}$/.test(trimmed))
      return trimmed.toLowerCase();
    return null;
  }
}
