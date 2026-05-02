import { logoutAdmin } from "@/app/actions/admin";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { fetchAdminAnalytics } from "@/lib/admin-analytics";
import { readAdminSession } from "@/lib/admin-session";
import Link from "next/link";

export default async function AdminPage() {
  const authed = await readAdminSession();

  if (!authed) {
    return (
      <main className="flex w-full flex-col gap-6 px-5 py-10">
        <header>
          <h1 className="text-2xl font-bold text-zinc-900">어드민</h1>
          <p className="mt-2 text-sm text-zinc-600">
            비밀번호를 입력하면 대시보드로 들어갈 수 있어요.
          </p>
        </header>
        <AdminLoginForm />
        <p className="text-center text-xs text-zinc-500">
          <Link className="underline-offset-2 hover:underline" href="/">
            홈으로
          </Link>
        </p>
      </main>
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <p className="text-sm text-zinc-600">
          `DATABASE_URL`이 없어 통계를 불러올 수 없습니다.
        </p>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="text-sm font-medium text-sky-800 underline-offset-2 hover:underline"
          >
            로그아웃
          </button>
        </form>
      </main>
    );
  }

  let data: Awaited<ReturnType<typeof fetchAdminAnalytics>> | null = null;
  try {
    data = await fetchAdminAnalytics();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <main className="flex w-full flex-col gap-4 px-5 py-10">
        <p className="text-sm text-zinc-600">
          DB에서 데이터를 불러오지 못했어요. `neon/migrations/008_admin_analytics.sql`
          적용 여부와 연결 문자열을 확인해 주세요.
        </p>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="text-sm font-medium text-sky-800 underline-offset-2 hover:underline"
          >
            로그아웃
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-col gap-8 px-5 py-8">
      <AdminDashboard data={data} />
    </main>
  );
}
