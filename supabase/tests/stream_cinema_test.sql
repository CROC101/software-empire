-- stream Cinema phase 1: profiles + PIN, catalog, my list, progress, playlists, x-ray · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(52);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'a@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'b@test.local');
insert into cms.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

select ok((select bool_and(relrowsecurity) from pg_class
  where oid in ('stream.profiles'::regclass, 'stream.titles'::regclass, 'stream.episodes'::regclass,
                'stream.scene_xray_markers'::regclass, 'stream.my_list'::regclass,
                'stream.watch_progress'::regclass, 'stream.custom_playlists'::regclass,
                'stream.playlist_items'::regclass)),
  'every Cinema table has RLS');

-- ── the admin builds the catalog ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$insert into stream.titles (id, kind, name, synopsis, maturity, moods, trailer_id, published) values
  ('cccccccc-0000-0000-0000-000000000001', 'series', 'ซีรีส์ทดสอบ', 'a **twist** every week', 13, '{twist}', 'M7lc1UVf-VE', true),
  ('cccccccc-0000-0000-0000-000000000002', 'series', 'ร่าง', '', 0, '{}', null, false)$$,
  'an admin adds a series and a draft');
select throws_ok($$insert into stream.titles (kind, name) values ('movie', 'no video')$$,
  '23514', null, 'a movie needs a video');
select lives_ok($$insert into stream.episodes (id, title_id, season, number, name, youtube_id, intro_start_s, intro_end_s, credits_s) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 1, 1, 'ตอนแรก', 'M7lc1UVf-VE', 5, 65, 1300),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002', 1, 1, 'ลับ', 'dQw4w9WgXcQ', null, null, null)$$,
  'an admin adds episodes');
select throws_ok($$insert into stream.episodes (title_id, season, number, name, youtube_id) values
  ('cccccccc-0000-0000-0000-000000000001', 1, 1, 'again', 'M7lc1UVf-VE')$$,
  '23505', null, 'one episode per season and number');
select throws_ok($$insert into stream.episodes (title_id, season, number, name, youtube_id, intro_start_s, intro_end_s) values
  ('cccccccc-0000-0000-0000-000000000001', 1, 2, 'bad intro', 'M7lc1UVf-VE', 60, 10)$$,
  '23514', null, 'an intro ends after it starts');
select lives_ok($$insert into stream.scene_xray_markers (youtube_id, start_s, end_s, kind, label) values
  ('M7lc1UVf-VE', 10, 40, 'music', 'เพลงเปิด')$$, 'an admin adds an x-ray marker');
select is((select count(*)::int from stream.titles), 2, 'an admin sees drafts');

-- ── A, signed in ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok($$insert into stream.titles (kind, name, youtube_id) values ('movie', 'mine', 'M7lc1UVf-VE')$$,
  '42501', null, 'A cannot add a title');
select lives_ok($$update stream.titles set name = 'hacked'$$, 'A''s catalog edit runs but matches nothing');
select throws_ok($$insert into stream.scene_xray_markers (youtube_id, start_s, end_s, kind, label) values ('M7lc1UVf-VE', 1, 2, 'trivia', 'x')$$,
  '42501', null, 'A cannot add x-ray markers');
select results_eq($$select (select count(*)::int from stream.titles), (select count(*)::int from stream.episodes)$$,
  $$values (1, 1)$$, 'A sees published titles and their episodes only');
select is((select count(*)::int from stream.titles where search @@ to_tsquery('simple', 'twist')), 1,
  'titles are searchable');

-- profiles
select lives_ok($$insert into stream.profiles (name, maturity) values ('พ่อ', 18), ('แม่', 18), ('ลูก', 0), ('ป้า', 16), ('ตา', 18)$$,
  'A makes 5 profiles');
select throws_ok($$insert into stream.profiles (name) values ('คนที่หก')$$,
  '23514', null, 'a sixth profile is refused');
select throws_ok($$insert into stream.profiles (user_id, name) values ('33333333-3333-3333-3333-333333333333', 'x')$$,
  '42501', null, 'A cannot make a profile for B');
select throws_ok($$select pin_hash from stream.profiles$$, '42501', null, 'nobody reads a PIN hash');
select throws_ok($$update stream.profiles set pin_hash = null$$, '42501', null, 'a lock cannot be lifted by hand');
select lives_ok($$select stream.set_profile_pin((select id from stream.profiles where name = 'พ่อ'), null, '1234')$$,
  'A sets a PIN on a profile');
select is((select locked from stream.profiles where name = 'พ่อ'), true, 'the profile shows as locked');
select throws_ok($$select stream.set_profile_pin((select id from stream.profiles where name = 'แม่'), null, '12a4')$$,
  '23514', null, 'a PIN is 4 digits');
select throws_ok($$select stream.set_profile_pin((select id from stream.profiles where name = 'พ่อ'), null, null)$$,
  '42501', null, 'clearing a PIN needs the old one');
select is(stream.check_profile_pin((select id from stream.profiles where name = 'พ่อ'), '0000'), false, 'a wrong PIN fails');
select is(stream.check_profile_pin((select id from stream.profiles where name = 'พ่อ'), '1234'), true, 'the right PIN opens');
select is(stream.check_profile_pin((select id from stream.profiles where name = 'ลูก'), null), true,
  'a profile without a PIN opens');
select lives_ok($$select stream.set_profile_pin((select id from stream.profiles where name = 'พ่อ'), '1234', '4321')$$,
  'the old PIN changes it');
select is((select count(*)::int from generate_series(1, 5) g
  where stream.check_profile_pin((select id from stream.profiles where name = 'พ่อ'), '0000')), 0,
  'five misses in a row');
select throws_ok($$select stream.check_profile_pin((select id from stream.profiles where name = 'พ่อ'), '4321')$$,
  '54000', null, 'then the profile waits, even for the right PIN');

-- list, progress, playlists
select lives_ok($$insert into stream.my_list (profile_id, title_id) values
  ((select id from stream.profiles where name = 'ลูก'), 'cccccccc-0000-0000-0000-000000000001')$$, 'A saves a title');
select lives_ok($$insert into stream.watch_progress (profile_id, youtube_id, title_id, episode_id, position_s, duration_s) values
  ((select id from stream.profiles where name = 'ลูก'), 'M7lc1UVf-VE', 'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 120, 1400)$$,
  'A saves progress');
select lives_ok($$update stream.watch_progress set position_s = 600, updated_at = now()$$, 'A moves on');
select lives_ok($$insert into stream.custom_playlists (profile_id, name, shared) values
  ((select id from stream.profiles where name = 'แม่'), 'หักมุม', true),
  ((select id from stream.profiles where name = 'แม่'), 'ส่วนตัว', false)$$, 'A makes a shared and a private playlist');
select lives_ok($$insert into stream.playlist_items (playlist_id, position, title_id, episode_id)
  select id, 0, 'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001' from stream.custom_playlists$$,
  'A fills both playlists');

select set_config('test.dad', (select id::text from stream.profiles where name = 'พ่อ'), true) is not null as remembered;

-- ── B, signed in ──
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select results_eq($$select (select count(*)::int from stream.profiles), (select count(*)::int from stream.my_list),
  (select count(*)::int from stream.watch_progress)$$,
  $$values (0, 0, 0)$$, 'B sees none of A''s profiles, list or progress');
select results_eq($$select (select count(*)::int from stream.custom_playlists), (select count(*)::int from stream.playlist_items)$$,
  $$values (1, 1)$$, 'B sees only the shared playlist and its items');
select throws_ok($$select user_id from stream.custom_playlists$$, '42501', null, 'a shared playlist hides its owner');
select throws_ok($$select stream.check_profile_pin(current_setting('test.dad')::uuid, '0000')$$,
  '42501', null, 'B cannot guess a PIN on a profile B cannot see');
select throws_ok($$select stream.check_profile_pin('00000000-0000-0000-0000-000000000000', '0000')$$,
  '42501', null, 'B gets no answer for an unknown profile');
select lives_ok($$update stream.custom_playlists set name = 'hacked'$$, 'B''s rename of A''s playlist matches nothing');
select lives_ok($$delete from stream.playlist_items$$, 'B''s delete of A''s items matches nothing');
select lives_ok($$insert into stream.profiles (name) values ('บี')$$, 'B makes a profile');
select throws_ok($$insert into stream.playlist_items (playlist_id, position, title_id)
  select id, 1, 'cccccccc-0000-0000-0000-000000000001' from stream.custom_playlists$$,
  '23503', null, 'B cannot add to A''s playlist');
select throws_ok($$insert into stream.my_list (profile_id, user_id, title_id) values
  ((select id from stream.profiles), '22222222-2222-2222-2222-222222222222', 'cccccccc-0000-0000-0000-000000000001')$$,
  '42501', null, 'B cannot write into A''s account');

-- ── a visitor who is not signed in ──
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq($$select (select count(*)::int from stream.titles), (select count(*)::int from stream.episodes),
  (select count(*)::int from stream.scene_xray_markers), (select count(*)::int from stream.custom_playlists)$$,
  $$values (1, 1, 1, 1)$$, 'anyone reads the catalog, x-ray and shared playlists');
select throws_ok($$select stream.check_profile_pin('00000000-0000-0000-0000-000000000000', '0000')$$,
  '42501', null, 'anon cannot try PINs');
select throws_ok($$insert into stream.profiles (name) values ('x')$$, '42501', null, 'anon cannot make profiles');
select throws_ok($$select id from stream.profiles$$, '42501', null, 'anon cannot read profiles');
reset role;

-- ── checks as the database owner ──
select ok((select pin_hash like '$2%' and pin_hash !~ '4321' from stream.profiles where name = 'พ่อ'),
  'the PIN is stored as a bcrypt hash');
select is((select name from stream.titles where id = 'cccccccc-0000-0000-0000-000000000001'), 'ซีรีส์ทดสอบ',
  'the catalog keeps the admin''s words');
select is((select name from stream.custom_playlists where shared), 'หักมุม', 'A''s playlist keeps its name');
select is((select count(*)::int from stream.playlist_items), 2, 'A''s items are all still there');
select is((select position_s from stream.watch_progress), 600::real, 'progress moved');

select * from finish();
rollback;
