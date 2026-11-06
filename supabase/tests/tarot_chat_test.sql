-- Ask-the-owl chat for the tarot schema · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');
-- A has 45 coins
insert into tarot.checkins (user_id, day, coins) values
  ('11111111-1111-1111-1111-111111111111', tarot.today() - 1, 30),
  ('11111111-1111-1111-1111-111111111111', tarot.today() - 2, 15);

select ok(
  (select bool_and(relrowsecurity) from pg_class where oid in (
    'tarot.chats'::regclass, 'tarot.chat_messages'::regclass,
    'tarot.memories'::regclass, 'tarot.chat_settings'::regclass)),
  'row level security is enabled on every chat table'
);

-- readers cannot price, record or write messages themselves
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select throws_ok(
  $$select * from tarot.ask_record('11111111-1111-1111-1111-111111111111', null, 'chat', 'medium', 'q', 'a', null, 'gemini', null)$$,
  '42501', null, 'a reader cannot record (and so cannot skip paying)'
);
select throws_ok(
  $$insert into tarot.chat_messages (chat_id, user_id, role, mode, body) values (gen_random_uuid(), auth.uid(), 'owl', 'chat', 'x')$$,
  '42501', null, 'a reader cannot write messages directly'
);
select lives_ok(
  $$insert into tarot.chat_settings (tone, length) values ('genz', 'detailed')$$,
  'a reader keeps their own chat settings'
);

-- the Worker (service key)
reset role;
set local role service_role;
select is(
  (select row(cost, balance)::text from tarot.ask_quote('11111111-1111-1111-1111-111111111111', 'reading', 'medium')),
  '(20,45)', 'a medium reading costs 20'
);
select is(
  (select row(cost, balance)::text from tarot.ask_record('11111111-1111-1111-1111-111111111111', null, 'reading', 'medium',
    'งานใหม่ดีไหม', 'ไพ่บอกว่า…', '[{"id":"m17","reversed":false}]', 'claude', array['เพิ่งเปลี่ยนงาน'])),
  '(20,25)', 'recording a reading charges it and makes the room'
);
select is((select count(*)::int from tarot.chats), 1, 'one room now');
select is((select title from tarot.chats), 'งานใหม่ดีไหม', 'the room is named after the first question');
select is((select count(*)::int from tarot.memories), 1, 'the note is remembered');

-- three free casual messages, then 10 each
select tarot.ask_record('11111111-1111-1111-1111-111111111111', (select id from tarot.chats), 'chat', 'medium', 'q', 'a', null, 'gemini', null)
  from generate_series(1, 3);
select is(
  (select cost from tarot.ask_quote('11111111-1111-1111-1111-111111111111', 'chat', 'medium')),
  10, 'the fourth casual message of the day costs 10'
);
select throws_ok(
  $$select * from tarot.ask_record('11111111-1111-1111-1111-111111111111', null, 'reading', 'very_detailed', 'q', 'a', null, 'claude', null)$$,
  'P0001', null, 'a reading that costs more than the balance is refused'
);
select throws_ok(
  $$select * from tarot.ask_record('22222222-2222-2222-2222-222222222222', (select id from tarot.chats), 'chat', 'medium', 'q', 'a', null, 'gemini', null)$$,
  '42501', null, 'nobody writes into another reader''s room'
);

-- three rooms at most
select tarot.ask_record('11111111-1111-1111-1111-111111111111', null, 'chat', 'medium', 'room ' || n, 'a', null, 'gemini', null)
  from generate_series(2, 3) n;
select throws_ok(
  $$select * from tarot.ask_record('11111111-1111-1111-1111-111111111111', null, 'chat', 'medium', 'room 4', 'a', null, 'gemini', null)$$,
  'P0002', null, 'a fourth room is refused'
);

-- back as A: own rows only, balance counts chat spending
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is((select coins from tarot.my_status()), 5, 'the balance counts coins spent on chat');
select lives_ok($$delete from tarot.memories$$, 'A forgets what the owl remembered');
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((select count(*)::int from tarot.chat_messages), 0, 'B cannot read A''s messages');

select * from finish();
rollback;
