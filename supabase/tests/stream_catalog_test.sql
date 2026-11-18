-- stream catalog phase 1: video + track caches, music playlists and likes, my_taste · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

insert into auth.users (id, email) values
  ('22222222-2222-2222-2222-222222222222', 'a@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'b@test.local');

select ok((select bool_and(relrowsecurity) from pg_class
  where oid in ('stream.yt_catalog_cache'::regclass, 'stream.music_track_cache'::regclass,
                'stream.music_playlists'::regclass, 'stream.music_playlist_tracks'::regclass,
                'stream.music_liked_tracks'::regclass)),
  'every catalog table has RLS');
select ok((select 'security_invoker=true' = any (reloptions) from pg_class where oid = 'stream.my_taste'::regclass),
  'my_taste runs with the caller''s rights');
select has_trigger('stream', 'music_playlists', 'rate_limit', 'playlists are rate limited');
select has_trigger('stream', 'music_liked_tracks', 'rate_limit', 'likes are rate limited');

-- ── the Worker fills the caches ──
set local role service_role;
select lives_ok($$insert into stream.yt_catalog_cache (youtube_id, channel_id, title, channel_title, source) values
  ('M7lc1UVf-VE', 'UCabcdefghijklmnopqrstuv', 'ดนตรีสด live session', 'ช่องทดสอบ', 'rss'),
  ('dQw4w9WgXcQ', null, 'no channel yet', '', 'oembed')$$,
  'the Worker caches videos');
select lives_ok($$insert into stream.music_track_cache (id, title, artist, artwork_url, preview_url) values
  ('itunes:123', 'เพลงหนึ่ง', 'ศิลปิน', 'https://is1.example/a.jpg', 'https://audio.example/a.m4a'),
  ('audius:Ab_9', 'Track Two', 'Someone', null, null)$$,
  'the Worker caches tracks');
select throws_ok($$insert into stream.music_track_cache (id, title, artist) values ('spotify:1', 'x', 'y')$$,
  '23514', null, 'only known sources');
select throws_ok($$insert into stream.music_track_cache (id, title, artist, artwork_url) values ('deezer:1', 'x', 'y', 'http://plain.example/a.jpg')$$,
  '23514', null, 'artwork must be https');
select throws_ok($$insert into stream.yt_catalog_cache (youtube_id, title, source) values ('M7lc1UVf-V', 'x', 'rss')$$,
  '23514', null, 'a video id has 11 characters');

-- ── anyone reads, nobody else writes ──
set local role anon;
select is((select count(*)::int from stream.yt_catalog_cache), 2, 'anon reads the video cache');
select is((select count(*)::int from stream.music_track_cache where search @@ to_tsquery('simple', 'ศิลปิน')), 1,
  'tracks are searchable');
select is((select count(*)::int from stream.yt_catalog_cache where search @@ to_tsquery('simple', 'live')), 1,
  'videos are searchable');
select throws_ok($$insert into stream.yt_catalog_cache (youtube_id, title, source) values ('aaaaaaaaaaa', 'x', 'rss')$$,
  '42501', null, 'anon cannot write the video cache');
select throws_ok($$select * from stream.my_taste$$, '42501', null, 'anon has no taste view');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok($$insert into stream.music_track_cache (id, title, artist) values ('itunes:9', 'x', 'y')$$,
  '42501', null, 'A cannot write the track cache');
select throws_ok($$update stream.yt_catalog_cache set title = 'hacked'$$,
  '42501', null, 'A cannot edit the video cache');

-- ── A's library ──
select lives_ok($$insert into stream.music_playlists (id, name) values ('eeeeeeee-0000-0000-0000-000000000001', 'ขับรถ')$$,
  'A makes a playlist');
select lives_ok($$insert into stream.music_playlist_tracks (playlist_id, position, track_id) values
  ('eeeeeeee-0000-0000-0000-000000000001', 0, 'itunes:123'),
  ('eeeeeeee-0000-0000-0000-000000000001', 1, 'audius:Ab_9')$$,
  'A adds tracks');
select throws_ok($$insert into stream.music_playlist_tracks (playlist_id, position, track_id) values
  ('eeeeeeee-0000-0000-0000-000000000001', 500, 'itunes:123')$$,
  '23514', null, 'a playlist holds 500 tracks at most');
select throws_ok($$insert into stream.music_playlist_tracks (playlist_id, position, track_id) values
  ('eeeeeeee-0000-0000-0000-000000000001', 2, 'itunes:404')$$,
  '23503', null, 'only cached tracks');
select lives_ok($$insert into stream.music_liked_tracks (track_id) values ('itunes:123')$$, 'A likes a track');
select throws_ok($$insert into stream.music_liked_tracks (track_id) values ('itunes:123')$$,
  '23505', null, 'one like per track');
select lives_ok($$insert into stream.progress (youtube_id, seconds, duration) values
  ('M7lc1UVf-VE', 90, 100), ('dQw4w9WgXcQ', 50, 100)$$, 'A watches two videos');
select results_eq($$select channel_id::text, round(weight::numeric, 1) from stream.my_taste$$,
  $$values ('UCabcdefghijklmnopqrstuv', 0.9)$$, 'A''s taste counts the channel she watched (videos without a channel skipped)');

-- ── B sees and changes none of it ──
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select results_eq($$select (select count(*)::int from stream.music_playlists),
                          (select count(*)::int from stream.music_playlist_tracks),
                          (select count(*)::int from stream.music_liked_tracks),
                          (select count(*)::int from stream.my_taste)$$,
  $$values (0, 0, 0, 0)$$, 'B sees none of A''s library or taste');
select throws_ok($$insert into stream.music_playlist_tracks (playlist_id, position, track_id) values
  ('eeeeeeee-0000-0000-0000-000000000001', 3, 'itunes:123')$$,
  '23503', null, 'B cannot add to A''s playlist');
select throws_ok($$insert into stream.music_playlists (user_id, name) values ('22222222-2222-2222-2222-222222222222', 'x')$$,
  '42501', null, 'B cannot make a playlist for A');
select lives_ok($$update stream.music_playlists set name = 'hacked'$$, 'B''s rename runs but matches nothing');
select lives_ok($$delete from stream.music_liked_tracks$$, 'B''s unlike runs but matches nothing');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select results_eq($$select (select name from stream.music_playlists), (select count(*)::int from stream.music_liked_tracks)$$,
  $$values ('ขับรถ'::text, 1)$$, 'A''s library is untouched');
select lives_ok($$delete from stream.music_playlists$$, 'A deletes the playlist');
select is((select count(*)::int from stream.music_playlist_tracks), 0, 'its tracks go with it');

select * from finish();
rollback;
