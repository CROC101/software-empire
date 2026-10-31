-- The admin overview (cms.admin_overview) · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'boss@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'guest@test.local');
insert into cms.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
$$;

set local role anon;
select throws_ok($$select cms.admin_overview()$$, '42501', null, 'visitors cannot call it');

set local role authenticated;
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok($$select cms.admin_overview()$$, '42501', null, 'members cannot read it');

select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into cms.entries (app, page, key, kind, value)
  values ('hub', 'home', 'hero.line1', 'text', '{"text":"ใหม่"}');
select ok(
  (cms.admin_overview() -> 'users' ->> 'total')::int >= 2,
  'the admin sees the real member count'
);
select is(
  cms.admin_overview() -> 'cms' -> 'recent' -> 0 ->> 'actor',
  'boss@test.local',
  'recent edits name who made them'
);
select ok(
  (select (x ->> 'count')::int from jsonb_array_elements(cms.admin_overview() -> 'cms' -> 'pages') x
   where x ->> 'app' = 'hub' and x ->> 'page' = 'home') >= 1,
  'overridden fields are counted per page'
);

select * from finish();
rollback;
