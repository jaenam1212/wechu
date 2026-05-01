import {
  WECHU_UID_COOKIE,
  WECHU_UID_HEADER,
  isUuid,
} from "@/lib/auth/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(WECHU_UID_COOKIE)?.value;
  const uid =
    existing && isUuid(existing) ? existing : crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(WECHU_UID_HEADER, uid);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const needsCookie = !existing || !isUuid(existing);
  if (needsCookie) {
    response.cookies.set(WECHU_UID_COOKIE, uid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
