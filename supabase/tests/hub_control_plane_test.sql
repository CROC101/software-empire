-- hub.settings / hub.apps / hub.gate / admin switches · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'a@test.local');
insert into cms.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into auth.sessions (id, user_id) values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222');

select ok((select relrowsecurity from pg_class where oid = 'hub.settings'::regclass), 'settings has RLS');
select ok((select relrowsecurity from pg_class where oid = 'hub.apps'::regclass), 'apps has RLS');

-- ── a visitor who is not signed in ──
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*)::int from hub.settings), 1, 'anyone reads the settings');
select is((hub.gate('hub') ->> 'verdict'), 'soon', 'before launch the hub shows the countdown');
select throws_ok($$update hub.settings set launch_at = now()$$, '42501', null, 'anon cannot open the site');
select throws_ok($$select hub.admin_set_settings(now(), '', '')$$, '42501', null, 'anon cannot call the admin switch');
reset role;

-- ── the admin, password only (aal1) ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal1"}', true);
select is((hub.gate('hub') ->> 'verdict'), 'mfa', 'an admin without TOTP is sent to the code step');

-- ── the admin with TOTP (aal2) ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal2"}', true);
select is((hub.gate('toolboxes') ->> 'verdict'), 'open', 'an admin with TOTP passes before launch');
select lives_ok($$select hub.admin_set_settings(now() - interval '1 minute', ' soon ', ' ประกาศ ')$$, 'the admin opens the site');
select is((select announcement from hub.settings), 'ประกาศ', 'the announcement is trimmed');
select lives_ok($$select hub.admin_set_app('canva', 'maintenance', 'ปรับปรุง', true)$$, 'the admin puts canva into maintenance');
select throws_ok($$select hub.admin_set_app('hub', 'off', '', false)$$, '22023', null, 'the hub cannot be switched off');
select throws_ok($$select hub.admin_set_app('nope', 'open', '', true)$$, 'P0002', null, 'unknown apps are refused');
select throws_ok($$select hub.admin_set_app('canva', 'broken', '', true)$$, '23514', null, 'status is one of three');
select is((hub.gate('canva') ->> 'verdict'), 'open', 'the admin still opens canva in maintenance');
reset role;
select is((select count(*)::int from hub.admin_actions where action in ('settings', 'app')), 2, 'both changes are logged');
select is((select detail -> 'old' ->> 'status' from hub.admin_actions where action = 'app'), 'open', 'the log keeps the old value');
set local role authenticated;
select throws_ok($$select hub.admin_suspend('22222222-2222-2222-2222-222222222222', now() - interval '1 day')$$,
  '22023', null, 'a suspension must end in the future');
select lives_ok($$select hub.admin_suspend('22222222-2222-2222-2222-222222222222', now() + interval '7 days')$$, 'the admin suspends A for a week');
reset role;
select is((select count(*)::int from auth.sessions where user_id = '22222222-2222-2222-2222-222222222222'), 0, 'A is signed out everywhere');
set local role authenticated;
select lives_ok($$select hub.admin_suspend('22222222-2222-2222-2222-222222222222', null)$$, 'the admin lifts it');
reset role;
select ok((select banned_until is null from auth.users where id = '22222222-2222-2222-2222-222222222222'), 'A can sign in again');
set local role authenticated;

-- ── after launch: person A and a visitor ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","aal":"aal1"}', true);
select is((hub.gate('toolboxes') ->> 'verdict'), 'open', 'after launch a member opens an open app');
select is((hub.gate('canva') ->> 'message'), 'ปรับปรุง', 'a member sees the maintenance message');
select throws_ok($$select hub.admin_set_app('canva', 'open', '', true)$$, '42501', null, 'a member cannot flip switches');
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((hub.gate('toolboxes') ->> 'verdict'), 'login', 'a visitor must sign in for a subsystem');
select is((hub.gate('hub') ->> 'verdict'), 'open', 'a visitor previews the hub without an account');

select * from finish();
rollback;
