-- Tarot readings: every spread a signed-in reader opens is kept as history, and the special
-- spreads cost coins. Coins earned (check-ins) minus coins spent (readings) is the balance; a
-- reading that would take it below zero is refused inside the database, so the browser cannot
-- spend coins it does not have.

-- what each spread costs; the browser shows the same numbers (apps/tarot/src/lib/reading.ts)
create function tarot.spread_cost(spread text) returns integer
language sql immutable set search_path = ''
as $$
  select case spread
    when 'one' then 0
    when 'three' then 0
    when 'yesno' then 0
    when 'love' then 10
    when 'celtic' then 20
  end;
$$;

create table tarot.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spread text not null check (tarot.spread_cost(spread) is not null),
  topic text not null check (topic in ('general', 'love', 'work', 'money')),
  question text check (char_length(question) <= 120),
  -- [{"id": "m04", "reversed": false}, …] in position order
  cards jsonb not null check (
    jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) between 1 and 10
  ),
  cost integer not null check (cost >= 0),
  -- a reader may hide a reading from their history, never delete it: its cost stays spent
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table tarot.readings is 'Spreads a reader opened. Written by tarot.record_reading() only.';
create index readings_user_created on tarot.readings (user_id, created_at desc);
alter table tarot.readings enable row level security;
create policy "own readings: read" on tarot.readings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own readings: hide" on tarot.readings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, update (hidden) on tarot.readings to authenticated;

-- balance = coins earned by check-ins - coins spent on readings
create or replace function tarot.my_status()
returns table (coins integer, streak integer, checked_today boolean)
language sql stable set search_path = ''
as $$
  select
    (coalesce((select sum(c.coins) from tarot.checkins c where c.user_id = (select auth.uid())), 0)
      - coalesce((select sum(r.cost) from tarot.readings r where r.user_id = (select auth.uid())), 0)
    )::integer,
    greatest(
      tarot.streak((select auth.uid()), tarot.today()),
      tarot.streak((select auth.uid()), tarot.today() - 1)
    ),
    exists (
      select 1 from tarot.checkins c
      where c.user_id = (select auth.uid()) and c.day = tarot.today()
    );
$$;

-- keep a reading and pay for it; returns the new balance
create function tarot.record_reading(spread text, topic text, question text, cards jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  who uuid := auth.uid();
  price integer := tarot.spread_cost(spread);
  balance integer;
  card jsonb;
begin
  if who is null then
    raise exception 'sign in to keep a reading' using errcode = '28000';
  end if;
  if price is null then
    raise exception 'unknown spread %', spread using errcode = '22023';
  end if;
  if jsonb_typeof(cards) <> 'array' then
    raise exception 'cards must be a list' using errcode = '22023';
  end if;
  for card in select * from jsonb_array_elements(cards) loop
    if jsonb_typeof(card -> 'reversed') <> 'boolean'
      or coalesce(card ->> 'id', '') !~ '^(m(0[0-9]|1[0-9]|2[01])|(wands|cups|swords|pentacles)(0[1-9]|1[0-4]))$'
    then
      raise exception 'not a card: %', card using errcode = '22023';
    end if;
  end loop;
  if (select count(distinct c ->> 'id') from jsonb_array_elements(cards) c) <> jsonb_array_length(cards) then
    raise exception 'a card appears twice' using errcode = '22023';
  end if;

  -- one spend at a time per reader, so two tabs cannot both spend the last coins
  perform pg_advisory_xact_lock(hashtextextended(who::text, 0));
  select s.coins into balance from tarot.my_status() s;
  if balance < price then
    raise exception 'not enough coins: % needed, % left', price, balance using errcode = 'P0001';
  end if;

  insert into tarot.readings (user_id, spread, topic, question, cards, cost)
  values (who, spread, topic, nullif(btrim(question), ''), cards, price);
  return balance - price;
end;
$$;

revoke execute on function tarot.spread_cost(text), tarot.record_reading(text, text, text, jsonb)
  from public;
grant execute on function tarot.spread_cost(text), tarot.record_reading(text, text, text, jsonb)
  to authenticated;
