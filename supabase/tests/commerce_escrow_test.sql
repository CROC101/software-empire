-- Marketplace with direct payment to each seller (no platform money) · run: pnpm db:test
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
select is((select fee_satang from commerce.orders where id = (select id from ids where name = 'o1')), 0, 'the platform takes no fee');

-- ── paying the seller directly ──
select is((select count(*)::int from commerce.payment_target((select id from ids where name = 'o1'))), 0,
  'no PromptPay to show until the seller sets one');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select throws_ok($$insert into commerce.payout_accounts (promptpay_id, account_name) values ('1234567890123', 'x')$$,
  '23514', null, 'a national ID is not accepted as PromptPay (it would be shown to buyers)');
select lives_ok($$insert into commerce.payout_accounts (promptpay_id, account_name) values ('0812345678', 'ร้านเว็บดี')$$,
  'seller sets their own PromptPay');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from commerce.payout_accounts), 0, 'buyers cannot read the payout table');
select is((select promptpay_id || '|' || amount_satang from commerce.payment_target((select id from ids where name = 'o1'))),
  '0812345678|200000', 'the buyer of this order sees the seller PromptPay and the exact amount');
select throws_ok($$select commerce.confirm_payment((select id from ids where name = 'o1'))$$,
  '42501', null, 'a buyer cannot mark their own order as paid');
select lives_ok($$select commerce.report_payment((select id from ids where name = 'o1'), 'โอน 14:05')$$,
  'buyer reports the transfer');
select isnt((select payment_reported_at from commerce.orders where id = (select id from ids where name = 'o1')), null,
  'the report is stamped on the order');
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is((select count(*)::int from commerce.payment_target((select id from ids where name = 'o1'))), 0,
  'strangers never get a seller PromptPay');
select is((select count(*)::int from commerce.orders), 0, 'strangers see no orders');
select throws_ok(
  $$insert into commerce.order_messages (order_id, body) values ((select id from ids where name = 'o1'), 'แทรก')$$,
  '42501', null, 'or write in their order chat'
);
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select lives_ok($$select commerce.confirm_payment((select id from ids where name = 'o1'))$$, 'seller confirms the money arrived');
select throws_ok($$select commerce.confirm_payment((select id from ids where name = 'o1'))$$,
  'P0001', null, 'a payment is confirmed once');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from commerce.payment_target((select id from ids where name = 'o1'))), 0,
  'once paid, the PromptPay is no longer handed out');

-- ── delivery and acceptance ──
select throws_ok($$select commerce.deliver_order((select id from ids where name = 'o1'), 'ส่งเองเลย')$$,
  '42501', null, 'only the seller delivers');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select lives_ok($$select commerce.deliver_order((select id from ids where name = 'o1'), 'ส่งงานเว็บพร้อมลิงก์ตัวอย่าง')$$,
  'seller delivers');
select throws_ok($$select commerce.release_order((select id from ids where name = 'o1'))$$,
  '42501', null, 'only the buyer accepts the work');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok($$select commerce.leave_review((select id from ids where name = 'o1'), 5)$$,
  'P0001', null, 'no review before the work is accepted');
select lives_ok($$select commerce.release_order((select id from ids where name = 'o1'))$$, 'buyer accepts');
select lives_ok($$select commerce.leave_review((select id from ids where name = 'o1'), 5, 'งานดีมาก ส่งไว')$$, 'buyer reviews');
select throws_ok($$select commerce.leave_review((select id from ids where name = 'o1'), 1)$$,
  '23505', null, 'one review per order');
select is((select array_agg(to_status order by id)::text from commerce.order_events
           where order_id = (select id from ids where name = 'o1')),
  '{CREATED,CREATED,FUNDED,DELIVERED,RELEASED}', 'the timeline records the transfer report and every step');

-- ── cancellation after payment, and a dispute ──
insert into ids values ('o2', commerce.place_order((select id from ids where name = 'svc'), 'งานที่สองสำหรับทดสอบยกเลิก'));
insert into ids values ('o3', commerce.place_order((select id from ids where name = 'svc'), 'งานที่สามสำหรับทดสอบข้อพิพาท'));
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select commerce.confirm_payment((select id from ids where name = 'o2'));
select commerce.confirm_payment((select id from ids where name = 'o3'));
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok($$select commerce.cancel_order((select id from ids where name = 'o2'))$$,
  '42501', null, 'once paid, only the seller can cancel (and refunds directly)');
select commerce.dispute_order((select id from ids where name = 'o3'), 'ผู้ขายไม่ตอบข้อความเลยหลายวัน');
select throws_ok($$select commerce.resolve_dispute((select id from ids where name = 'o3'), 'REFUND')$$,
  '42501', null, 'parties cannot judge their own dispute');
select pg_temp.as_user('44444444-4444-4444-4444-444444444444');
select lives_ok($$select commerce.resolve_dispute((select id from ids where name = 'o3'), 'REFUND', 'ให้ผู้ขายคืนเงิน')$$,
  'staff settle the dispute');
select is((select status from commerce.orders where id = (select id from ids where name = 'o3')), 'REFUNDED',
  'the order records the refund');

select * from finish();
rollback;
