-- Tarot (subsystem 4): a profile that personalises readings, and a daily check-in that pays
-- coins. Readings themselves are computed in the browser and never stored.
--
-- Days are Bangkok days: a check-in at 23:59 and another at 00:01 Bangkok time are two days.
-- Coins only move inside tarot.check_in(): nobody can insert a check-in row or edit a total.

create schema if not exists tarot;
grant usage on schema tarot to authenticated, service_role;

create function tarot.touch_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── profiles: one per user, written by its owner ──
create table tarot.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 30),
  birth_date date check (birth_date between date '1900-01-01' and date '2100-01-01'),
  gender text not null default 'unspecified'
    check (gender in ('male', 'female', 'lgbtq', 'unspecified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table tarot.profiles is 'Nickname, birthday and gender a reader gives for personal readings.';
alter table tarot.profiles enable row level security;
create trigger touch before update on tarot.profiles
  for each row execute function tarot.touch_updated_at();

create policy "own profile: read" on tarot.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own profile: create" on tarot.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own profile: edit" on tarot.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update (nickname, birth_date, gender) on tarot.profiles to authenticated;

-- ── check-ins: one row per user per Bangkok day; only check_in() writes ──
create table tarot.checkins (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  coins integer not null check (coins between 1 and 100),
  primary key (user_id, day)
);
comment on table tarot.checkins is 'Daily check-ins and the coins each paid. Written by tarot.check_in() only.';
alter table tarot.checkins enable row level security;
create policy "own check-ins: read" on tarot.checkins
  for select to authenticated using (user_id = (select auth.uid()));
grant select on tarot.checkins to authenticated;

-- today, in Bangkok
create function tarot.today() returns date
language sql stable set search_path = ''
as $$
  select (now() at time zone 'Asia/Bangkok')::date;
$$;

-- consecutive check-in days ending on `until` (0 when that day has none)
create function tarot.streak(who uuid, until date) returns integer
language sql stable set search_path = ''
as $$
  with recursive run (day) as (
    select until
    where exists (select 1 from tarot.checkins c where c.user_id = who and c.day = until)
    union all
    select run.day - 1 from run
    where exists (select 1 from tarot.checkins c where c.user_id = who and c.day = run.day - 1)
  )
  select count(*)::integer from run;
$$;

-- the caller's total coins, current streak (still alive if they checked in yesterday) and today
create function tarot.my_status()
returns table (coins integer, streak integer, checked_today boolean)
language sql stable set search_path = ''
as $$
  select
    coalesce((select sum(c.coins) from tarot.checkins c where c.user_id = (select auth.uid())), 0)::integer,
    greatest(
      tarot.streak((select auth.uid()), tarot.today()),
      tarot.streak((select auth.uid()), tarot.today() - 1)
    ),
    exists (
      select 1 from tarot.checkins c
      where c.user_id = (select auth.uid()) and c.day = tarot.today()
    );
$$;

-- check in for today: 10 coins, 30 on every 7th day in a row; a second call the same day pays 0
create function tarot.check_in()
returns table (coins integer, streak integer, checked_today boolean, earned integer)
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  who uuid := auth.uid();
  d date := tarot.today();
  pay integer;
begin
  if who is null then
    raise exception 'sign in to check in' using errcode = '28000';
  end if;
  pay := case when (tarot.streak(who, d - 1) + 1) % 7 = 0 then 30 else 10 end;
  insert into tarot.checkins (user_id, day, coins) values (who, d, pay)
    on conflict do nothing;
  if not found then
    pay := 0;
  end if;
  return query select s.coins, s.streak, s.checked_today, pay from tarot.my_status() s;
end;
$$;

revoke execute on function tarot.today(), tarot.streak(uuid, date), tarot.my_status(),
  tarot.check_in() from public;
grant execute on function tarot.today(), tarot.streak(uuid, date), tarot.my_status(),
  tarot.check_in() to authenticated;
