/**
 * `public/wechu` 에 넣은 전신 일러스트 PNG와 게임 상태 연결.
 * 파일명 변경 시 여기 매핑만 맞추면 됩니다.
 *
 * 우선순위: 스타 헤어밴드 착용 시 안테로스 스프라이트 → 의상(body)별 기본/에로스/poppop
 */
export function wechuSpriteUrl(hatKey: string, bodyKey: string): string {
  let file: string;
  if (hatKey === "hat_star") {
    file = "안테로스 위츄.png";
  } else {
    switch (bodyKey) {
      case "body_default":
        file = "기본 위츄.png";
        break;
      case "body_idol":
        file = "에로스 위츄.png";
        break;
      case "body_casual":
        file = "poppop 위츄.png";
        break;
      default:
        file = "기본 위츄.png";
    }
  }
  return `/wechu/${encodeURIComponent(file)}`;
}
