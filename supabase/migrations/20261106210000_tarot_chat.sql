-- Ask the owl: chat rooms with an AI reader. The crocwork-tarot Worker writes every message with
-- the service key after the AI answers (ask_record); readers only read their own rows, rename and
-- delete their rooms, change their settings and forget memories. Coins: a reading message costs
-- by answer length; casual chat is free three times a Bangkok day, then costs.

create table tarot.chat_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  tone text not null default 'casual' check (tone in ('formal', 'polite', 'casual', 'genz')),
  length text not null default 'medium' check (length in ('medium', 'detailed', 'very_detailed')),
  remember_profile boolean not null default true,
  remember_notes boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table tarot.chat_settings enable row level security;
create trigger touch before update on tarot.chat_settings
  for each row execute function tarot.touch_updated_at();
create policy "own chat settings: read" on tarot.chat_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own chat settings: create" on tarot.chat_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own chat settings: edit" on tarot.chat_settings
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update (tone, length, remember_profile, remember_notes)
  on tarot.chat_settings to authenticated;
grant select on tarot.chat_settings to service_role;

create table tarot.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'บทสนทนาใหม่' check (char_length(btrim(title)) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chats_user on tarot.chats (user_id, updated_at desc);
alter table tarot.chats enable row level security;
create trigger touch before update on tarot.chats
  for each row execute function tarot.touch_updated_at();
create policy "own chats: read" on tarot.chats
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own chats: rename" on tarot.chats
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own chats: delete" on tarot.chats
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, update (title), delete on tarot.chats to authenticated;
grant select, update on tarot.chats to service_role;

create table tarot.chat_messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references tarot.chats (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'owl')),
  mode text not null check (mode in ('reading', 'chat')),
  body text not null check (char_length(body) between 1 and 6000),
  -- [{"id":"m17","reversed":false}, …] on the owl's reading answers
  cards jsonb check (cards is null or (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) <= 5)),
  cost integer not null default 0 check (cost >= 0),
  -- which engine wrote an owl message (claude / gemini), for the owner's cost tracking
  engine text,
  created_at timestamptz not null default now()
);
create index chat_messages_chat on tarot.chat_messages (chat_id, id);
create index chat_messages_user_day on tarot.chat_messages (user_id, created_at);
alter table tarot.chat_messages enable row level security;
create policy "own messages: read" on tarot.chat_messages
  for select to authenticated using (user_id = (select auth.uid()));
grant select on tarot.chat_messages to authenticated;
grant select on tarot.chat_messages to service_role;

create table tarot.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  note text not null check (char_length(note) between 1 and 300),
  created_at timestamptz not null default now()
);
create index memories_user on tarot.memories (user_id, created_at desc);
alter table tarot.memories enable row level security;
create policy "own memories: read" on tarot.memories
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own memories: forget" on tarot.memories
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, delete on tarot.memories to authenticated;
grant select on tarot.memories to service_role;

-- prices (the app shows the same numbers: apps/tarot/src/lib/ask.ts)
create function tarot.ask_cost(who uuid, mode text, length text) returns integer
language sql stable set search_path = ''
as $$
  select case
    when mode = 'reading' then
      case length when 'detailed' then 30 when 'very_detailed' then 40 else 20 end
    -- casual chat: the first three of the Bangkok day are free
    when (
      select count(*) from tarot.chat_messages m
      where m.user_id = who and m.role = 'user' and m.mode = 'chat'
        and (m.created_at at time zone 'Asia/Bangkok')::date = tarot.today()
    ) < 3 then 0
    else 10
  end;
$$;

-- balance now also counts what chat spent
create or replace function tarot.my_status()
returns table (coins integer, streak integer, checked_today boolean)
language sql stable set search_path = ''
as $$
  select
    (coalesce((select sum(c.coins) from tarot.checkins c where c.user_id = (select auth.uid())), 0)
      - coalesce((select sum(r.cost) from tarot.readings r where r.user_id = (select auth.uid())), 0)
      - coalesce((select sum(m.cost) from tarot.chat_messages m where m.user_id = (select auth.uid())), 0)
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

-- a reader's balance without a session (the Worker asks on their behalf)
create function tarot.balance_of(who uuid) returns integer
language sql stable set search_path = ''
as $$
  select (
    coalesce((select sum(c.coins) from tarot.checkins c where c.user_id = who), 0)
    - coalesce((select sum(r.cost) from tarot.readings r where r.user_id = who), 0)
    - coalesce((select sum(m.cost) from tarot.chat_messages m where m.user_id = who), 0)
  )::integer;
$$;

-- before calling the AI: what this message will cost and whether the reader can pay
create function tarot.ask_quote(who uuid, mode text, length text)
returns table (cost integer, balance integer)
language sql stable set search_path = ''
as $$
  select tarot.ask_cost(who, mode, length), tarot.balance_of(who);
$$;

-- after the AI answered: keep both messages and charge, in one step; makes the room on first use
create function tarot.ask_record(
  who uuid, room uuid, mode text, length text, question text, answer text, cards jsonb,
  engine text, notes text[]
) returns table (chat_id uuid, cost integer, balance integer)
language plpgsql security definer set search_path = ''
as $$
declare
  price integer;
  left_over integer;
  target uuid := room;
begin
  perform pg_advisory_xact_lock(hashtextextended(who::text, 0));
  if target is null then
    if (select count(*) from tarot.chats c where c.user_id = who) >= 3 then
      raise exception 'three rooms already: delete one first' using errcode = 'P0002';
    end if;
    insert into tarot.chats (user_id, title) values (who, left(btrim(question), 30))
      returning id into target;
  elsif not exists (select 1 from tarot.chats c where c.id = target and c.user_id = who) then
    raise exception 'not your room' using errcode = '42501';
  end if;

  -- price after the room checks, so a full set of rooms says so rather than "not enough coins";
  -- any refusal rolls the whole call back, including a room just made
  price := tarot.ask_cost(who, mode, length);
  left_over := tarot.balance_of(who);
  if left_over < price then
    raise exception 'not enough coins: % needed, % left', price, left_over using errcode = 'P0001';
  end if;

  insert into tarot.chat_messages (chat_id, user_id, role, mode, body, cost)
    values (target, who, 'user', mode, question, price);
  insert into tarot.chat_messages (chat_id, user_id, role, mode, body, cards, engine)
    values (target, who, 'owl', mode, answer, cards, engine);
  update tarot.chats set updated_at = now() where id = target;

  if coalesce((select s.remember_notes from tarot.chat_settings s where s.user_id = who), true) then
    insert into tarot.memories (user_id, note)
      select who, left(btrim(n), 300) from unnest(coalesce(notes, '{}')) n where btrim(n) <> '';
    -- keep the twenty newest
    delete from tarot.memories m where m.user_id = who and m.id not in (
      select m2.id from tarot.memories m2 where m2.user_id = who order by m2.created_at desc limit 20
    );
  end if;

  return query select target, price, left_over - price;
end;
$$;

revoke execute on function tarot.ask_cost(uuid, text, text), tarot.balance_of(uuid),
  tarot.ask_quote(uuid, text, text),
  tarot.ask_record(uuid, uuid, text, text, text, text, jsonb, text, text[]) from public;
-- only the Worker (service key) prices and records chat; readers never call these
grant execute on function tarot.ask_cost(uuid, text, text), tarot.balance_of(uuid),
  tarot.ask_quote(uuid, text, text),
  tarot.ask_record(uuid, uuid, text, text, text, text, jsonb, text, text[]) to service_role;
grant usage on schema tarot to service_role;
grant select on tarot.profiles to service_role;
-- what the pricing and balance functions read when the Worker calls them
grant execute on function tarot.today(), tarot.streak(uuid, date) to service_role;
grant select on tarot.checkins, tarot.readings to service_role;
