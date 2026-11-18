-- stream catalog (phase 1 of the YouTube + music engine): caches the Worker fills from free,
-- keyless sources (YouTube RSS and oEmbed, iTunes Search, Deezer, Audius), each user's music
-- library, and a taste view the feed ranker reads.
--
-- Reused, not repeated: subscriptions (20261118210000_stream_tube.sql), watch history =
-- stream.progress, watch parties = stream.rooms (20261118120000_stream.sql).
--
-- Who writes what: only the Worker (service_role) writes the caches; everyone reads them
-- (public YouTube and store metadata). Playlists and likes are private to their owner.

-- ── yt_catalog_cache: videos the Worker has seen, for search and the feed ──
-- shortcut: no eviction yet; add a cron that deletes rows older than 30 days when it grows
create table stream.yt_catalog_cache (
  youtube_id stream.youtube_id primary key,
  -- oEmbed gives no channel id, RSS does
  channel_id stream.channel_id,
  title text not null check (char_length(title) between 1 and 200),
  channel_title text not null default '' check (char_length(channel_title) <= 120),
  published_at timestamptz,
  duration_s int check (duration_s between 0 and 100000),
  source text not null check (source in ('rss', 'oembed', 'data_api')),
  fetched_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('simple', title || ' ' || channel_title)
  ) stored
);
create index yt_catalog_search on stream.yt_catalog_cache using gin (search);
create index yt_catalog_by_channel on stream.yt_catalog_cache (channel_id, published_at desc);
create index yt_catalog_new on stream.yt_catalog_cache (published_at desc);
comment on table stream.yt_catalog_cache is 'Public YouTube metadata cached by the Worker. Everyone reads; only service_role writes.';
alter table stream.yt_catalog_cache enable row level security;
create policy "everyone reads the video cache" on stream.yt_catalog_cache
  for select to anon, authenticated using (true);
grant select on stream.yt_catalog_cache to anon, authenticated;
grant select, insert, update, delete on stream.yt_catalog_cache to service_role;

-- ── music_track_cache: tracks from the free catalogs; a like or playlist keeps its row ──
create table stream.music_track_cache (
  -- "<source>:<id in that source>"
  id text primary key check (id ~ '^(itunes|deezer|audius):[A-Za-z0-9_-]{1,40}$'),
  title text not null check (char_length(title) between 1 and 200),
  artist text not null check (char_length(artist) between 1 and 200),
  album text not null default '' check (char_length(album) <= 200),
  artwork_url text check (artwork_url ~ '^https://' and char_length(artwork_url) <= 500),
  -- a 30 s preview (iTunes, Deezer) or the full stream (Audius)
  preview_url text check (preview_url ~ '^https://' and char_length(preview_url) <= 500),
  duration_s int check (duration_s between 0 and 100000),
  -- the official video, once the Worker has matched one
  youtube_id stream.youtube_id,
  fetched_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('simple', title || ' ' || artist || ' ' || album)
  ) stored
);
create index music_track_search on stream.music_track_cache using gin (search);
comment on table stream.music_track_cache is 'Public track metadata cached by the Worker. Everyone reads; only service_role writes.';
alter table stream.music_track_cache enable row level security;
create policy "everyone reads the track cache" on stream.music_track_cache
  for select to anon, authenticated using (true);
grant select on stream.music_track_cache to anon, authenticated;
grant select, insert, update, delete on stream.music_track_cache to service_role;

-- ── music_playlists: private for now ──
-- shortcut: no sharing; add `shared` + a share-safe read path (see custom_playlists) when asked
create table stream.music_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index music_playlists_by_user on stream.music_playlists (user_id, created_at);
alter table stream.music_playlists enable row level security;
create policy "own music playlists: read" on stream.music_playlists
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own music playlists: add" on stream.music_playlists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own music playlists: rename" on stream.music_playlists
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own music playlists: remove" on stream.music_playlists
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, delete on stream.music_playlists to authenticated;
grant insert (id, name), update (name) on stream.music_playlists to authenticated;
create trigger rate_limit before insert on stream.music_playlists
  for each row execute function stream.rate_limit('20', '1 hour');

create table stream.music_playlist_tracks (
  playlist_id uuid not null,
  user_id uuid not null default auth.uid(),
  position smallint not null check (position between 0 and 499),
  track_id text not null references stream.music_track_cache (id),
  created_at timestamptz not null default now(),
  primary key (playlist_id, position),
  -- a track can only go into a playlist of the same user
  foreign key (playlist_id, user_id) references stream.music_playlists (id, user_id) on delete cascade
);
create index music_playlist_tracks_by_user on stream.music_playlist_tracks (user_id, created_at);
create index music_playlist_tracks_by_track on stream.music_playlist_tracks (track_id);
alter table stream.music_playlist_tracks enable row level security;
create policy "own playlist tracks: read" on stream.music_playlist_tracks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own playlist tracks: add" on stream.music_playlist_tracks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own playlist tracks: move" on stream.music_playlist_tracks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own playlist tracks: remove" on stream.music_playlist_tracks
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, delete on stream.music_playlist_tracks to authenticated;
grant insert (playlist_id, position, track_id) on stream.music_playlist_tracks to authenticated;
grant update (position) on stream.music_playlist_tracks to authenticated;
create trigger rate_limit before insert on stream.music_playlist_tracks
  for each row execute function stream.rate_limit('300', '1 hour');

-- ── music_liked_tracks ──
create table stream.music_liked_tracks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id text not null references stream.music_track_cache (id),
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
create index music_liked_recent on stream.music_liked_tracks (user_id, created_at desc);
create index music_liked_by_track on stream.music_liked_tracks (track_id);
alter table stream.music_liked_tracks enable row level security;
create policy "own likes: read" on stream.music_liked_tracks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own likes: like" on stream.music_liked_tracks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own likes: unlike" on stream.music_liked_tracks
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, delete on stream.music_liked_tracks to authenticated;
grant insert (track_id) on stream.music_liked_tracks to authenticated;
create trigger rate_limit before insert on stream.music_liked_tracks
  for each row execute function stream.rate_limit('300', '1 hour');

-- ── my_taste: how much the signed-in user watches each channel ──
-- A view, not a table: it is computed from progress on read, so it never goes stale and needs no
-- sync job. security_invoker keeps progress' RLS, so each user sees only their own taste.
-- weight = share of each video watched, fading by e every 30 days.
create view stream.my_taste with (security_invoker = true) as
select
  c.channel_id,
  sum(
    (case when p.duration > 0 then least(1, p.seconds / p.duration) else 0.5::real end)
    * exp(-extract(epoch from now() - p.updated_at)::float8 / (30 * 86400))
  )::real as weight,
  max(p.updated_at) as last_watched
from stream.progress p
join stream.yt_catalog_cache c using (youtube_id)
where c.channel_id is not null
group by c.channel_id;
comment on view stream.my_taste is 'Channel weights of the signed-in user, from their progress. For the feed ranker.';
grant select on stream.my_taste to authenticated;
