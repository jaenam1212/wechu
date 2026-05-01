import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const baseConfig: NextConfig = {};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

/**
 * 개발에서는 PWA 플러그인을 적용하지 않아 webpack 확장 없음 → Turbopack 기본 `next dev`와 충돌 없음.
 * 프로덕션 빌드(`next build --webpack`)에서만 Workbox/webpack을 씁니다.
 */
const isProduction = process.env.NODE_ENV === "production";

export default isProduction ? withPWA(baseConfig) : baseConfig;
