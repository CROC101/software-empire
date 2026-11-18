-- stream.items / featured / progress / rooms and the watch-together topic rules · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'a@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'b@test.local');
insert into cms.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

select ok((select bool_and(relrowsecurity) from pg_class
  where oid in ('stream.items'::regclass, 'stream.featured'::regclass,
                'stream.progress'::regclass, 'stream.rooms'::regclass)), 'every stream table has RLS');

-- ── the admin fills a shelf ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$insert into stream.featured (youtube_id, kind, title) values ('dQw4w9WgXcQ', 'music', 'เพลง')$$,
  'an admin adds to the shelves');

-- ── A, signed in ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok($$insert into stream.featured (youtube_id, title) values ('aaaaaaaaaaa', 'x')$$,
  '42501', null, 'a user cannot add to the shelves');
select is((select count(*)::int from stream.featured), 1, 'a user reads the shelves');
select lives_ok($$insert into stream.items (youtube_id, kind, title, author) values ('M7lc1UVf-VE', 'video', 'คลิป', 'ช่อง')$$,
  'A saves a link');
select throws_ok($$insert into stream.items (youtube_id, title) values ('not-an-id', 'x')$$,
  '23514', null, 'only real YouTube ids are saved');
select throws_ok($$insert into stream.items (youtube_id, kind, title) values ('abcdefghijk', 'adult', 'x')$$,
  '23514', null, 'kind is one of four shelves');
select throws_ok($$insert into stream.items (user_id, youtube_id, title) values ('33333333-3333-3333-3333-333333333333', 'abcdefghijk', 'x')$$,
  '42501', null, 'A cannot save into B''s library');
select lives_ok($$insert into stream.progress (youtube_id, seconds, duration) values ('M7lc1UVf-VE', 42.5, 300)
  on conflict (user_id, youtube_id) do update set seconds = excluded.seconds, updated_at = now()$$, 'A autosaves a position');
select lives_ok($$insert into stream.progress (youtube_id, seconds, duration) values ('M7lc1UVf-VE', 61, 300)
  on conflict (user_id, youtube_id) do update set seconds = excluded.seconds, updated_at = now()$$, 'saving again moves it');
select is((select seconds from stream.progress), 61::real, 'the latest position wins');
select throws_ok($$insert into stream.progress (youtube_id, seconds) values ('abcdefghijk', -1)$$,
  '23514', null, 'a position is never negative');
select lives_ok($$insert into stream.rooms (id, youtube_id) values ('44444444-4444-4444-4444-444444444444', 'M7lc1UVf-VE')$$,
  'A opens a room');
select ok(stream.can_steer('44444444-4444-4444-4444-444444444444'), 'the host steers their room');

-- ── B, signed in ──
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is((select count(*)::int from stream.items), 0, 'B does not see A''s library');
select is((select count(*)::int from stream.progress), 0, 'B does not see A''s progress');
select lives_ok($$update stream.items set title = 'hacked'$$, 'B''s rename runs but matches nothing');
select ok(stream.can_watch('44444444-4444-4444-4444-444444444444'), 'B with the link joins the room');
select ok(not stream.can_steer('44444444-4444-4444-4444-444444444444'), 'B cannot steer A''s room');
select ok(not stream.can_watch('55555555-5555-5555-5555-555555555555'), 'an unknown room cannot be joined');
select lives_ok($$delete from stream.rooms$$, 'B''s delete runs but matches nothing');
reset role;
select is((select title from stream.items), 'คลิป', 'A''s link keeps its title');
select is((select count(*)::int from stream.rooms), 1, 'A''s room is still open');

-- a room older than a day is closed to everyone
update stream.rooms set created_at = now() - interval '2 days';
set local role authenticated;
select ok(not stream.can_watch('44444444-4444-4444-4444-444444444444'), 'an old room cannot be joined');

-- ── a visitor who is not signed in ──
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*)::int from stream.featured), 1, 'anyone reads the shelves');
select throws_ok($$select count(*) from stream.items$$, '42501', null, 'anon cannot read libraries');
reset role;

select * from finish();
rollback;
