import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/wechu",
    name: "Wechu · 팬대기 타이머",
    short_name: "Wechu",
    description: "QR로 줄 시작 · 리워드 · 위츄 꾸미기 · 헤메코 투표",
    start_url: "/wechu",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
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
