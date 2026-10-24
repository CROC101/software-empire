-- Marketplace, simulated escrow and the double-entry ledger · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'seller@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'buyer@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'stranger@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'staff@test.local');
update community.profiles set role = 'ADMIN' where user_id = '44444444-4444-4444-4444-444444444444';

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated, anon;
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
$$;
-- balances through the ledger itself, as the owner of the function (not through RLS)
create function pg_temp.balance(account text) returns bigint language sql security definer as $$
  select coalesce(sum(amount_satang), 0)::bigint from commerce.ledger where ledger.account = balance.account;
$$;

set local role authenticated;

-- ── catalogue ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
with x as (
  insert into commerce.services (title, description, category, price_satang, delivery_days, published)
  values ('ทำเว็บ Next.js ครบวงจร', 'ออกแบบและพัฒนาเว็บด้วย Next.js พร้อม deploy ฟรี', 'DEVELOPMENT', 200000, 7, true)
  returning id)
insert into ids select 'svc', id from x;
with x as (
  insert into commerce.services (title, description, category, price_satang, delivery_days)
  values ('งานลับยังไม่เปิด', 'บริการที่ยังเขียนรายละเอียดไม่เสร็จ รอเปิดขาย', 'DESIGN', 50000, 3)
  returning id)
insert into ids select 'draft', id from x;
select throws_ok(
  $$insert into commerce.services (title, description, category, price_satang, delivery_days)
    values ('ราคาเพี้ยน', 'ราคาต่ำกว่าขั้นต่ำของแพลตฟอร์มแน่นอน', 'OTHER', 50, 1)$$,
  '23514', null, 'prices start at 100 baht'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*)::int from commerce.service_cards), 1, 'visitors see only published services');
reset role;
set local role authenticated;
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select throws_ok(
  $$insert into commerce.services (seller_id, title, description, category, price_satang, delivery_days)
    values ('11111111-1111-1111-1111-111111111111', 'สวมรอย', 'ลงขายในชื่อคนอื่นไม่ได้แน่นอน', 'OTHER', 10000, 1)$$,
  '42501', null, 'nobody lists services as someone else'
);

-- ── ordering and paying ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select throws_ok($$select commerce.place_order((select id from ids where name = 'svc'), 'สั่งงานตัวเองดู')$$,
  'P0001', null, 'sellers cannot order their own service');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok($$select commerce.place_order((select id from ids where name = 'draft'), 'อยากได้งานนี้มาก')$$,
  'P0002', null, 'drafts cannot be ordered');
insert into ids values ('o1', commerce.place_order((select id from ids where name = 'svc'), 'อยากได้เว็บร้านกาแฟ 3 หน้า'));
select is((select status from commerce.orders where id = (select id from ids where name = 'o1')), 'CREATED', 'an order starts CREATED');
select throws_ok($$select commerce.fund_order((select id from ids where name = 'o1'))$$,
  'P0001', null, 'an empty wallet cannot fund it');
select throws_ok($$select commerce.topup_demo(99999999)$$, 'P0001', null, 'demo top-ups are capped');
select is(commerce.topup_demo(1000000), 1000000::bigint, 'buyer tops up 10,000 baht of demo credit');
select lives_ok($$select commerce.fund_order((select id from ids where name = 'o1'))$$, 'buyer funds the order');
select is(pg_temp.balance('user:22222222-2222-2222-2222-222222222222'), 800000::bigint, 'the price left the wallet');
select is(pg_temp.balance('escrow:' || (select id from ids where name = 'o1')), 200000::bigint, 'and sits in escrow');
select throws_ok($$select commerce.fund_order((select id from ids where name = 'o1'))$$,
  'P0001', null, 'an order is funded once');

-- ── privacy ──
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is((select count(*)::int from commerce.orders), 0, 'strangers see no orders');
select is((select count(*)::int from commerce.ledger), 0, 'or anyone''s money');
select throws_ok(
  $$insert into commerce.order_messages (order_id, body) values ((select id from ids where name = 'o1'), 'แทรก')$$,
  '42501', null, 'or write in their order chat'
);

-- ── delivery and release ──
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok($$select commerce.deliver_order((select id from ids where name = 'o1'), 'ส่งเองเลย')$$,
  '42501', null, 'only the seller delivers');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select lives_ok($$select commerce.deliver_order((select id from ids where name = 'o1'), 'ส่งงานเว็บพร้อมลิงก์ตัวอย่าง')$$,
  'seller delivers');
select throws_ok($$select commerce.release_order((select id from ids where name = 'o1'))$$,
  '42501', null, 'only the buyer releases the money');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok($$select commerce.leave_review((select id from ids where name = 'o1'), 5)$$,
  'P0001', null, 'no review before the work is accepted');
select lives_ok($$select commerce.release_order((select id from ids where name = 'o1'))$$, 'buyer releases');
select is(pg_temp.balance('user:11111111-1111-1111-1111-111111111111'), 190000::bigint, 'seller gets the price minus 5%');
select is(pg_temp.balance('platform'), 10000::bigint, 'the platform keeps the 5% fee');
select is(pg_temp.balance('escrow:' || (select id from ids where name = 'o1')), 0::bigint, 'escrow is empty again');
select lives_ok($$select commerce.leave_review((select id from ids where name = 'o1'), 5, 'งานดีมาก ส่งไว')$$, 'buyer reviews');
select throws_ok($$select commerce.leave_review((select id from ids where name = 'o1'), 1)$$,
  '23505', null, 'one review per order');
select is((select array_agg(to_status order by id)::text from commerce.order_events
           where order_id = (select id from ids where name = 'o1')),
  '{CREATED,FUNDED,DELIVERED,RELEASED}', 'the timeline records every step');

-- ── cancellation after payment, and a dispute ──
insert into ids values ('o2', commerce.place_order((select id from ids where name = 'svc'), 'งานที่สองสำหรับทดสอบยกเลิก'));
select commerce.fund_order((select id from ids where name = 'o2'));
select throws_ok($$select commerce.cancel_order((select id from ids where name = 'o2'))$$,
  '42501', null, 'once paid, only the seller can cancel');
insert into ids values ('o3', commerce.place_order((select id from ids where name = 'svc'), 'งานที่สามสำหรับทดสอบข้อพิพาท'));
select commerce.fund_order((select id from ids where name = 'o3'));
select commerce.dispute_order((select id from ids where name = 'o3'), 'ผู้ขายไม่ตอบข้อความเลยหลายวัน');
select throws_ok($$select commerce.resolve_dispute((select id from ids where name = 'o3'), 'REFUND')$$,
  '42501', null, 'parties cannot judge their own dispute');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select commerce.cancel_order((select id from ids where name = 'o2'), 'คิวเต็ม ขออภัย');
select pg_temp.as_user('44444444-4444-4444-4444-444444444444');
select lives_ok($$select commerce.resolve_dispute((select id from ids where name = 'o3'), 'REFUND', 'คืนเงินผู้ซื้อ')$$,
  'staff refund the disputed order');
select is(pg_temp.balance('user:22222222-2222-2222-2222-222222222222'), 800000::bigint,
  'both cancelled and disputed money came back to the buyer');

-- ── the ledger's own guarantees ──
reset role;
select throws_ok($$update commerce.ledger set amount_satang = 1$$, '42501', null, 'the ledger is append-only');
set constraints all immediate;
select throws_ok(
  $$insert into commerce.ledger (txn_id, account, amount_satang, memo) values (gen_random_uuid(), 'platform', 999, 'free money')$$,
  '23514', null, 'an unbalanced transaction is rejected'
);

select * from finish();
rollback;
