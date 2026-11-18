-- stream Cinema (/cinema): household profiles with a hashed PIN, an admin-made catalog of
-- titles and episodes that play from YouTube, and each profile's list, progress and playlists.
--
-- Every row a profile owns also carries user_id, tied to the profile by a composite foreign
-- key, so policies stay a plain `user_id = auth.uid()` and a row can never sit on someone
-- else's profile. Watch parties reuse stream.rooms; skip segments and comments reuse the Tube
-- tables (they key on the YouTube id).
--
-- Maturity is not enforced by RLS: the server cannot know which profile is on screen, so the
-- app filters titles by the active profile's maturity. The PIN is a household lock, not auth.

-- ── profiles: up to 5 per account ──
create table stream.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  avatar text not null default 'croc' check (avatar ~ '^[a-z0-9-]{1,40}$'),
  -- the highest age rating this profile may watch; 0 = everyone (kids)
  maturity smallint not null default 18 check (maturity in (0, 7, 13, 16, 18)),
  pin_hash text,
  locked boolean generated always as (pin_hash is not null) stored,
  pin_fails smallint not null default 0,
  pin_locked_until timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index profiles_by_user on stream.profiles (user_id);
comment on table stream.profiles is 'Who is watching: up to 5 per account. pin_hash is never readable.';
alter table stream.profiles enable row level security;
create policy "own profiles: read" on stream.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own profiles: add" on stream.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own profiles: edit" on stream.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own profiles: remove" on stream.profiles
  for delete to authenticated using (user_id = (select auth.uid()));
-- no pin_hash or pin_fails here: list columns in selects, `select *` is refused
grant select (id, user_id, name, avatar, maturity, locked, pin_locked_until, created_at)
  on stream.profiles to authenticated;
grant insert (name, avatar, maturity), delete on stream.profiles to authenticated;
grant update (name, avatar, maturity) on stream.profiles to authenticated;

create function stream.cap_profiles() returns trigger
language plpgsql set search_path = ''
as $$
begin
  -- two tabs adding at once must not both see 4
  perform pg_advisory_xact_lock(hashtextextended('stream.profiles:' || new.user_id::text, 0));
  if (select count(*) from stream.profiles where user_id = new.user_id) >= 5 then
    raise exception 'an account has at most 5 profiles' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger cap_profiles before insert on stream.profiles
  for each row execute function stream.cap_profiles();

/** Set, change or clear (new_pin null) a profile's 4-digit PIN; changing needs the old one. */
create function stream.set_profile_pin(profile uuid, old_pin text, new_pin text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  p stream.profiles;
begin
  select * into p from stream.profiles
    where id = profile and user_id = (select auth.uid()) for update;
  if not found then
    raise exception 'no such profile' using errcode = 'insufficient_privilege';
  end if;
  if new_pin is not null and new_pin !~ '^[0-9]{4}$' then
    raise exception 'a PIN is 4 digits' using errcode = 'check_violation';
  end if;
  if p.pin_hash is not null
     and (old_pin is null or extensions.crypt(old_pin, p.pin_hash) <> p.pin_hash) then
    raise exception 'wrong PIN' using errcode = 'insufficient_privilege';
  end if;
  update stream.profiles
    set pin_hash = case when new_pin is null then null
                        else extensions.crypt(new_pin, extensions.gen_salt('bf', 8)) end,
        pin_fails = 0, pin_locked_until = null
    where id = profile;
end;
$$;

/** True when the PIN opens the profile. 5 misses lock it for 15 minutes. */
create function stream.check_profile_pin(profile uuid, pin text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  p stream.profiles;
begin
  select * into p from stream.profiles
    where id = profile and user_id = (select auth.uid()) for update;
  if not found then
    raise exception 'no such profile' using errcode = 'insufficient_privilege';
  end if;
  if p.pin_hash is null then
    return true;
  end if;
  if p.pin_locked_until > now() then
    raise exception 'too many tries, wait until %', p.pin_locked_until
      using errcode = 'program_limit_exceeded';
  end if;
  if pin is not null and extensions.crypt(pin, p.pin_hash) = p.pin_hash then
    update stream.profiles set pin_fails = 0, pin_locked_until = null where id = profile;
    return true;
  end if;
  -- a miss returns false instead of raising, or the count would roll back with the error
  update stream.profiles
    set pin_fails = case when p.pin_fails >= 4 then 0 else p.pin_fails + 1 end,
        pin_locked_until = case when p.pin_fails >= 4 then now() + interval '15 minutes' end
    where id = profile;
  return false;
end;
$$;

-- ── titles: movies and series, made by admins ──
create table stream.titles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('movie', 'series')),
  name text not null check (char_length(name) between 1 and 200),
  -- markdown; the app renders it through DOMPurify
  synopsis text not null default '' check (char_length(synopsis) <= 5000),
  year smallint check (year between 1888 and 2100),
  maturity smallint not null default 0 check (maturity in (0, 7, 13, 16, 18)),
  genres text[] not null default '{}' check (cardinality(genres) <= 10),
  moods text[] not null default '{}' check (cardinality(moods) <= 10),
  cast_names text[] not null default '{}' check (cardinality(cast_names) <= 30),
  directors text[] not null default '{}' check (cardinality(directors) <= 10),
  -- a movie plays this video; a series plays its episodes
  youtube_id stream.youtube_id,
  -- the muted billboard preview; posters come from YouTube thumbnails of these ids
  trailer_id stream.youtube_id,
  runtime_s int check (runtime_s between 1 and 100000),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('simple', name || ' ' || synopsis)
  ) stored,
  check (kind = 'series' or youtube_id is not null)
);
create index titles_search on stream.titles using gin (search);
create index titles_moods on stream.titles using gin (moods);
create index titles_new on stream.titles (created_at desc) where published;
comment on table stream.titles is 'Cinema catalog. Everyone reads published titles; admins write.';
alter table stream.titles enable row level security;
create policy "everyone reads published titles" on stream.titles
  for select to anon, authenticated using (published or (select cms.is_admin()));
create policy "admins add titles" on stream.titles
  for insert to authenticated with check ((select cms.is_admin()));
create policy "admins edit titles" on stream.titles
  for update to authenticated
  using ((select cms.is_admin())) with check ((select cms.is_admin()));
create policy "admins remove titles" on stream.titles
  for delete to authenticated using ((select cms.is_admin()));
grant select on stream.titles to anon, authenticated;
grant insert, update, delete on stream.titles to authenticated;

-- ── episodes: a series' episodes, season by season ──
-- shortcut: seasons are a number, not a table; add stream.seasons if seasons need names or art
create table stream.episodes (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references stream.titles (id) on delete cascade,
  season smallint not null check (season between 1 and 100),
  number smallint not null check (number between 1 and 1000),
  name text not null check (char_length(name) between 1 and 200),
  synopsis text not null default '' check (char_length(synopsis) <= 2000),
  youtube_id stream.youtube_id not null,
  runtime_s int check (runtime_s between 1 and 100000),
  -- auto-skip and the next-episode countdown
  intro_start_s real check (intro_start_s >= 0),
  intro_end_s real check (intro_end_s > intro_start_s),
  credits_s real check (credits_s > 0),
  unique (title_id, season, number)
);
create index episodes_by_video on stream.episodes (youtube_id);
alter table stream.episodes enable row level security;
-- the subquery runs under titles' RLS, so drafts stay hidden
create policy "everyone reads episodes of readable titles" on stream.episodes
  for select to anon, authenticated
  using (exists (select 1 from stream.titles t where t.id = title_id));
create policy "admins add episodes" on stream.episodes
  for insert to authenticated with check ((select cms.is_admin()));
create policy "admins edit episodes" on stream.episodes
  for update to authenticated
  using ((select cms.is_admin())) with check ((select cms.is_admin()));
create policy "admins remove episodes" on stream.episodes
  for delete to authenticated using ((select cms.is_admin()));
grant select on stream.episodes to anon, authenticated;
grant insert, update, delete on stream.episodes to authenticated;

-- ── scene_xray_markers: who is on screen, the song playing, trivia ──
create table stream.scene_xray_markers (
  id uuid primary key default gen_random_uuid(),
  youtube_id stream.youtube_id not null,
  start_s real not null check (start_s >= 0),
  end_s real not null check (end_s > start_s and end_s < 1e6),
  kind text not null check (kind in ('cast', 'music', 'trivia')),
  label text not null check (char_length(label) between 1 and 200),
  detail text not null default '' check (char_length(detail) <= 1000)
);
create index xray_by_video on stream.scene_xray_markers (youtube_id, start_s);
alter table stream.scene_xray_markers enable row level security;
create policy "everyone reads x-ray" on stream.scene_xray_markers
  for select to anon, authenticated using (true);
create policy "admins add x-ray" on stream.scene_xray_markers
  for insert to authenticated with check ((select cms.is_admin()));
create policy "admins edit x-ray" on stream.scene_xray_markers
  for update to authenticated
  using ((select cms.is_admin())) with check ((select cms.is_admin()));
create policy "admins remove x-ray" on stream.scene_xray_markers
  for delete to authenticated using ((select cms.is_admin()));
grant select on stream.scene_xray_markers to anon, authenticated;
grant insert, update, delete on stream.scene_xray_markers to authenticated;

-- ── my_list: titles a profile saved ──
create table stream.my_list (
  profile_id uuid not null,
  user_id uuid not null default auth.uid(),
  title_id uuid not null references stream.titles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, title_id),
  foreign key (profile_id, user_id) references stream.profiles (id, user_id) on delete cascade
);
create index my_list_by_user on stream.my_list (user_id);
create index my_list_by_title on stream.my_list (title_id);
alter table stream.my_list enable row level security;
create policy "own list: read" on stream.my_list
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own list: add" on stream.my_list
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own list: remove" on stream.my_list
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, delete on stream.my_list to authenticated;
grant insert (profile_id, title_id) on stream.my_list to authenticated;

-- ── watch_progress: where a profile stopped in each video (continue watching, next episode) ──
create table stream.watch_progress (
  profile_id uuid not null,
  user_id uuid not null default auth.uid(),
  youtube_id stream.youtube_id not null,
  title_id uuid not null references stream.titles (id) on delete cascade,
  episode_id uuid references stream.episodes (id) on delete cascade,
  position_s real not null check (position_s >= 0 and position_s < 1e6),
  duration_s real not null default 0 check (duration_s >= 0 and duration_s < 1e6),
  updated_at timestamptz not null default now(),
  primary key (profile_id, youtube_id),
  foreign key (profile_id, user_id) references stream.profiles (id, user_id) on delete cascade
);
create index watch_progress_recent on stream.watch_progress (profile_id, updated_at desc);
create index watch_progress_by_user on stream.watch_progress (user_id);
create index watch_progress_by_title on stream.watch_progress (title_id);
create index watch_progress_by_episode on stream.watch_progress (episode_id);
alter table stream.watch_progress enable row level security;
create policy "own progress: read" on stream.watch_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own progress: save" on stream.watch_progress
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own progress: update" on stream.watch_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own progress: forget" on stream.watch_progress
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, delete on stream.watch_progress to authenticated;
grant insert (profile_id, youtube_id, title_id, episode_id, position_s, duration_s)
  on stream.watch_progress to authenticated;
grant update (position_s, duration_s, updated_at) on stream.watch_progress to authenticated;

-- ── custom_playlists: a profile's cross-series playlists, shareable by link ──
create table stream.custom_playlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (profile_id, user_id) references stream.profiles (id, user_id) on delete cascade
);
create index playlists_by_profile on stream.custom_playlists (profile_id);
create index playlists_by_user on stream.custom_playlists (user_id, created_at);
alter table stream.custom_playlists enable row level security;
create policy "everyone reads shared playlists" on stream.custom_playlists
  for select to anon, authenticated using (shared);
create policy "own playlists: read" on stream.custom_playlists
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own playlists: add" on stream.custom_playlists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own playlists: edit" on stream.custom_playlists
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own playlists: remove" on stream.custom_playlists
  for delete to authenticated using (user_id = (select auth.uid()));
-- no user_id: a shared playlist must not reveal whose account it is
grant select (id, profile_id, name, shared, created_at) on stream.custom_playlists to anon, authenticated;
grant insert (profile_id, name, shared), delete on stream.custom_playlists to authenticated;
grant update (name, shared) on stream.custom_playlists to authenticated;
create trigger rate_limit before insert on stream.custom_playlists
  for each row execute function stream.rate_limit('20', '1 hour');

create table stream.playlist_items (
  playlist_id uuid not null,
  user_id uuid not null default auth.uid(),
  position smallint not null check (position between 0 and 499),
  title_id uuid not null references stream.titles (id) on delete cascade,
  episode_id uuid references stream.episodes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (playlist_id, position),
  foreign key (playlist_id, user_id) references stream.custom_playlists (id, user_id) on delete cascade
);
create index playlist_items_by_user on stream.playlist_items (user_id, created_at);
create index playlist_items_by_title on stream.playlist_items (title_id);
create index playlist_items_by_episode on stream.playlist_items (episode_id);
alter table stream.playlist_items enable row level security;
-- the subquery runs under playlists' RLS: shared or own
create policy "items of readable playlists" on stream.playlist_items
  for select to anon, authenticated
  using (exists (select 1 from stream.custom_playlists p where p.id = playlist_id));
create policy "own items: add" on stream.playlist_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own items: move" on stream.playlist_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own items: remove" on stream.playlist_items
  for delete to authenticated using (user_id = (select auth.uid()));
grant select (playlist_id, position, title_id, episode_id, created_at) on stream.playlist_items
  to anon, authenticated;
grant insert (playlist_id, position, title_id, episode_id), delete
  on stream.playlist_items to authenticated;
grant update (position) on stream.playlist_items to authenticated;
create trigger rate_limit before insert on stream.playlist_items
  for each row execute function stream.rate_limit('300', '1 hour');

revoke execute on function stream.cap_profiles() from public, anon, authenticated;
revoke execute on function stream.set_profile_pin(uuid, text, text),
  stream.check_profile_pin(uuid, text) from public, anon;
grant execute on function stream.set_profile_pin(uuid, text, text),
  stream.check_profile_pin(uuid, text) to authenticated;
