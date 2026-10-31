-- CMS content, admins, audit and media (cms schema) · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local');
insert into cms.admins (user_id) values ('11111111-1111-1111-1111-111111111111');
insert into cms.entries (app, page, key, kind, value)
  values ('hub', 'home', 'hero.line1', 'text', '{"text":"สวัสดี"}');

select ok(
  (select relrowsecurity from pg_class where oid = 'cms.entries'::regclass)
  and (select relrowsecurity from pg_class where oid = 'cms.admins'::regclass)
  and (select relrowsecurity from pg_class where oid = 'cms.audit_log'::regclass),
  'row level security is on for every cms table'
);

create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
$$;

-- ── anyone reads, nobody but an admin writes ──
set local role anon;
select is((select value ->> 'text' from cms.entries where key = 'hero.line1'), 'สวัสดี', 'visitors read content');
select throws_ok(
  $$select updated_by from cms.entries$$, '42501', null, 'visitors never see who edited'
);
select throws_ok(
  $$insert into cms.entries (app, page, key, kind, value) values ('hub', 'home', 'x', 'text', '{"text":"x"}')$$,
  '42501', null, 'visitors cannot write'
);
select is(cms.is_admin(), false, 'a visitor is not an admin');

set local role authenticated;
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is(cms.is_admin(), false, 'a member is not an admin');
select throws_ok(
  $$insert into cms.entries (app, page, key, kind, value) values ('hub', 'home', 'x', 'text', '{"text":"x"}')$$,
  '42501', null, 'members cannot add content'
);
update cms.entries set value = '{"text":"hacked"}' where key = 'hero.line1';
select is((select value ->> 'text' from cms.entries where key = 'hero.line1'), 'สวัสดี', 'members cannot change content');
select throws_ok(
  $$insert into cms.admins (user_id) values ('22222222-2222-2222-2222-222222222222')$$,
  '42501', null, 'nobody makes themselves an admin'
);
select throws_ok($$select * from cms.admins$$, '42501', null, 'nobody lists the admins');
select is((select count(*)::int from cms.audit_log), 0, 'members do not see the audit log');

-- ── the admin ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select is(cms.is_admin(), true, 'the admin is an admin');
select lives_ok(
  $$insert into cms.entries (app, page, key, kind, value) values ('hub', 'home', 'status.rounds', 'number', '{"n":8}')
    on conflict (app, page, key) do update set value = excluded.value$$,
  'the admin adds content'
);
select lives_ok(
  $$update cms.entries set value = '{"text":"ระบบที่ผมสร้าง"}' where key = 'hero.line1'$$,
  'the admin changes content'
);
select throws_ok(
  $$insert into cms.entries (app, page, key, kind, value)
    values ('hub', 'home', 'cta', 'link', '{"label":"x","href":"javascript:alert(1)"}')$$,
  '23514', null, 'a javascript: link is refused by the database itself'
);
select throws_ok(
  $$insert into cms.entries (app, page, key, kind, value)
    values ('hub', 'home', 'logo', 'image', '{"url":"//evil.example/x.png","alt":""}')$$,
  '23514', null, 'protocol-relative image URLs are refused'
);
select is(
  (select count(*)::int from cms.audit_log where actor = '11111111-1111-1111-1111-111111111111'),
  2, 'every change by the admin is in the audit log'
);

-- ── media ──
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner) values ('cms-media', 'x.png', auth.uid())$$,
  '42501', null, 'members cannot upload to cms-media'
);

select * from finish();
rollback;
