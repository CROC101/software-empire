-- Commerce pays sellers directly: no platform money at all.
--
-- The simulated wallet / escrow ledger is gone. A buyer transfers to the SELLER's own PromptPay
-- (outside the system), taps "แจ้งโอนแล้ว", and the seller confirms receipt; only then does work
-- start. The platform never holds or moves anyone's money, so it is not acting as a payment
-- service (Payment Systems Act B.E. 2560) and takes no fee.
--
-- Order flow now: CREATED → (buyer reports transfer) → seller confirms → FUNDED → DELIVERED →
-- RELEASED, with cancel / dispute as before. Refunds after payment are the seller's job outside
-- the system; the order just records that they happened.

-- ── retire the money machinery ───────────────────────────────────────────
drop view commerce.my_wallet;
drop function commerce.topup_demo(bigint);
drop function commerce.fund_order(uuid);
drop function commerce.release_order(uuid);
drop function commerce.cancel_order(uuid, text);
drop function commerce.resolve_dispute(uuid, text, text);
drop function commerce.auto_release();
drop function commerce.pay_out(commerce.orders);
drop function commerce.refund(commerce.orders);
drop function commerce.transfer(text, text, bigint, text, uuid);
drop function commerce.balance_of(text);
drop table commerce.ledger;
drop function commerce.check_txn_balanced();
drop function commerce.forbid_ledger_changes();

-- no money passes through the platform, so there is nothing to take a fee from
create or replace function commerce.fee_for(amount int) returns int
language sql immutable set search_path = ''
as $$ select 0 $$;

-- ── where each seller gets paid ──────────────────────────────────────────
-- Owner-only. A buyer never reads this table; they get the one PromptPay id of their own
-- order's seller through payment_target() below, and only while that order awaits payment.
create table commerce.payout_accounts (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- PromptPay: mobile number (10 digits, starts with 0) or e-wallet id (15 digits).
  -- National ID is deliberately not accepted: it would be shown to every buyer.
  promptpay_id text not null check (promptpay_id ~ '^(0[0-9]{9}|[0-9]{15})$'),
  account_name text not null check (char_length(btrim(account_name)) between 1 and 80),
  updated_at timestamptz not null default now()
);
create trigger payout_accounts_touch before update on commerce.payout_accounts
  for each row execute function commerce.touch_updated_at();
alter table commerce.payout_accounts enable row level security;
create policy "sellers manage only their own payout account" on commerce.payout_accounts
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on commerce.payout_accounts to authenticated;

-- ── the buyer's side of a transfer ───────────────────────────────────────
alter table commerce.orders
  add column payment_reported_at timestamptz,
  add column payment_note text check (char_length(payment_note) <= 200);

-- what the buyer needs to pay this order: the seller's PromptPay, name and the exact amount
create function commerce.payment_target(order_id uuid)
returns table (promptpay_id text, account_name text, amount_satang int)
language sql stable security definer set search_path = ''
as $$
  select a.promptpay_id, a.account_name, o.amount_satang
  from commerce.orders o
  join commerce.payout_accounts a on a.user_id = o.seller_id
  where o.id = payment_target.order_id
    and o.buyer_id = (select auth.uid())
    and o.status = 'CREATED';
$$;

-- buyer: "I've transferred" (+ an optional reference so the seller can find it)
create function commerce.report_payment(order_id uuid, note text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
begin
  select * into o from commerce.orders where id = report_payment.order_id for update;
  if o.id is null or o.buyer_id <> (select auth.uid()) then
    raise exception 'ไม่พบคำสั่งซื้อนี้' using errcode = 'P0002';
  end if;
  if o.status <> 'CREATED' then
    raise exception 'คำสั่งซื้อนี้ไม่ได้รอการชำระเงินแล้ว' using errcode = 'P0001';
  end if;
  update commerce.orders
    set payment_reported_at = now(), payment_note = nullif(btrim(coalesce(note, '')), '')
  where id = o.id;
  insert into commerce.order_events (order_id, actor_id, from_status, to_status, note)
  values (o.id, (select auth.uid()), 'CREATED', 'CREATED',
          'แจ้งโอนเงินแล้ว' || coalesce(' · ' || nullif(btrim(coalesce(note, '')), ''), ''));
end;
$$;

-- seller: the money is in my account → the work starts (due date counts from here)
create function commerce.confirm_payment(order_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform commerce.step(confirm_payment.order_id, array['CREATED'], 'FUNDED', 'seller',
                        'ผู้ขายยืนยันว่าได้รับเงินแล้ว');
end;
$$;

create function commerce.release_order(order_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform commerce.step(release_order.order_id, array['DELIVERED'], 'RELEASED', 'buyer');
end;
$$;

-- before payment either side may walk away; after payment only the seller, who then refunds
-- the buyer directly (the note records how)
create function commerce.cancel_order(order_id uuid, note text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
begin
  select * into o from commerce.orders where id = cancel_order.order_id;
  if o.status = 'FUNDED' then
    perform commerce.step(cancel_order.order_id, array['FUNDED'], 'CANCELLED', 'seller',
                          coalesce(note, 'ผู้ขายยกเลิกและคืนเงินให้ผู้ซื้อโดยตรง'));
  else
    perform commerce.step(cancel_order.order_id, array['CREATED'], 'CANCELLED', 'party', note);
  end if;
end;
$$;

create function commerce.resolve_dispute(order_id uuid, outcome text, note text default null) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if outcome not in ('RELEASE', 'REFUND') then
    raise exception 'outcome ต้องเป็น RELEASE หรือ REFUND' using errcode = 'P0001';
  end if;
  perform commerce.step(resolve_dispute.order_id, array['DISPUTED'],
    case when outcome = 'RELEASE' then 'RELEASED' else 'REFUNDED' end, 'staff', note);
end;
$$;

-- delivered work the buyer never answers counts as accepted after 3 days (checked on reads)
create function commerce.auto_release() returns int
language plpgsql security definer set search_path = ''
as $$
declare
  n int;
begin
  with done as (
    update commerce.orders set status = 'RELEASED'
    where status = 'DELIVERED' and delivered_at < now() - interval '3 days'
    returning id
  )
  insert into commerce.order_events (order_id, actor_id, from_status, to_status, note)
  select id, null, 'DELIVERED', 'RELEASED', 'รับงานอัตโนมัติหลังส่งมอบ 3 วัน' from done;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function
  commerce.payment_target(uuid), commerce.report_payment(uuid, text), commerce.confirm_payment(uuid),
  commerce.release_order(uuid), commerce.cancel_order(uuid, text),
  commerce.resolve_dispute(uuid, text, text), commerce.auto_release()
from public;
grant execute on function
  commerce.payment_target(uuid), commerce.report_payment(uuid, text), commerce.confirm_payment(uuid),
  commerce.release_order(uuid), commerce.cancel_order(uuid, text),
  commerce.resolve_dispute(uuid, text, text), commerce.auto_release()
to authenticated;
