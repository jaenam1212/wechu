-- 방문 지역 요약(일별·국가) + 서버측 활동 로그

create table public.visit_geo_daily (
  day date not null,
  country text not null default 'ZZ',
  visits bigint not null default 0 check (visits >= 0),
  primary key (day, country)
);

create index visit_geo_daily_day_idx on public.visit_geo_daily (day desc);

create table public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  kind text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index app_events_created_at_idx on public.app_events (created_at desc);
create index app_events_kind_idx on public.app_events (kind);
