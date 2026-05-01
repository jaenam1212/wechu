-- Neon SQL Editor에서 한 번 실행 (또는 neonctl db execute)
create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

create table public.venues (
  slug text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  radius_m int not null default 120 check (radius_m between 10 and 2000000)
);

create table public.wait_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  venue_slug text not null references public.venues (slug),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  reward_points int,
  duration_sec int,
  constraint wait_sessions_terminal_check check (
    (ended_at is null and duration_sec is null and reward_points is null)
    or
    (
      ended_at is not null
      and duration_sec is not null
      and reward_points is not null
    )
  )
);

create unique index wait_sessions_one_active_per_user on public.wait_sessions (user_id)
  where ended_at is null;

create table public.wallets (
  user_id uuid primary key references public.users (id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0)
);

create table public.wechu_items (
  item_key text primary key,
  name text not null,
  slot text not null check (slot in ('hat', 'body', 'acc')),
  cost int not null default 0 check (cost >= 0)
);

create table public.user_wechu_owned (
  user_id uuid not null references public.users (id) on delete cascade,
  item_key text not null references public.wechu_items (item_key),
  primary key (user_id, item_key)
);

create table public.wechu_avatar (
  user_id uuid primary key references public.users (id) on delete cascade,
  hat_key text not null default 'hat_default',
  body_key text not null default 'body_default',
  acc_key text not null default 'acc_default'
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0
);

create table public.outfit_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  option_id uuid not null references public.poll_options (id),
  reward_spent int not null check (reward_spent > 0),
  created_at timestamptz not null default now()
);

create or replace function public.bootstrap_user_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id) values (new.id);
  insert into public.wechu_avatar (user_id) values (new.id);
  insert into public.user_wechu_owned (user_id, item_key) values
    (new.id, 'hat_default'),
    (new.id, 'body_default'),
    (new.id, 'acc_default');
  return new;
end;
$$;

drop trigger if exists tr_users_bootstrap on public.users;

create trigger tr_users_bootstrap
  after insert on public.users
  for each row
execute function public.bootstrap_user_row();

insert into public.venues (slug, name, lat, lng, radius_m)
values ('wechu-demo', 'Wechu 데모 라인', 37.5665, 126.9780, 280),
       ('hall-a', 'A홀 줄서기 존', 37.5796, 126.9769, 200),
       ('line-custom-01', '커스텀 줄 존', 37.5461, 126.8791, 250),
       ('line-seoul-5682', '종로·동대문 인근 줄 존', 37.5682, 126.9977, 420),
       ('line-seoul-5416', '서울 동부 줄 존 A', 37.541616, 127.078827, 500),
       ('line-seoul-5398', '서울 동부 줄 존 B', 37.539857, 127.145226, 500)
on conflict (slug) do nothing;

insert into public.wechu_items (item_key, name, slot, cost) values
('hat_default', '기본 헤어밴드', 'hat', 0),
('hat_star', '스타 헤어밴드', 'hat', 180),
('hat_ribbon', '리본 핀', 'hat', 220),
('body_default', '기본 교복 세트', 'body', 0),
('body_idol', '아이돌 스테이지', 'body', 350),
('body_casual', '캐주얼 룩', 'body', 260),
('acc_default', '없음', 'acc', 0),
('acc_mic', '미니 마이크', 'acc', 140),
('acc_charm', '팬즈 참', 'acc', 160)
on conflict (item_key) do nothing;

insert into public.poll_options (id, label, sort_order) values
('a0000001-1111-4000-a000-aaaaaaaaaaaa'::uuid, '핑크 큐티 교복', 1),
('a0000002-2222-4000-a000-bbbbbbbbbbbb'::uuid, '청청 시티팝', 2),
('a0000003-3333-4000-a000-cccccccccccc'::uuid, '글리터 스테이지', 3)
on conflict (id) do nothing;
