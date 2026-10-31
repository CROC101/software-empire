-- Reports, moderation, member roles and quotas (community round 7) · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local');
-- this file assumes it has the only admin (seed data may add others; all rolled back at the end)
update community.profiles set role = 'EDITOR' where role = 'ADMIN';
update community.profiles set role = 'ADMIN' where user_id = '11111111-1111-1111-1111-111111111111';

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- ── reporting ──
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
insert into ids values ('post', community.create_post('ขายของ', 'สแปม สแปม สแปม'));
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$select community.create_report('POST', (select id::text from ids where name = 'post'), 'สั้น')$$,
  'P0001', null, 'a reason needs at least 10 characters'
);
insert into ids values ('rep', community.create_report('POST', (select id::text from ids where name = 'post'),
  'โพสต์นี้เป็นสแปมขายของซ้ำ ๆ'));
select throws_ok(
  $$select community.create_report('POST', (select id::text from ids where name = 'post'), 'รายงานซ้ำอีกรอบนะครับ')$$,
  '23505', null, 'reporting the same thing twice is refused'
);
select throws_ok(
  $$select community.create_report('USER', '22222222-2222-2222-2222-222222222222', 'รายงานตัวเองเล่น ๆ')$$,
  'P0001', null, 'nobody reports themselves'
);
select throws_ok(
  $$select community.create_report('REEL', gen_random_uuid()::text, 'คลิปนี้ไม่เหมาะสมมาก')$$,
  'P0002', null, 'things that do not exist cannot be reported'
);
select lives_ok(
  $$select community.create_report('SYSTEM', 'app', 'แอปค้างตอนเปิดหน้าแชท')$$,
  'app feedback is a SYSTEM report'
);
select lives_ok(
  $$select community.create_report('SYSTEM', 'app', 'แอปค้างอีกแล้วตอนเปิดหน้าแชท')$$,
  'and can be sent again'
);
select is((select count(*)::int from community.reports), 3, 'bob sees his own reports');
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is((select count(*)::int from community.reports), 0, 'not other people''s');
select throws_ok(
  $$select community.resolve_report((select id from ids where name = 'rep'), 'RESOLVED')$$,
  '42501', null, 'members cannot close reports'
);

-- ── moderation ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select is((select count(*)::int from community.reports where status = 'OPEN'), 3, 'staff see every open report');
select lives_ok($$select community.resolve_report((select id from ids where name = 'rep'), 'RESOLVED', 'ลบแล้ว')$$,
  'staff close a report');
select throws_ok(
  $$select community.resolve_report((select id from ids where name = 'rep'), 'REJECTED')$$,
  '23505', null, 'a closed report stays closed'
);
select is((select action from community.audit_logs where action like 'report.%'), 'report.resolved',
  'the decision is audited');
select lives_ok($$select community.delete_post((select id from ids where name = 'post'))$$,
  'staff remove the reported post');
select is((community.admin_overview() ->> 'openReportCount')::int, 2, 'the overview counts open reports');

-- ── members ──
select lives_ok(
  $$select community.set_member_quota('22222222-2222-2222-2222-222222222222', 104857600, 'ทำโปรเจกต์วิดีโอ')$$,
  'staff raise a quota'
);
select throws_ok(
  $$select community.set_member_quota('22222222-2222-2222-2222-222222222222', 6000000000)$$,
  'P0001', null, 'quotas stop at 5 GB'
);
select throws_ok(
  $$select community.set_member_role('11111111-1111-1111-1111-111111111111', 'EDITOR')$$,
  '42501', null, 'the last admin cannot step down'
);
select lives_ok(
  $$select community.set_member_role('22222222-2222-2222-2222-222222222222', 'ADMIN', 'ช่วยดูแลระบบ')$$,
  'staff promote a member'
);

select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((community.my_member() ->> 'storageQuotaBytes'), '104857600', 'the member sees their new quota');

select * from finish();
rollback;
