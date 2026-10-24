-- Commerce (apps/commerce) owns the `commerce` schema (ADR-02): a freelance marketplace with a
-- SIMULATED escrow. No real money moves — wallets are topped up with demo credit.
--
-- Money is integer satang (1 THB = 100), never floats. Every balance change is a balanced
-- double-entry transaction in `ledger` (each txn sums to zero), so "where is the money?" always
-- has an answer: in a user's wallet, in an order's escrow, or in the platform fee account.
-- Orders move only through the RPCs below (state machine), each locking the order row:
--   CREATED → FUNDED → DELIVERED → RELEASED
--   CREATED → CANCELLED · FUNDED → CANCELLED (refund) · FUNDED|DELIVERED → DISPUTED → RELEASED|REFUNDED

create schema if not exists commerce;
grant usage on schema commerce to anon, authenticated, service_role;

create function commerce.touch_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- org-level staff = the community admin role (one role registry for the whole empire)
create function commerce.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select role = 'ADMIN' from community.profiles where user_id = auth.uid()), false);
$$;

-- ── sellers & services (public catalogue) ────────────────────────────────
create table commerce.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  headline text check (char_length(headline) <= 120),
  bio text check (char_length(bio) <= 2000),
  skills text[] not null default '{}' check (cardinality(skills) <= 15),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on commerce.profiles
  for each row execute function commerce.touch_updated_at();

create function commerce.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into commerce.profiles (user_id, display_name)
  values (new.id, left(coalesce(nullif(split_part(new.email, '@', 1), ''), 'ผู้ใช้ใหม่'), 60))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger commerce_profile_on_signup after insert on auth.users
  for each row execute function commerce.create_profile_for_user();
insert into commerce.profiles (user_id, display_name)
select id, left(coalesce(nullif(split_part(email, '@', 1), ''), 'ผู้ใช้ใหม่'), 60) from auth.users
on conflict (user_id) do nothing;

create table commerce.services (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 5 and 120),
  description text not null check (char_length(description) between 20 and 5000),
  category text not null check (category in ('DEVELOPMENT', 'DESIGN', 'WRITING', 'MARKETING', 'VIDEO', 'AI', 'OTHER')),
  price_satang int not null check (price_satang between 10000 and 10000000), -- 100 – 100,000 THB
  delivery_days int not null check (delivery_days between 1 and 90),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on commerce.services (published, category, created_at desc);
create index on commerce.services (seller_id);
create trigger services_touch before update on commerce.services
  for each row execute function commerce.touch_updated_at();

-- ── ledger: balanced double-entry, append-only ───────────────────────────
-- account: 'user:<uuid>' · 'escrow:<order uuid>' · 'platform' (fees) · 'demo-mint' (where demo credit comes from)
create table commerce.ledger (
  id bigint generated always as identity primary key,
  txn_id uuid not null,
  account text not null check (account ~ '^(user|escrow):[0-9a-f-]{36}$' or account in ('platform', 'demo-mint')),
  amount_satang bigint not null check (amount_satang <> 0),
  memo text not null,
  order_id uuid,
  created_at timestamptz not null default now()
);
create index on commerce.ledger (account, created_at desc);
create index on commerce.ledger (txn_id);

create function commerce.forbid_ledger_changes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'ledger is append-only' using errcode = '42501';
end;
$$;
create trigger ledger_append_only before update or delete on commerce.ledger
  for each row execute function commerce.forbid_ledger_changes();

-- a transaction that doesn't sum to zero can't commit
create function commerce.check_txn_balanced() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select sum(amount_satang) from commerce.ledger where txn_id = new.txn_id) <> 0 then
    raise exception 'unbalanced ledger transaction %', new.txn_id using errcode = '23514';
  end if;
  return null;
end;
$$;
create constraint trigger ledger_balanced after insert on commerce.ledger
  deferrable initially deferred
  for each row execute function commerce.check_txn_balanced();

create function commerce.balance_of(account text) returns bigint
language sql stable security definer set search_path = ''
as $$
  select coalesce(sum(amount_satang), 0)::bigint from commerce.ledger where ledger.account = balance_of.account;
$$;

-- move `amount` from one account to another as one balanced transaction
create function commerce.transfer(from_account text, to_account text, amount bigint, memo text, order_ref uuid default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  txn uuid := gen_random_uuid();
begin
  if amount <= 0 then raise exception 'จำนวนเงินต้องมากกว่า 0' using errcode = 'P0001'; end if;
  insert into commerce.ledger (txn_id, account, amount_satang, memo, order_id)
  values (txn, from_account, -amount, memo, order_ref), (txn, to_account, amount, memo, order_ref);
  return txn;
end;
$$;

-- demo credit so people can try the flow; capped so nobody "gets rich" by clicking
create function commerce.topup_demo(amount_satang bigint) returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  account text;
begin
  if me is null then raise exception 'ต้องเข้าสู่ระบบ' using errcode = '42501'; end if;
  if amount_satang is null or amount_satang < 10000 or amount_satang > 5000000 then
    raise exception 'เติมเงินจำลองได้ครั้งละ 100 – 50,000 บาท' using errcode = 'P0001';
  end if;
  account := 'user:' || me::text;
  perform pg_advisory_xact_lock(hashtextextended(account, 0));
  if commerce.balance_of(account) + amount_satang > 10000000 then
    raise exception 'ยอดเงินจำลองสูงสุด 100,000 บาท' using errcode = 'P0001';
  end if;
  perform commerce.transfer('demo-mint', account, amount_satang, 'เติมเงินจำลอง');
  return commerce.balance_of(account);
end;
$$;

-- ── orders + their timeline ──────────────────────────────────────────────
create table commerce.orders (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references commerce.services (id) on delete set null,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  seller_id uuid not null references auth.users (id) on delete cascade,
  -- the price and title at the moment of ordering — later edits to the service don't change it
  title text not null,
  amount_satang int not null check (amount_satang > 0),
  fee_satang int not null check (fee_satang >= 0),
  delivery_days int not null,
  requirements text not null check (char_length(requirements) between 10 and 4000),
  status text not null default 'CREATED'
    check (status in ('CREATED', 'FUNDED', 'DELIVERED', 'RELEASED', 'CANCELLED', 'DISPUTED', 'REFUNDED')),
  due_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create index on commerce.orders (buyer_id, created_at desc);
create index on commerce.orders (seller_id, created_at desc);
create index on commerce.orders (status, delivered_at);
create trigger orders_touch before update on commerce.orders
  for each row execute function commerce.touch_updated_at();

create table commerce.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references commerce.orders (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  from_status text,
  to_status text not null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index on commerce.order_events (order_id, id);

create table commerce.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references commerce.orders (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index on commerce.order_messages (order_id, created_at);

create table commerce.reviews (
  order_id uuid primary key references commerce.orders (id) on delete cascade,
  service_id uuid references commerce.services (id) on delete set null,
  seller_id uuid not null references auth.users (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index on commerce.reviews (seller_id, created_at desc);
create index on commerce.reviews (service_id, created_at desc);

-- platform fee: 5% of the order, kept by the platform account on release
create function commerce.fee_for(amount int) returns int
language sql immutable set search_path = ''
as $$ select (amount * 5 / 100)::int $$;

-- lock the order, check the caller's side and the current status, then move it
create function commerce.step(
  order_id uuid, allowed_from text[], to_status text, side text, note text default null
) returns commerce.orders
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
  me uuid := auth.uid();
  previous text;
begin
  select * into o from commerce.orders where id = step.order_id for update;
  previous := o.status;
  if o.id is null or not (me in (o.buyer_id, o.seller_id) or commerce.is_staff()) then
    raise exception 'ไม่พบคำสั่งซื้อนี้' using errcode = 'P0002';
  end if;
  if side = 'buyer' and me <> o.buyer_id
     or side = 'seller' and me <> o.seller_id
     or side = 'party' and me not in (o.buyer_id, o.seller_id)
     or side = 'staff' and not commerce.is_staff() then
    raise exception 'คุณทำขั้นตอนนี้ไม่ได้' using errcode = '42501';
  end if;
  if not o.status = any (allowed_from) then
    raise exception 'คำสั่งซื้อนี้อยู่ในสถานะ % — ทำขั้นตอนนี้ไม่ได้', o.status using errcode = 'P0001';
  end if;
  update commerce.orders set status = to_status,
    due_at = case when to_status = 'FUNDED' then now() + make_interval(days => o.delivery_days) else due_at end,
    delivered_at = case when to_status = 'DELIVERED' then now() else delivered_at end
  where id = o.id returning * into o;
  insert into commerce.order_events (order_id, actor_id, from_status, to_status, note)
  values (o.id, me, previous, to_status, note);
  return o;
end;
$$;

create function commerce.place_order(service uuid, requirements text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  s commerce.services;
  new_id uuid;
begin
  if me is null then raise exception 'ต้องเข้าสู่ระบบ' using errcode = '42501'; end if;
  select * into s from commerce.services where id = service and published;
  if s.id is null then raise exception 'ไม่พบบริการนี้' using errcode = 'P0002'; end if;
  if s.seller_id = me then raise exception 'สั่งงานของตัวเองไม่ได้' using errcode = 'P0001'; end if;
  if char_length(btrim(coalesce(requirements, ''))) < 10 then
    raise exception 'บอกรายละเอียดงานอย่างน้อย 10 ตัวอักษร' using errcode = 'P0001';
  end if;
  insert into commerce.orders (service_id, buyer_id, seller_id, title, amount_satang, fee_satang,
                               delivery_days, requirements)
  values (s.id, me, s.seller_id, s.title, s.price_satang, commerce.fee_for(s.price_satang),
          s.delivery_days, btrim(requirements))
  returning id into new_id;
  insert into commerce.order_events (order_id, actor_id, to_status) values (new_id, me, 'CREATED');
  return new_id;
end;
$$;

-- buyer pays into escrow: wallet → escrow:<order>
create function commerce.fund_order(order_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
  wallet text := 'user:' || auth.uid()::text;
begin
  perform pg_advisory_xact_lock(hashtextextended(wallet, 0));
  select * into o from commerce.orders where id = fund_order.order_id;
  if o.id is not null and o.buyer_id = auth.uid() and o.status = 'CREATED'
     and commerce.balance_of(wallet) < o.amount_satang then
    raise exception 'ยอดเงินจำลองไม่พอ — เติมเงินก่อน' using errcode = 'P0001';
  end if;
  o := commerce.step(fund_order.order_id, array['CREATED'], 'FUNDED', 'buyer');
  perform commerce.transfer(wallet, 'escrow:' || o.id::text, o.amount_satang, 'ชำระเข้าเอสโครว์', o.id);
end;
$$;

create function commerce.deliver_order(order_id uuid, note text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if char_length(btrim(coalesce(note, ''))) < 5 then
    raise exception 'อธิบายงานที่ส่งอย่างน้อย 5 ตัวอักษร' using errcode = 'P0001';
  end if;
  perform commerce.step(deliver_order.order_id, array['FUNDED'], 'DELIVERED', 'seller', btrim(note));
end;
$$;

-- escrow → seller (minus the platform fee)
create function commerce.pay_out(o commerce.orders) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform commerce.transfer('escrow:' || o.id::text, 'user:' || o.seller_id::text,
    o.amount_satang - o.fee_satang, 'รับเงินจากงานที่ส่งมอบ', o.id);
  if o.fee_satang > 0 then
    perform commerce.transfer('escrow:' || o.id::text, 'platform', o.fee_satang, 'ค่าธรรมเนียมแพลตฟอร์ม 5%', o.id);
  end if;
end;
$$;

create function commerce.refund(o commerce.orders) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform commerce.transfer('escrow:' || o.id::text, 'user:' || o.buyer_id::text,
    o.amount_satang, 'คืนเงินจากเอสโครว์', o.id);
end;
$$;

create function commerce.release_order(order_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform commerce.pay_out(commerce.step(release_order.order_id, array['DELIVERED'], 'RELEASED', 'buyer'));
end;
$$;

-- before payment either side may walk away; after payment only the seller (the buyer is refunded)
create function commerce.cancel_order(order_id uuid, note text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
begin
  select * into o from commerce.orders where id = cancel_order.order_id;
  if o.status = 'FUNDED' then
    o := commerce.step(cancel_order.order_id, array['FUNDED'], 'CANCELLED', 'seller', note);
    perform commerce.refund(o);
  else
    perform commerce.step(cancel_order.order_id, array['CREATED'], 'CANCELLED', 'party', note);
  end if;
end;
$$;

create function commerce.dispute_order(order_id uuid, reason text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if char_length(btrim(coalesce(reason, ''))) < 10 then
    raise exception 'อธิบายปัญหาอย่างน้อย 10 ตัวอักษร' using errcode = 'P0001';
  end if;
  perform commerce.step(dispute_order.order_id, array['FUNDED', 'DELIVERED'], 'DISPUTED', 'party', btrim(reason));
end;
$$;

create function commerce.resolve_dispute(order_id uuid, outcome text, note text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
begin
  if outcome not in ('RELEASE', 'REFUND') then
    raise exception 'outcome ต้องเป็น RELEASE หรือ REFUND' using errcode = 'P0001';
  end if;
  o := commerce.step(resolve_dispute.order_id, array['DISPUTED'],
    case when outcome = 'RELEASE' then 'RELEASED' else 'REFUNDED' end, 'staff', note);
  if outcome = 'RELEASE' then perform commerce.pay_out(o); else perform commerce.refund(o); end if;
end;
$$;

-- delivered work the buyer never answers releases itself after 3 days (checked lazily on reads)
create function commerce.auto_release() returns int
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
  n int := 0;
begin
  for o in select * from commerce.orders
           where status = 'DELIVERED' and delivered_at < now() - interval '3 days' for update skip locked
  loop
    update commerce.orders set status = 'RELEASED' where id = o.id;
    insert into commerce.order_events (order_id, actor_id, from_status, to_status, note)
    values (o.id, null, 'DELIVERED', 'RELEASED', 'ปล่อยเงินอัตโนมัติหลังส่งมอบ 3 วัน');
    perform commerce.pay_out(o);
    n := n + 1;
  end loop;
  return n;
end;
$$;

create function commerce.leave_review(order_id uuid, rating int, body text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  o commerce.orders;
begin
  select * into o from commerce.orders where id = leave_review.order_id;
  if o.id is null or o.buyer_id <> auth.uid() then raise exception 'ไม่พบคำสั่งซื้อนี้' using errcode = 'P0002'; end if;
  if o.status <> 'RELEASED' then raise exception 'รีวิวได้หลังรับงานแล้วเท่านั้น' using errcode = 'P0001'; end if;
  if rating is null or rating not between 1 and 5 then raise exception 'ให้คะแนน 1-5 ดาว' using errcode = 'P0001'; end if;
  insert into commerce.reviews (order_id, service_id, seller_id, buyer_id, rating, body)
  values (o.id, o.service_id, o.seller_id, o.buyer_id, rating, nullif(btrim(coalesce(body, '')), ''))
  on conflict on constraint reviews_pkey do nothing;
  if not found then raise exception 'รีวิวคำสั่งซื้อนี้ไปแล้ว' using errcode = '23505'; end if;
end;
$$;

-- ── read models ──────────────────────────────────────────────────────────
create view commerce.service_cards with (security_invoker = true) as
select s.*, p.display_name as seller_name, p.headline as seller_headline,
  (select round(avg(r.rating), 1) from commerce.reviews r where r.service_id = s.id) as rating,
  (select count(*)::int from commerce.reviews r where r.service_id = s.id) as review_count
from commerce.services s join commerce.profiles p on p.user_id = s.seller_id;

create view commerce.my_wallet with (security_invoker = true) as
select l.* from commerce.ledger l where l.account = 'user:' || auth.uid()::text;

-- ── row level security ───────────────────────────────────────────────────
alter table commerce.profiles enable row level security;
alter table commerce.services enable row level security;
alter table commerce.ledger enable row level security;
alter table commerce.orders enable row level security;
alter table commerce.order_events enable row level security;
alter table commerce.order_messages enable row level security;
alter table commerce.reviews enable row level security;

-- the catalogue is public on purpose (SEO): seller profiles, published services, reviews
create policy "public seller profiles" on commerce.profiles for select to anon, authenticated using (true);
create policy "edit own profile" on commerce.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "published services are public; sellers see their drafts" on commerce.services
  for select to anon, authenticated using (published or (select auth.uid()) = seller_id);
create policy "sellers manage their services" on commerce.services for all to authenticated
  using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);
create policy "public reviews" on commerce.reviews for select to anon, authenticated using (true);

create policy "your own wallet entries; staff see all" on commerce.ledger for select to authenticated
  using (account = 'user:' || (select auth.uid())::text or commerce.is_staff());
create policy "buyer and seller see their orders; staff see all" on commerce.orders for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id) or commerce.is_staff());
create policy "order timeline for its parties" on commerce.order_events for select to authenticated
  using (exists (select 1 from commerce.orders o where o.id = order_id));
create policy "order chat for its parties" on commerce.order_messages for select to authenticated
  using (exists (select 1 from commerce.orders o where o.id = order_id));
create policy "write in your own order chat" on commerce.order_messages for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (select 1 from commerce.orders o where o.id = order_id and (select auth.uid()) in (o.buyer_id, o.seller_id))
  );

grant select on commerce.profiles, commerce.services, commerce.reviews, commerce.service_cards to anon, authenticated;
grant update (display_name, headline, bio, skills) on commerce.profiles to authenticated;
grant insert, update, delete on commerce.services to authenticated;
grant select on commerce.ledger, commerce.orders, commerce.order_events, commerce.order_messages,
  commerce.my_wallet to authenticated;
grant insert on commerce.order_messages to authenticated;
grant all on all tables in schema commerce to service_role;

revoke all on function
  commerce.is_staff(), commerce.balance_of(text), commerce.transfer(text, text, bigint, text, uuid),
  commerce.topup_demo(bigint), commerce.step(uuid, text[], text, text, text),
  commerce.place_order(uuid, text), commerce.fund_order(uuid), commerce.deliver_order(uuid, text),
  commerce.pay_out(commerce.orders), commerce.refund(commerce.orders), commerce.release_order(uuid),
  commerce.cancel_order(uuid, text), commerce.dispute_order(uuid, text), commerce.resolve_dispute(uuid, text, text),
  commerce.auto_release(), commerce.leave_review(uuid, int, text)
from public;
grant execute on function
  commerce.is_staff(), commerce.topup_demo(bigint), commerce.place_order(uuid, text), commerce.fund_order(uuid),
  commerce.deliver_order(uuid, text), commerce.release_order(uuid), commerce.cancel_order(uuid, text),
  commerce.dispute_order(uuid, text), commerce.resolve_dispute(uuid, text, text), commerce.auto_release(),
  commerce.leave_review(uuid, int, text)
to authenticated;
