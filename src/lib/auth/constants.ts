/** Edge 미들웨어에서도 안전하게 import (DB/서버만 모듈 없음) */

export const WECHU_UID_COOKIE = "wechu_uid";
export const WECHU_UID_HEADER = "x-wechu-uid";

export function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}
