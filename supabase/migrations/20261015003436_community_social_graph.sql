-- Community (apps/community, ported from csmju-nexus) owns the `community` schema (ADR-02).
-- Round 1: the social graph every other feature builds on — profiles, follows, blocks,
-- close friends. Privacy rules live here (RLS + functions), never only in the browser.

create schema if not exists community;
grant usage on schema community to authenticated, service_role;

create function community.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── profiles ──────────────────────────────────────────────────────────────
create table community.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  bio text check (char_length(bio) <= 300),
  website text check (char_length(website) <= 200 and website ~ '^https?://[^\s]+$'),
  avatar_url text check (char_length(avatar_url) <= 500 and avatar_url ~ '^https?://'),
  cover_url text check (char_length(cover_url) <= 500 and cover_url ~ '^https?://'),
  -- GUEST read-only · EDITOR member · ADMIN moderator; changed only by service_role / SQL
  role text not null default 'EDITOR' check (role in ('GUEST', 'EDITOR', 'ADMIN')),
  comments_from text not null default 'EVERYONE'
    check (comments_from in ('EVERYONE', 'FOLLOWING', 'FOLLOWERS', 'MUTUAL', 'OFF')),
  show_activity_status boolean not null default true,
  show_in_suggestions boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on community.profiles
  for each row execute function community.touch_updated_at();

-- every account gets a profile; display name starts as the email's local part
create function community.create_profile_for_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into community.profiles (user_id, display_name)
  values (new.id, left(coalesce(nullif(split_part(new.email, '@', 1), ''), 'สมาชิกใหม่'), 60))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger community_profile_on_signup after insert on auth.users
  for each row execute function community.create_profile_for_user();

insert into community.profiles (user_id, display_name)
select id, left(coalesce(nullif(split_part(email, '@', 1), ''), 'สมาชิกใหม่'), 60) from auth.users
on conflict (user_id) do nothing;

-- ── follows · blocks · close friends ─────────────────────────────────────
create table community.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on community.follows (followee_id, created_at desc);

create table community.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index on community.blocks (blocked_id);

create table community.close_friends (
  owner_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id),
  check (owner_id <> friend_id)
);

-- ── privacy helpers ──────────────────────────────────────────────────────
-- security definer: a user cannot read who blocked them, but the rule still has to apply
create function community.is_blocked_either(a uuid, b uuid) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from community.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;
revoke all on function community.is_blocked_either(uuid, uuid) from public;
grant execute on function community.is_blocked_either(uuid, uuid) to authenticated;

-- Blocking removes follows and close-friend links in both directions, which includes the other
-- person's rows — so it runs as definer, but only ever for auth.uid() as the blocker.
create function community.block_user(target uuid) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  at timestamptz;
begin
  if me is null then raise exception 'ต้องเข้าสู่ระบบ' using errcode = '42501'; end if;
  if target = me then raise exception 'บล็อกตัวเองไม่ได้' using errcode = 'P0001'; end if;

  insert into community.blocks (blocker_id, blocked_id) values (me, target)
  on conflict (blocker_id, blocked_id) do update set blocker_id = excluded.blocker_id
  returning created_at into at;

  delete from community.follows
  where (follower_id = me and followee_id = target) or (follower_id = target and followee_id = me);
  delete from community.close_friends
  where (owner_id = me and friend_id = target) or (owner_id = target and friend_id = me);
  return at;
end;
$$;
revoke all on function community.block_user(uuid) from public;
grant execute on function community.block_user(uuid) to authenticated;

-- People my follows follow, that I don't follow yet — minus blocks and people who opted out.
create function community.follow_suggestions(max_rows int default 20)
returns table (user_id uuid, followed_by uuid[], followed_by_count int, mutual_count int)
language sql
stable
security invoker
set search_path = ''
as $$
  with mine as (
    select followee_id from community.follows where follower_id = auth.uid()
  )
  select
    f.followee_id,
    (array_agg(f.follower_id order by f.created_at desc))[1:3],
    count(*)::int,
    count(*)::int
  from community.follows f
  join mine m on m.followee_id = f.follower_id
  join community.profiles p on p.user_id = f.followee_id and p.show_in_suggestions
  where f.followee_id <> auth.uid()
    and f.followee_id not in (select followee_id from mine)
    and not community.is_blocked_either(auth.uid(), f.followee_id)
  group by f.followee_id
  order by count(*) desc, f.followee_id
  limit least(greatest(max_rows, 1), 50);
$$;
grant execute on function community.follow_suggestions(int) to authenticated;

-- follower/following counts per profile (RLS of follows applies: blocked links are not counted)
create view community.profile_stats with (security_invoker = true) as
select
  p.user_id,
  (select count(*) from community.follows f where f.followee_id = p.user_id)::int as follower_count,
  (select count(*) from community.follows f where f.follower_id = p.user_id)::int as following_count
from community.profiles p;
grant select on community.profile_stats to authenticated;

-- ── row level security ───────────────────────────────────────────────────
alter table community.profiles enable row level security;
alter table community.follows enable row level security;
alter table community.blocks enable row level security;
alter table community.close_friends enable row level security;

create policy "members see profiles of people who have not blocked them" on community.profiles
  for select to authenticated
  using (not community.is_blocked_either((select auth.uid()), user_id));
create policy "owner edits own profile" on community.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "members see follow links outside their blocks" on community.follows
  for select to authenticated
  using (
    not community.is_blocked_either((select auth.uid()), follower_id)
    and not community.is_blocked_either((select auth.uid()), followee_id)
  );
create policy "follow as yourself, never across a block" on community.follows
  for insert to authenticated
  with check (
    (select auth.uid()) = follower_id
    and not community.is_blocked_either(follower_id, followee_id)
  );
create policy "unfollow as yourself" on community.follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);

create policy "blocker sees own blocks" on community.blocks
  for select to authenticated using ((select auth.uid()) = blocker_id);
create policy "blocker lifts own blocks" on community.blocks
  for delete to authenticated using ((select auth.uid()) = blocker_id);

create policy "owner manages own close friends" on community.close_friends
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and not community.is_blocked_either(owner_id, friend_id)
  );

-- role is not in this list: a member can never promote themselves
grant select on community.profiles to authenticated;
grant update (display_name, bio, website, avatar_url, cover_url, comments_from,
              show_activity_status, show_in_suggestions)
  on community.profiles to authenticated;
grant select, insert, delete on community.follows to authenticated;
grant select, delete on community.blocks to authenticated;
grant select, insert, delete on community.close_friends to authenticated;
grant all on all tables in schema community to service_role;
