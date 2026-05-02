import { logoutAdmin } from "@/app/actions/admin";
import type { AdminAnalytics } from "@/lib/admin-analytics";
import { fmtClock } from "@/lib/fmt-clock";
import Link from "next/link";

const nfKo = new Intl.NumberFormat("ko-KR");

function fmtPct(part: number, whole: number) {
  if (whole <= 0) return "—";
  return `${Math.round((100 * part) / whole)}%`;
}

function fmtJson(detail: unknown) {
  if (detail === null || detail === undefined) return "—";
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

function fmtWhen(d: string | Date) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: "Asia/Seoul",
    }).format(new Date(d));
  } catch {
    return String(d);
  }
}

export default function AdminDashboard({ data }: { data: AdminAnalytics }) {
  const ghostPct = fmtPct(data.ghosts, data.userCount);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">어드민 대시보드</h1>
          <p className="mt-1 text-sm text-zinc-600">
            이용자·대기·지갑·투표·베뉴·방문 국가(일별)·최근 이벤트 로그
          </p>
        </div>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="rounded-lg border border-sky-200/80 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-sky-50"
          >
            로그아웃
          </button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-sky-200/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            등록된 이용자
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900">
            {nfKo.format(data.userCount)}
            <span className="ml-1 text-base font-semibold text-zinc-600">명</span>
          </p>
          <dl className="mt-3 space-y-1 text-[13px] text-zinc-600">
            <div>
              <dt className="inline text-zinc-500">오늘(서울) 신규</dt>
              <dd className="ml-1 inline font-semibold text-zinc-800">
                {nfKo.format(data.signupTodaySeoul)}명
              </dd>
            </div>
            <div>
              <dt className="inline text-zinc-500">이번 주(ISO·서울)</dt>
              <dd className="ml-1 inline font-semibold text-zinc-800">
                {nfKo.format(data.signupWeekIsoSeoul)}명
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-sky-200/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            타이머(대기 세션)
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900">
            {fmtClock(data.totalDurationSec)}
          </p>
          <dl className="mt-3 space-y-1 text-[13px] text-zinc-600">
            <div>
              <dt className="inline text-zinc-500">완료 / 진행</dt>
              <dd className="ml-1 inline font-semibold text-zinc-800">
                {nfKo.format(data.completedSessions)}회 ·{" "}
                {nfKo.format(data.activeSessions)}건
              </dd>
            </div>
            <div>
              <dt className="inline text-zinc-500">오늘 완료</dt>
              <dd className="ml-1 inline font-semibold text-zinc-800">
                {nfKo.format(data.waitCompletedToday)}회 ·{" "}
                {fmtClock(data.waitDurationTodaySec)}
              </dd>
            </div>
            <div>
              <dt className="inline text-zinc-500">이번 주 완료</dt>
              <dd className="ml-1 inline font-semibold text-zinc-800">
                {nfKo.format(data.waitCompletedWeekIso)}회 ·{" "}
                {fmtClock(data.waitDurationWeekIsoSec)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-sky-200/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            유령 이용자
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900">
            {nfKo.format(data.ghosts)}
            <span className="ml-1 text-base font-semibold text-zinc-600">명</span>
          </p>
          <p className="mt-2 text-[13px] text-zinc-500">
            대기 세션·투표 기록이 전혀 없는 이용자. 전체 대비 {ghostPct}.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-sky-200/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            지갑·리워드 흐름
          </h2>
          <dl className="mt-3 space-y-2 text-sm text-zinc-800">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-600">지갑 잔고 합계</dt>
              <dd className="font-semibold tabular-nums">
                {nfKo.format(data.totalBalance)} LP
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-600">평균 잔고</dt>
              <dd className="font-semibold tabular-nums">
                {nfKo.format(Math.round(data.avgBalance))} LP
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-600">잔고 있는 사람</dt>
              <dd className="font-semibold tabular-nums">
                {nfKo.format(data.usersPositiveBalance)}명
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-sky-100 pt-2 text-[13px] text-zinc-600">
              <dt>≥ 100 LP / ≥ 500 LP</dt>
              <dd className="tabular-nums font-medium text-zinc-800">
                {nfKo.format(data.usersBalanceGe100)}명 ·{" "}
                {nfKo.format(data.usersBalanceGe500)}명
              </dd>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <dt className="text-zinc-600">대기로 지급된 리워드(합)</dt>
              <dd className="font-semibold tabular-nums">
                {nfKo.format(data.totalMintedRewardPoints)} pt
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-600">투표 소비 리워드(합)</dt>
              <dd className="font-semibold tabular-nums">
                {nfKo.format(data.totalVoteSpend)} LP
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">
            투표는 LP를 줄이고 대기 종료 시 pt가 지급되는 구조라, 항목 간 합이
            잔고와 1:1로 맞지 않을 수 있어요.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            헤메코 투표
          </h2>
          <p className="mt-2 text-[13px] text-zinc-600">
            총 {nfKo.format(data.totalVoteRows)}표 · 투표한 사람{" "}
            {nfKo.format(data.distinctVoters)}명 (중복 허용 시 표 수 ↑)
          </p>
          <div className="mt-4 space-y-2">
            {data.polls.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2 text-sm text-zinc-800"
              >
                <div className="font-medium">{p.label}</div>
                <div className="mt-1 text-[13px] text-zinc-600">
                  표 {nfKo.format(p.vote_count)} · 참여 {nfKo.format(p.voters)}명
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          코스메틱 보유 분포 (기본 장비 제외)
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          `user_wechu_owned`에 남아 있는 비기본 아이템별 인원입니다.
        </p>
        {data.itemOwnership.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">표시할 데이터가 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-sky-200/55 bg-white/90 shadow-sm backdrop-blur-sm">
            <table className="w-full min-w-md text-left text-sm">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  <th className="px-4 py-2.5">아이템</th>
                  <th className="px-4 py-2.5 tabular-nums">보유 인원</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {data.itemOwnership.map((row) => (
                  <tr key={row.item_key} className="text-zinc-800">
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.name}</span>
                      <span className="ml-2 text-xs text-zinc-400">
                        {row.item_key}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {nfKo.format(row.owners)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          방문 국가(국가 코드)
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          탭마다 한 번 서버 액션으로 카운트합니다. Vercel의 IP 국가 헤더를 씁니다.
          로컬·프록시 환경은 ZZ처럼 묶일 수 있어요. 마이그레이션 후 데이터가
          쌓입니다.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <GeoTable
            title="오늘(서울 기준 일)"
            rows={data.geoVisitsToday}
            emptyHint="오늘 수집된 국가가 없습니다."
          />
          <GeoTable
            title="최근 90일 누적"
            rows={data.geoVisits90d}
            emptyHint="방문 카운트가 없습니다."
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          등록 장소 베뉴(DB)
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          줄 서기 존 이름·좌표·반경(미터)입니다.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-sky-200/55 bg-white/90 shadow-sm backdrop-blur-sm">
          <table className="w-full min-w-xl text-left text-sm">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                <th className="px-4 py-2.5">슬러그</th>
                <th className="px-4 py-2.5">이름</th>
                <th className="px-4 py-2.5 tabular-nums">lat</th>
                <th className="px-4 py-2.5 tabular-nums">lng</th>
                <th className="px-4 py-2.5 tabular-nums">반경 m</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {data.venueMetas.map((v) => (
                <tr key={v.slug} className="text-zinc-800">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                    {v.slug}
                  </td>
                  <td className="px-4 py-3">{v.name}</td>
                  <td className="px-4 py-3 tabular-nums">{v.lat}</td>
                  <td className="px-4 py-3 tabular-nums">{v.lng}</td>
                  <td className="px-4 py-3 tabular-nums">{nfKo.format(v.radius_m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          완료 대기 많은 순(베뉴 슬러그)
        </h2>
        {data.byVenue.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">아직 완료된 대기 기록이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-sky-200/55 bg-white/90 shadow-sm backdrop-blur-sm">
            <table className="w-full min-w-md text-left text-sm">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  <th className="px-4 py-2.5">장소</th>
                  <th className="px-4 py-2.5 tabular-nums">완료 세션 수</th>
                  <th className="px-4 py-2.5 tabular-nums">누적 대기 시간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {data.byVenue.map((row) => (
                  <tr key={row.venue_slug} className="text-zinc-800">
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.venue_name}</span>
                      <span className="ml-2 text-xs text-zinc-400">
                        {row.venue_slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {nfKo.format(row.session_count)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {fmtClock(row.total_duration_sec)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          최근 서버 이벤트 로그
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          대기 시작·종료, 투표, 상점 구매, 장착 이후부터 쌓입니다(배포·마이그레이션
          이후).
        </p>
        {data.recentEvents.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">이벤트가 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-sky-200/55 bg-white/90 shadow-sm backdrop-blur-sm">
            <table className="w-full min-w-xl text-left text-xs">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/80 font-semibold uppercase tracking-wide text-zinc-600">
                  <th className="whitespace-nowrap px-3 py-2">시각(KST 표시)</th>
                  <th className="px-3 py-2">종류</th>
                  <th className="px-3 py-2 font-mono">user</th>
                  <th className="min-w-48 px-3 py-2">detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 font-mono text-[11px] text-zinc-800">
                {data.recentEvents.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                      {fmtWhen(e.created_at)}
                    </td>
                    <td className="px-3 py-2 font-semibold">{e.kind}</td>
                    <td className="max-w-32 truncate px-3 py-2 text-zinc-600">
                      {e.user_id ?? "—"}
                    </td>
                    <td className="break-all px-3 py-2 text-[11px]">
                      {fmtJson(e.detail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-zinc-500">
        <Link className="underline-offset-2 hover:underline" href="/">
          홈으로
        </Link>
      </p>
    </>
  );
}

function GeoTable({
  title,
  rows,
  emptyHint,
}: {
  title: string;
  rows: { country: string; visits: number }[];
  emptyHint: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-200/55 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">{emptyHint}</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm">
          {rows.map((r) => (
            <li
              key={`${title}-${r.country}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-sky-50/50 px-3 py-1.5"
            >
              <span className="font-semibold tracking-wide">{r.country}</span>
              <span className="tabular-nums text-zinc-700">
                {nfKo.format(r.visits)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
