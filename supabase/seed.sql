-- Local demo data — runs on `pnpm db:reset` only (never on a hosted project: `db push` skips seeds).
-- Demo accounts (local Supabase only, password for all: empire-demo-2026):
--   admin@empire.local  Empire Admin  (ADMIN — sees the admin panel)
--   ploy@empire.local   พลอย
--   ton@empire.local    ต้น
--   mint@empire.local   มิ้นท์
-- Everything else goes through the same RPCs the apps call, acting as each user, so triggers,
-- notifications and audit rows come out exactly as they would in real use.

create function pg_temp.demo_user(id uuid, email text, name text) returns void
language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
    extensions.crypt('empire-demo-2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('name', name), now(), now(), '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now());
  update community.profiles set display_name = name where user_id = id;
end;
$$;

create function pg_temp.as_user(id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, false);
$$;

select pg_temp.demo_user('a0000000-0000-4000-8000-000000000001', 'admin@empire.local', 'Empire Admin');
select pg_temp.demo_user('a0000000-0000-4000-8000-000000000002', 'ploy@empire.local', 'พลอย');
select pg_temp.demo_user('a0000000-0000-4000-8000-000000000003', 'ton@empire.local', 'ต้น');
select pg_temp.demo_user('a0000000-0000-4000-8000-000000000004', 'mint@empire.local', 'มิ้นท์');
update community.profiles set role = 'ADMIN', bio = 'ดูแลชุมชน Software Empire'
where user_id = 'a0000000-0000-4000-8000-000000000001';
update community.profiles set bio = 'Frontend · ชอบ React กับ motion design'
where user_id = 'a0000000-0000-4000-8000-000000000002';
update community.profiles set bio = 'Backend · Postgres คือชีวิต'
where user_id = 'a0000000-0000-4000-8000-000000000003';
update community.profiles set bio = 'AI Engineer · WebGPU / Transformers.js'
where user_id = 'a0000000-0000-4000-8000-000000000004';

-- everyone follows everyone (mutuals, so notes and requests behave like friends) — as the follower,
-- so the FOLLOW notifications name who followed
do $$
declare
  a uuid;
  b uuid;
  everyone uuid[] := array['a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
                           'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004'];
begin
  foreach a in array everyone loop
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    foreach b in array everyone loop
      if a <> b then insert into community.follows (follower_id, followee_id) values (a, b); end if;
    end loop;
  end loop;
end;
$$;

create temp table demo (name text primary key, id uuid);

-- posts
select pg_temp.as_user('a0000000-0000-4000-8000-000000000002');
insert into demo values ('p1', community.create_post('ธีม Aurora มาแล้ว 🎨',
  'เปลี่ยนทั้งชุดเป็นม่วงหลวงไล่ไปบานเย็นกับปะการัง แถบเมนูเป็นม่วงเที่ยงคืน ทุกแอปใช้ palette เดียวกันจาก @empire/ui แล้ว'));
select pg_temp.as_user('a0000000-0000-4000-8000-000000000003');
insert into demo values ('p2', community.create_post('RLS ทุกตาราง ไม่มีข้อยกเว้น',
  'สิทธิ์ทั้งหมดอยู่ในฐานข้อมูล: บล็อกกันแล้วโพสต์หาย คอมเมนต์ตามที่เจ้าของตั้ง แจ้งเตือนเกิดจาก trigger มี pgTAP คุมกว่า 200 ข้อ',
  'CS301'));
select pg_temp.as_user('a0000000-0000-4000-8000-000000000004');
insert into demo values ('p3', community.create_post('รันโมเดลในเบราว์เซอร์ได้แล้ว',
  'ทดลอง Transformers.js บน WebGPU ใน Web Worker หน้าเว็บไม่กระตุกเลย เดี๋ยวจะเอาไปใช้กับ AI Tarot', 'CS401'));
select pg_temp.as_user('a0000000-0000-4000-8000-000000000001');
insert into demo values ('p4', community.create_post('ยินดีต้อนรับสู่ Empire Community',
  'ฟีด รีลส์ สตอรี่ แชตเรียลไทม์ โทรเสียง/วิดีโอแบบ P2P และห้องประชุม — ล็อกอินครั้งเดียวที่ Core Hub ใช้ได้ทุกระบบย่อย'));

-- comments and reactions
select pg_temp.as_user('a0000000-0000-4000-8000-000000000003');
select community.add_comment((select id from demo where name = 'p1'), 'สวยมาก โดยเฉพาะโหมดมืด');
insert into community.reactions (target_kind, target_id, user_id, emoji)
values ('POST', (select id from demo where name = 'p1'), auth.uid(), '🔥');
select pg_temp.as_user('a0000000-0000-4000-8000-000000000004');
select community.add_comment((select id from demo where name = 'p1'), 'ไล่สีออโรราคือดีย์');
insert into community.reactions (target_kind, target_id, user_id, emoji)
values ('POST', (select id from demo where name = 'p1'), auth.uid(), '😍'),
       ('POST', (select id from demo where name = 'p2'), auth.uid(), '👏');
select pg_temp.as_user('a0000000-0000-4000-8000-000000000002');
select community.add_comment((select id from demo where name = 'p3'), 'รอเล่นเลย!');
insert into community.reactions (target_kind, target_id, user_id, emoji)
values ('POST', (select id from demo where name = 'p3'), auth.uid(), '🚀'),
       ('POST', (select id from demo where name = 'p4'), auth.uid(), '❤️');

-- a group room with a conversation and a meeting, plus a DM
select pg_temp.as_user('a0000000-0000-4000-8000-000000000001');
insert into demo values ('team', community.create_channel('GROUP', 'ทีม Software Empire'));
select community.add_members((select id from demo where name = 'team'), array[
  'a0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000004']);
select community.send_message((select id from demo where name = 'team'), 'สวัสดีทุกคน ห้องนี้ไว้คุยเรื่อง release นะ', 's1');
select pg_temp.as_user('a0000000-0000-4000-8000-000000000003');
select community.send_message((select id from demo where name = 'team'), 'migration รอบ 7 ผ่าน pgTAP หมดแล้ว ✅', 's2');
select pg_temp.as_user('a0000000-0000-4000-8000-000000000002');
select community.send_message((select id from demo where name = 'team'), 'ธีมใหม่ขึ้นครบทุกแอปแล้ว ลองเปิดโหมดมืดดู', 's3');
select pg_temp.as_user('a0000000-0000-4000-8000-000000000001');
select community.create_meeting((select id from demo where name = 'team'), 'Sprint review',
  date_trunc('hour', now()) + interval '1 day', date_trunc('hour', now()) + interval '1 day 1 hour',
  'เดโมฟีเจอร์รอบ 5-7 และวางแผน deploy');
insert into demo values ('dm', community.open_direct(array['a0000000-0000-4000-8000-000000000002'::uuid]));
select community.send_message((select id from demo where name = 'dm'), 'พลอย ฝากดูหน้า admin ให้หน่อยนะ', 'd1');

-- a note above the inbox
select pg_temp.as_user('a0000000-0000-4000-8000-000000000004');
select community.put_note('กำลังเทรนโมเดลอยู่ 🤖');

select set_config('request.jwt.claims', '', false);
