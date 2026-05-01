import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Wechu · 팬대기 타이머",
    short_name: "Wechu",
    description: "QR로 줄 시작 · 리워드 · 위츄 꾸미기 · 헤메코 투표",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#101018",
    theme_color: "#ff4f8f",
    orientation: "portrait-primary",
    lang: "ko",
    icons: [
      {
        src: "/icons/icon-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-any.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
