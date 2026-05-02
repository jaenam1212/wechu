"use server";

import { WECHU_ADMIN_COOKIE, mintAdminCookieValue, validateAdminPassword } from "@/lib/admin-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieOpts = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export type AdminLoginState = { ok: true } | { ok: false; error: string };

export async function loginAdmin(
  _prev: AdminLoginState | undefined,
  formData: FormData,
): Promise<AdminLoginState> {
  const pw = String(formData.get("password") ?? "");
  if (!validateAdminPassword(pw)) {
    return { ok: false, error: "비밀번호가 맞지 않습니다." };
  }

  const jar = await cookies();
  jar.set(WECHU_ADMIN_COOKIE, mintAdminCookieValue(), cookieOpts);
  redirect("/admin");
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(WECHU_ADMIN_COOKIE);
  redirect("/admin");
}
