import "server-only";

import { getSql } from "@/lib/db/neon";
import { neonRows } from "@/lib/db/rows";

export type AdminVenueRow = {
  venue_slug: string;
  venue_name: string;
  session_count: number;
  total_duration_sec: number;
};

export type AdminPollRow = {
  id: string;
  label: string;
  sort_order: number;
  vote_count: number;
  voters: number;
};

export type AdminVenueMetaRow = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
};

export type AdminGeoVisitRow = {
  country: string;
  visits: number;
};

export type AdminEventRow = {
  id: string;
  user_id: string | null;
  kind: string;
  detail: unknown;
  created_at: string | Date;
};

export type AdminItemOwnershipRow = {
  item_key: string;
  name: string;
  owners: number;
};

export type AdminAnalytics = {
  userCount: number;
  signupTodaySeoul: number;
  signupWeekIsoSeoul: number;
  completedSessions: number;
  activeSessions: number;
  totalDurationSec: number;
  waitCompletedToday: number;
  waitDurationTodaySec: number;
  waitCompletedWeekIso: number;
  waitDurationWeekIsoSec: number;
  byVenue: AdminVenueRow[];
  ghosts: number;
  totalBalance: number;
  avgBalance: number;
  usersPositiveBalance: number;
  usersBalanceGe100: number;
  usersBalanceGe500: number;
  totalMintedRewardPoints: number;
  totalVoteSpend: number;
  totalVoteRows: number;
  distinctVoters: number;
  polls: AdminPollRow[];
  venueMetas: AdminVenueMetaRow[];
  geoVisits90d: AdminGeoVisitRow[];
  geoVisitsToday: AdminGeoVisitRow[];
  recentEvents: AdminEventRow[];
  itemOwnership: AdminItemOwnershipRow[];
};

function numBig(v: string | number | bigint | undefined | null): number {
  if (v === undefined || v === null) return 0;
  return Number(v);
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const sql = getSql();

  const [
    u,
    signupWin,
    agg,
    waitWin,
    byVenue,
    ghosts,
    wall,
    minted,
    voteAgg,
    polls,
    venueMetas,
    geo90,
    geoToday,
    events,
    items,
  ] = await Promise.all([
    sql`SELECT count(*)::int AS c FROM users`,
    sql`
      SELECT
        count(*) FILTER (
          WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date =
                (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date
        )::int AS today_users,
        count(*) FILTER (
          WHERE to_char(
            (created_at AT TIME ZONE 'Asia/Seoul'),
            'IYYY-IW'
          ) =
          to_char(
            (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul'),
            'IYYY-IW'
          )
        )::int AS week_users
      FROM users
    `,
    sql`
      SELECT
        count(*) FILTER (WHERE ended_at IS NOT NULL)::int AS completed_sessions,
        coalesce(
          sum(duration_sec) FILTER (WHERE ended_at IS NOT NULL),
          0
        )::bigint AS total_duration_sec,
        count(*) FILTER (WHERE ended_at IS NULL)::int AS active_sessions
      FROM wait_sessions
    `,
    sql`
      SELECT
        count(*) FILTER (
          WHERE ended_at IS NOT NULL
            AND (
              ended_at AT TIME ZONE 'Asia/Seoul'
            )::date =
            (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date
        )::int AS wait_completed_today,
        coalesce(
          sum(duration_sec) FILTER (
            WHERE ended_at IS NOT NULL
              AND (
                ended_at AT TIME ZONE 'Asia/Seoul'
              )::date =
              (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date
          ),
          0
        )::bigint AS wait_duration_today_sec,
        count(*) FILTER (
          WHERE ended_at IS NOT NULL
            AND to_char((ended_at AT TIME ZONE 'Asia/Seoul'), 'IYYY-IW') =
                to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul'), 'IYYY-IW')
        )::int AS wait_completed_week_iso,
        coalesce(
          sum(duration_sec) FILTER (
            WHERE ended_at IS NOT NULL
              AND to_char((ended_at AT TIME ZONE 'Asia/Seoul'), 'IYYY-IW') =
                  to_char((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul'), 'IYYY-IW')
          ),
          0
        )::bigint AS wait_duration_week_iso_sec
      FROM wait_sessions
    `,
    sql`
      SELECT
        ws.venue_slug,
        coalesce(v.name, ws.venue_slug) AS venue_name,
        count(*)::int AS session_count,
        coalesce(sum(ws.duration_sec), 0)::bigint AS total_duration_sec
      FROM wait_sessions ws
      LEFT JOIN venues v ON v.slug = ws.venue_slug
      WHERE ws.ended_at IS NOT NULL
      GROUP BY ws.venue_slug, v.name
      ORDER BY session_count DESC, ws.venue_slug ASC
    `,
    sql`
      SELECT count(*)::int AS c
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM wait_sessions w WHERE w.user_id = u.id
      )
        AND NOT EXISTS (
          SELECT 1 FROM outfit_votes ov WHERE ov.user_id = u.id
        )
    `,
    sql`
      SELECT
        coalesce(sum(balance), 0)::bigint AS total_balance,
        coalesce(avg(balance), 0)::float8 AS avg_balance,
        count(*) FILTER (WHERE balance > 0)::int AS users_positive,
        count(*) FILTER (WHERE balance >= 100)::int AS ge100,
        count(*) FILTER (WHERE balance >= 500)::int AS ge500
      FROM wallets
    `,
    sql`
      SELECT coalesce(sum(reward_points), 0)::bigint AS pts
      FROM wait_sessions
      WHERE ended_at IS NOT NULL
    `,
    sql`
      SELECT
        coalesce(sum(reward_spent), 0)::bigint AS spent,
        count(*)::int AS rows,
        count(DISTINCT user_id)::int AS voters
      FROM outfit_votes
    `,
    sql`
      SELECT
        p.id::text AS id,
        p.label,
        p.sort_order,
        count(v.id)::int AS vote_count,
        count(DISTINCT v.user_id)::int AS voters
      FROM poll_options p
      LEFT JOIN outfit_votes v ON v.option_id = p.id
      GROUP BY p.id, p.label, p.sort_order
      ORDER BY p.sort_order ASC, p.label ASC
    `,
    sql`
      SELECT slug, name, lat, lng, radius_m
      FROM venues
      ORDER BY slug ASC
    `,
    sql`
      SELECT country, sum(visits)::bigint AS visits
      FROM visit_geo_daily
      WHERE day >= (
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date - 90
      )
      GROUP BY country
      ORDER BY visits DESC, country ASC
      LIMIT 40
    `,
    sql`
      SELECT country, visits
      FROM visit_geo_daily
      WHERE day =
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date
      ORDER BY visits DESC NULLS LAST, country ASC
      LIMIT 40
    `,
    sql`
      SELECT id::text AS id,
        user_id::text AS user_id,
        kind,
        detail,
        created_at
      FROM app_events
      ORDER BY created_at DESC NULLS LAST
      LIMIT 100
    `,
    sql`
      SELECT uwo.item_key, wi.name, count(*)::int AS owners
      FROM user_wechu_owned uwo
      JOIN wechu_items wi ON wi.item_key = uwo.item_key
      WHERE uwo.item_key NOT IN ('hat_default', 'body_default', 'acc_default')
      GROUP BY uwo.item_key, wi.name
      ORDER BY owners DESC, uwo.item_key ASC
      LIMIT 40
    `,
  ]);

  const signupRow = neonRows<{ today_users: number; week_users: number }>(
    signupWin,
  )[0];

  const a = neonRows<{
    completed_sessions: number;
    total_duration_sec: string | number | bigint;
    active_sessions: number;
  }>(agg)[0];

  const w = neonRows<{
    wait_completed_today: number;
    wait_duration_today_sec: string | number | bigint;
    wait_completed_week_iso: number;
    wait_duration_week_iso_sec: string | number | bigint;
  }>(waitWin)[0];

  const wm = neonRows<{
    total_balance: string | number | bigint;
    avg_balance: number;
    users_positive: number;
    ge100: number;
    ge500: number;
  }>(wall)[0];

  const va = neonRows<{
    spent: string | number | bigint;
    rows: number;
    voters: number;
  }>(voteAgg)[0];

  const pt = neonRows<{ pts: string | number | bigint }>(minted)[0];

  const byVenueRows = neonRows<{
    venue_slug: string;
    venue_name: string;
    session_count: number;
    total_duration_sec: string | number | bigint;
  }>(byVenue);

  return {
    userCount: Number(neonRows<{ c: number }>(u)[0]?.c ?? 0),
    signupTodaySeoul: Number(signupRow?.today_users ?? 0),
    signupWeekIsoSeoul: Number(signupRow?.week_users ?? 0),
    completedSessions: Number(a?.completed_sessions ?? 0),
    activeSessions: Number(a?.active_sessions ?? 0),
    totalDurationSec: Number(a?.total_duration_sec ?? 0),
    waitCompletedToday: Number(w?.wait_completed_today ?? 0),
    waitDurationTodaySec: Number(w?.wait_duration_today_sec ?? 0),
    waitCompletedWeekIso: Number(w?.wait_completed_week_iso ?? 0),
    waitDurationWeekIsoSec: Number(w?.wait_duration_week_iso_sec ?? 0),
    byVenue: byVenueRows.map((r) => ({
      venue_slug: r.venue_slug,
      venue_name: r.venue_name,
      session_count: r.session_count,
      total_duration_sec: Number(r.total_duration_sec ?? 0),
    })),
    ghosts: Number(neonRows<{ c: number }>(ghosts)[0]?.c ?? 0),
    totalBalance: numBig(wm?.total_balance),
    avgBalance: Number(wm?.avg_balance ?? 0),
    usersPositiveBalance: Number(wm?.users_positive ?? 0),
    usersBalanceGe100: Number(wm?.ge100 ?? 0),
    usersBalanceGe500: Number(wm?.ge500 ?? 0),
    totalMintedRewardPoints: numBig(pt?.pts),
    totalVoteSpend: numBig(va?.spent),
    totalVoteRows: Number(va?.rows ?? 0),
    distinctVoters: Number(va?.voters ?? 0),
    polls: neonRows<AdminPollRow>(polls),
    venueMetas: neonRows<AdminVenueMetaRow>(venueMetas),
    geoVisits90d: neonRows<{ country: string; visits: string | number | bigint }>(
      geo90,
    ).map((r) => ({ country: r.country, visits: Number(r.visits ?? 0) })),
    geoVisitsToday: neonRows<{ country: string; visits: string | number | bigint }>(
      geoToday,
    ).map((r) => ({ country: r.country, visits: Number(r.visits ?? 0) })),
    recentEvents: neonRows<AdminEventRow>(events),
    itemOwnership: neonRows<AdminItemOwnershipRow>(items),
  };
}
