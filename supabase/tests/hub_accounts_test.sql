-- RLS + back-office tests for hub.profiles / hub.visits / hub.admin_* · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(30);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'a@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'b@test.local');
insert into cms.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into hub.profiles (user_id, display_name) values ('33333333-3333-3333-3333-333333333333', 'B');
insert into hub.visits (user_id, app, path) values ('33333333-3333-3333-3333-333333333333', 'hub', '/dashboard');

select ok((select relrowsecurity from pg_class where oid = 'hub.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'hub.visits'::regclass), 'visits has RLS');
select ok((select relrowsecurity from pg_class where oid = 'hub.admin_actions'::regclass), 'admin_actions has RLS');
select ok((select relrowsecurity from pg_class where oid = 'hub.online'::regclass), 'online has RLS');
insert into hub.online (user_id, app, path) values ('33333333-3333-3333-3333-333333333333', 'hub', '/admin');

-- ── person A (not an admin) ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select lives_ok($$insert into hub.profiles (display_name, bio) values ('  เอ  ', 'hi')$$, 'A creates a profile');
select is((select display_name from hub.profiles), 'เอ', 'A sees only their own profile, name trimmed');
select throws_ok($$insert into hub.profiles (user_id, display_name) values ('33333333-3333-3333-3333-333333333333', 'x')$$,
  '42501', null, 'A cannot create a profile for B');
update hub.profiles set display_name = 'hijack' where user_id = '33333333-3333-3333-3333-333333333333';
select throws_ok($$update hub.profiles set user_id = '33333333-3333-3333-3333-333333333333'$$,
  '42501', null, 'A cannot move their profile to another id');
select throws_ok($$insert into hub.profiles (display_name) values ('   ')$$, '23514', null, 'a blank name is refused');

select lives_ok($$insert into hub.visits (app, path) values ('toolboxes', '/tools')$$, 'A logs a visit');
select throws_ok($$insert into hub.visits (user_id, app, path) values ('33333333-3333-3333-3333-333333333333', 'hub', '/x')$$,
  '42501', null, 'A cannot log a visit as B');
select throws_ok($$insert into hub.visits (app, path) values ('Bad App', '/x')$$, '23514', null, 'app names are slugs');
select throws_ok($$insert into hub.visits (app, path) values ('hub', 'https://evil.example')$$, '23514', null, 'paths are site paths');
select is((select count(*)::int from hub.visits), 1, 'A sees only their own visits');
select throws_ok($$insert into hub.visits (app, path) select 'hub', '/flood' from generate_series(1, 60)$$,
  '54000', 'too many visits', 'more than 60 visits a minute are refused');
select lives_ok($$insert into hub.online (app, path) values ('toolboxes', '/tools')
  on conflict (user_id) do update set app = excluded.app, path = excluded.path$$, 'A sends a heartbeat (twice)');
select lives_ok($$insert into hub.online (app, path) values ('toolboxes', '/history')
  on conflict (user_id) do update set app = excluded.app, path = excluded.path$$, 'the second heartbeat updates the row');
select results_eq('select path from hub.online', $$values ('/history')$$, 'A sees only their own heartbeat');
select throws_ok('select count(*) from hub.admin_actions', '42501', null, 'A cannot read the admin log');
select throws_ok('select hub.admin_users()', '42501', 'admins only', 'A cannot list users');
select throws_ok($$select hub.admin_set_admin('22222222-2222-2222-2222-222222222222', true)$$,
  '42501', 'admins only', 'A cannot make themselves admin');

-- ── the admin ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is((select count(*)::int from jsonb_array_elements(hub.admin_users()) u where u ->> 'email' like '%@test.local'), 3,
  'the admin lists every account');
select is((select (u ->> 'name') from jsonb_array_elements(hub.admin_users()) u where u ->> 'email' = 'b@test.local'),
  'B', 'the list carries the profile name (A could not rename B)');
select set_eq($$select r ->> 'email' from jsonb_array_elements(hub.admin_visits(14) -> 'recent') r$$,
  array['a@test.local', 'b@test.local'], 'the admin sees everyone''s visits');
select is((select count(*)::int from hub.online where user_id::text like '%2222' or user_id::text like '%3333'), 2,
  'the admin sees everyone online');
select lives_ok($$select hub.admin_set_banned('33333333-3333-3333-3333-333333333333', true)$$, 'the admin bans B');
select throws_ok($$select hub.admin_set_banned('11111111-1111-1111-1111-111111111111', true)$$,
  '42501', 'you cannot ban yourself', 'the admin cannot lock themselves out');
select lives_ok($$select hub.admin_set_admin('22222222-2222-2222-2222-222222222222', true)$$, 'the admin makes A an admin');
select is(jsonb_array_length(hub.admin_log()), 2, 'both actions are in the log');

reset role;
select ok((select banned_until = 'infinity' from auth.users where id = '33333333-3333-3333-3333-333333333333'), 'B is banned in auth');

select * from finish();
rollback;
