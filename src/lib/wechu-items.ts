export const WECHU_BASE_SPRITE_SRC = encodeURI("/wechu/기본 위츄.png");

const TOP_BY_HAT_KEY: Record<string, string> = {
  hat_item3: encodeURI("/items/top/시온의 별 머리핀.png"),
  hat_item5: encodeURI("/items/top/사쿠야의 모자.png"),
};

const MID_BY_BODY_KEY: Record<string, string> = {
  body_item4: encodeURI("/items/mid/재희의 위꾸 리본.png"),
};

const BOTTOM_BY_ACC_KEY: Record<string, string> = {
  acc_item1: encodeURI("/items/bottom/리쿠의 두 번째 단추.png"),
  acc_item2: encodeURI("/items/bottom/유우시의 별 단추.png"),
};

export function getWechuOverlayLayers(
  hatKey: string,
  bodyKey: string,
  accKey: string,
): {
  topSrc: string | null;
  midSrc: string | null;
  bottomSrc: string | null;
} {
  return {
    topSrc: TOP_BY_HAT_KEY[hatKey] ?? null,
    midSrc: MID_BY_BODY_KEY[bodyKey] ?? null,
    bottomSrc: BOTTOM_BY_ACC_KEY[accKey] ?? null,
  };
}

/** 상점 그리드 썸네일 — 해당 슬롯 오버레이 PNG */
export function getItemThumbSrc(itemKey: string): string | null {
  return (
    TOP_BY_HAT_KEY[itemKey] ??
    MID_BY_BODY_KEY[itemKey] ??
    BOTTOM_BY_ACC_KEY[itemKey] ??
    null
  );
}

