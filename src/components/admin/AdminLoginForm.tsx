"use client";

import { loginAdmin, type AdminLoginState } from "@/app/actions/admin";
import { useActionState } from "react";

const initial: AdminLoginState = { ok: false, error: "" };

export default function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initial);

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-sky-200/70 bg-white/80 p-6 shadow-lg shadow-sky-900/5 backdrop-blur-sm"
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        비밀번호
        <input
          autoComplete="off"
          name="password"
          type="password"
          required
          className="rounded-xl border border-sky-200/80 bg-white px-3 py-2 text-base text-zinc-900 outline-none ring-sky-300/35 focus-visible:ring-2"
          placeholder="어드민 비밀번호"
        />
      </label>
      {state && !state.ok && state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? "확인 중…" : "들어가기"}
      </button>
    </form>
  );
}
