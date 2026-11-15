-- The hub's account layer, shared by every app: one profile per person (name + bio, edited at the
-- hub's /profile), the pages each signed-in person opens (hub.visits), who is online right now
-- (hub.online heartbeats), and the back office that sees and controls every account (admin_*
-- functions, admins = cms.admins).
--
-- Only signed-in people are counted: anonymous traffic is Cloudflare's job (Web Analytics), so
-- nobody can fill this table without an account. Signup is closed before launch.

create schema if not exists hub;
grant usage on schema hub to anon, authenticated, service_role;

-- ── profiles: what a person calls themselves across the apps ──
create table hub.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 280),
  updated_at timestamptz not null default now()
);
alter table hub.profiles enable row level security;
create policy "people read their own profile" on hub.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "people create their own profile" on hub.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "people edit their own profile" on hub.profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert (user_id, display_name, bio), update (display_name, bio) on hub.profiles to authenticated;

create function hub.touch_profile() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  new.display_name := btrim(new.display_name);
  return new;
end;
$$;
create trigger touch before insert or update on hub.profiles
  for each row execute function hub.touch_profile();

-- ── visits: one row per page a signed-in person opens, in any app ──
create table hub.visits (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  app text not null check (app ~ '^[a-z0-9-]{1,32}$'),
  path text not null check (char_length(path) between 1 and 200 and left(path, 1) = '/'),
  at timestamptz not null default now()
);
create index visits_at on hub.visits (at desc);
create index visits_user_at on hub.visits (user_id, at desc);
alter table hub.visits enable row level security;
create policy "people read their own visits" on hub.visits
  for select to authenticated using (user_id = (select auth.uid()));
create policy "people log their own visits" on hub.visits
  for insert to authenticated with check (user_id = (select auth.uid()));
grant select, insert (app, path) on hub.visits to authenticated;

-- a stolen or buggy session cannot flood the table: 60 pages a minute per person is plenty
create function hub.visit_rate() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select count(*) from hub.visits
      where user_id = new.user_id and at > now() - interval '1 minute') >= 60 then
    raise exception 'too many visits' using errcode = '54000';
  end if;
  return new;
end;
$$;
create trigger rate before insert on hub.visits
  for each row execute function hub.visit_rate();

-- ── admin_actions: every ban and admin change, with who did it ──
create table hub.admin_actions (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid references auth.users (id) on delete set null,
  target uuid references auth.users (id) on delete set null,
  action text not null check (action in ('ban', 'unban', 'make_admin', 'remove_admin'))
);
alter table hub.admin_actions enable row level security;
-- no policies and no grants: only the admin functions below read or write it

-- ── online: a heartbeat row per signed-in person (written on every page and every 30 s) ──
-- online = seen in the last 90 s. Realtime Presence was not used: joining its channel needs read
-- rights, which would show everyone who else is online. Here people write only their own row and
-- only admins read the table (live, through Realtime postgres_changes).
create table hub.online (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  app text not null check (app ~ '^[a-z0-9-]{1,32}$'),
  path text not null check (char_length(path) between 1 and 200 and left(path, 1) = '/'),
  seen_at timestamptz not null default now()
);
alter table hub.online enable row level security;
create policy "people keep their own heartbeat" on hub.online
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "people refresh their own heartbeat" on hub.online
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "admins see who is online, people see themselves" on hub.online
  for select to authenticated
  using (user_id = (select auth.uid()) or (select cms.is_admin()));
grant select, insert (user_id, app, path), update (app, path, seen_at) on hub.online to authenticated;

create function hub.touch_online() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.seen_at := now(); -- the server's clock, never the client's
  return new;
end;
$$;
create trigger touch before insert or update on hub.online
  for each row execute function hub.touch_online();
alter publication supabase_realtime add table hub.online;

-- ── back office (admins only; SECURITY DEFINER so it reads auth.users without opening it) ──
create function hub.require_admin() returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not cms.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
end;
$$;

create function hub.admin_users() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform hub.require_admin();
  return coalesce((
    select jsonb_agg(row_to_json(u)::jsonb order by u.last_seen desc nulls last, u.created_at desc)
    from (
      select a.id, a.email, a.created_at, a.last_sign_in_at,
        coalesce(a.banned_until > now(), false) as banned,
        exists (select 1 from cms.admins m where m.user_id = a.id) as admin,
        coalesce(p.display_name, a.raw_user_meta_data ->> 'name') as name,
        (select count(*) from hub.visits v
          where v.user_id = a.id and v.at > now() - interval '30 days') as visits_30d,
        (select max(v.at) from hub.visits v where v.user_id = a.id) as last_seen
      from auth.users a left join hub.profiles p on p.user_id = a.id
    ) u
  ), '[]'::jsonb);
end;
$$;

create function hub.admin_visits(days int default 14) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  since timestamptz := date_trunc('day', now() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok'
    - make_interval(days => least(greatest(days, 1), 90) - 1);
begin
  perform hub.require_admin();
  return jsonb_build_object(
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'visits', d.visits, 'people', d.people) order by d.day)
      from (
        select (v.at at time zone 'Asia/Bangkok')::date as day, count(*) as visits,
          count(distinct v.user_id) as people
        from hub.visits v where v.at >= since group by 1
      ) d
    ), '[]'::jsonb),
    'apps', coalesce((
      select jsonb_agg(jsonb_build_object('app', a.app, 'visits', a.visits, 'people', a.people) order by a.visits desc)
      from (
        select v.app, count(*) as visits, count(distinct v.user_id) as people
        from hub.visits v where v.at >= since group by v.app
      ) a
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(r order by r.at desc)
      from (
        select v.at, v.app, v.path, v.user_id, u.email
        from hub.visits v left join auth.users u on u.id = v.user_id
        order by v.at desc limit 50
      ) r
    ), '[]'::jsonb)
  );
end;
$$;

-- banned: GoTrue refuses sign-in and token refresh; their sessions are ended right away, so the
-- access token they hold lapses within the JWT lifetime (1 hour by default)
create function hub.admin_set_banned(target uuid, banned boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform hub.require_admin();
  if target = (select auth.uid()) then
    raise exception 'you cannot ban yourself' using errcode = '42501';
  end if;
  update auth.users set banned_until = case when banned then 'infinity'::timestamptz end
    where id = target;
  if not found then
    raise exception 'no such user' using errcode = 'P0002';
  end if;
  if banned then
    delete from auth.sessions where user_id = target;
  end if;
  insert into hub.admin_actions (actor, target, action)
    values ((select auth.uid()), target, case when banned then 'ban' else 'unban' end);
end;
$$;

create function hub.admin_set_admin(target uuid, make boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform hub.require_admin();
  if target = (select auth.uid()) then
    raise exception 'you cannot change your own admin rights' using errcode = '42501';
  end if;
  if make then
    insert into cms.admins (user_id) values (target) on conflict do nothing;
  else
    delete from cms.admins where user_id = target;
  end if;
  insert into hub.admin_actions (actor, target, action)
    values ((select auth.uid()), target, case when make then 'make_admin' else 'remove_admin' end);
end;
$$;

create function hub.admin_log() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform hub.require_admin();
  return coalesce((
    select jsonb_agg(r order by r.at desc)
    from (
      select l.at, l.action, a.email as actor, t.email as target
      from hub.admin_actions l
      left join auth.users a on a.id = l.actor
      left join auth.users t on t.id = l.target
      order by l.at desc limit 30
    ) r
  ), '[]'::jsonb);
end;
$$;

revoke execute on all functions in schema hub from public, anon;
grant execute on function hub.admin_users(), hub.admin_visits(int), hub.admin_set_banned(uuid, boolean),
  hub.admin_set_admin(uuid, boolean), hub.admin_log() to authenticated;
