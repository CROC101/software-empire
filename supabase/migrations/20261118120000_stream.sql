-- Stream (subsystem 7): YouTube links people save, picks the admins feature, where each viewer
-- stopped, and watch-together rooms. No video or audio is stored or copied: every play goes through
-- the official YouTube player (youtube-nocookie), so the owner's channel and ads stay theirs.
--
-- Watch together: a room is a row; its host steers playback over the private Realtime topic
-- "stream-room:<room id>". Anyone signed in with the link may listen; only the host may send.

create schema if not exists stream;
grant usage on schema stream to anon, authenticated, service_role;

-- a YouTube video id: 11 characters of [A-Za-z0-9_-]
create domain stream.youtube_id as text check (value ~ '^[A-Za-z0-9_-]{11}$');
-- which shelf a video sits on: Videos, Movies, Music, Shorts
create domain stream.kind as text check (value in ('video', 'movie', 'music', 'short'));

-- ── library: the links each user saved, private to them ──
create table stream.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  youtube_id stream.youtube_id not null,
  kind stream.kind not null default 'video',
  title text not null check (char_length(title) between 1 and 200),
  author text not null default '' check (char_length(author) <= 120),
  created_at timestamptz not null default now(),
  unique (user_id, youtube_id)
);
comment on table stream.items is 'YouTube links a user saved to their own library (metadata from oEmbed).';
alter table stream.items enable row level security;
create policy "own library: read" on stream.items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own library: add" on stream.items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own library: edit" on stream.items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own library: remove" on stream.items
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on stream.items to authenticated;
grant update (kind, title) on stream.items to authenticated;

-- ── featured: what every visitor sees on the shelves; only CMS admins change it ──
create table stream.featured (
  id uuid primary key default gen_random_uuid(),
  youtube_id stream.youtube_id not null unique,
  kind stream.kind not null default 'video',
  title text not null check (char_length(title) between 1 and 200),
  author text not null default '' check (char_length(author) <= 120),
  position int not null default 0,
  created_at timestamptz not null default now()
);
comment on table stream.featured is 'Videos the admins put on the public shelves.';
alter table stream.featured enable row level security;
create policy "everyone reads the shelves" on stream.featured
  for select to anon, authenticated using (true);
create policy "admins add to the shelves" on stream.featured
  for insert to authenticated with check ((select cms.is_admin()));
create policy "admins edit the shelves" on stream.featured
  for update to authenticated using ((select cms.is_admin())) with check ((select cms.is_admin()));
create policy "admins remove from the shelves" on stream.featured
  for delete to authenticated using ((select cms.is_admin()));
grant select on stream.featured to anon, authenticated;
grant insert, update, delete on stream.featured to authenticated;

-- ── progress: where each user stopped in each video (autosaved while playing) ──
create table stream.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  youtube_id stream.youtube_id not null,
  seconds real not null check (seconds >= 0 and seconds < 1e6),
  duration real not null default 0 check (duration >= 0 and duration < 1e6),
  updated_at timestamptz not null default now(),
  primary key (user_id, youtube_id)
);
comment on table stream.progress is 'Last position per user per video, for "continue watching".';
alter table stream.progress enable row level security;
create policy "own progress: read" on stream.progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own progress: save" on stream.progress
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own progress: update" on stream.progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own progress: forget" on stream.progress
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on stream.progress to authenticated;
grant update (seconds, duration, updated_at) on stream.progress to authenticated;

-- ── rooms: watch together; a room lasts a day ──
create table stream.rooms (
  id uuid primary key default gen_random_uuid(),
  host uuid not null default auth.uid() references auth.users (id) on delete cascade,
  youtube_id stream.youtube_id not null,
  created_at timestamptz not null default now()
);
comment on table stream.rooms is 'Watch-together rooms. The host steers; anyone with the link follows for 24 hours.';
alter table stream.rooms enable row level security;
-- the id is an unguessable link: signed-in users read a room only by knowing it
create policy "signed-in users open a live room" on stream.rooms
  for select to authenticated using (created_at > now() - interval '1 day');
create policy "hosts open rooms" on stream.rooms
  for insert to authenticated with check (host = (select auth.uid()));
create policy "hosts close rooms" on stream.rooms
  for delete to authenticated using (host = (select auth.uid()));
grant select, insert, delete on stream.rooms to authenticated;

/** May the caller listen to room `room`? Signed in and the room is under a day old. */
create function stream.can_watch(room uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from stream.rooms r where r.id = room and r.created_at > now() - interval '1 day'
  );
$$;

/** May the caller steer room `room` (play, pause, seek, change video)? Only its host. */
create function stream.can_steer(room uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from stream.rooms r
    where r.id = room and r.host = (select auth.uid()) and r.created_at > now() - interval '1 day'
  );
$$;
revoke execute on function stream.can_watch(uuid), stream.can_steer(uuid) from public;
grant execute on function stream.can_watch(uuid), stream.can_steer(uuid) to authenticated;

-- private broadcast topic "stream-room:<room id>": everyone in the room hears, only the host speaks
create policy "room guests hear the stream room" on realtime.messages
  for select to authenticated
  using (
    realtime.topic() ~ '^stream-room:[0-9a-f-]{36}$'
    and stream.can_watch(substring(realtime.topic() from 13)::uuid)
  );
create policy "the host steers the stream room" on realtime.messages
  for insert to authenticated
  with check (
    realtime.topic() ~ '^stream-room:[0-9a-f-]{36}$'
    and stream.can_steer(substring(realtime.topic() from 13)::uuid)
  );
