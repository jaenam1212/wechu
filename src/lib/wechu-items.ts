export const WECHU_BASE_SPRITE_SRC = encodeURI("/wechu/기본 위츄.png");

const TOP_BY_HAT_KEY: Record<string, string> = {
  hat_item3: encodeURI("/items/top/아이템3.png"),
  hat_item5: encodeURI("/items/top/아이템5.png"),
};

const MID_BY_BODY_KEY: Record<string, string> = {
  body_item4: encodeURI("/items/mid/아이템4.png"),
};

const BOTTOM_BY_ACC_KEY: Record<string, string> = {
  acc_item1: encodeURI("/items/bottom/아이템1.png"),
  acc_item2: encodeURI("/items/bottom/아이템2.png"),
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

