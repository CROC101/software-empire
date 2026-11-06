-- Readings history and coin spending for the tarot schema · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');

-- B kept a reading (as postgres)
insert into tarot.readings (user_id, spread, topic, cards, cost) values
  ('22222222-2222-2222-2222-222222222222', 'one', 'general', '[{"id":"m00","reversed":false}]', 0);
-- A has 15 coins from two check-ins
insert into tarot.checkins (user_id, day, coins) values
  ('11111111-1111-1111-1111-111111111111', tarot.today() - 1, 10),
  ('11111111-1111-1111-1111-111111111111', tarot.today() - 3, 5);

select ok(
  (select relrowsecurity from pg_class where oid = 'tarot.readings'::regclass),
  'row level security is enabled on readings'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from tarot.readings), 0, 'A cannot see B''s readings');
select throws_ok(
  $$insert into tarot.readings (spread, topic, cards, cost)
    values ('celtic', 'general', '[{"id":"m00","reversed":false}]', 0)$$,
  '42501', null,
  'A cannot write a reading directly (and skip paying)'
);

select is(
  tarot.record_reading('three', 'work', ' งานใหม่? ',
    '[{"id":"m04","reversed":false},{"id":"cups14","reversed":true},{"id":"swords01","reversed":false}]'),
  15,
  'a free spread is kept and costs nothing'
);
select is(
  (select question from tarot.readings),
  'งานใหม่?',
  'the question is kept trimmed'
);
select is(
  tarot.record_reading('love', 'love', null,
    '[{"id":"m06","reversed":false},{"id":"cups02","reversed":false},{"id":"cups10","reversed":false},{"id":"swords03","reversed":true},{"id":"m19","reversed":false}]'),
  5,
  'the love spread costs 10 coins'
);
select is((select coins from tarot.my_status()), 5, 'the balance counts coins spent');
select throws_ok(
  $$select tarot.record_reading('celtic', 'general', null, '[{"id":"m00","reversed":false}]')$$,
  'P0001', null,
  'a spread that costs more than the balance is refused'
);
select throws_ok(
  $$select tarot.record_reading('one', 'general', null, '[{"id":"m22","reversed":false}]')$$,
  '22023', null,
  'a card that is not in the deck is refused'
);
select throws_ok(
  $$select tarot.record_reading('three', 'general', null,
    '[{"id":"m01","reversed":false},{"id":"m01","reversed":true},{"id":"m02","reversed":false}]')$$,
  '22023', null,
  'the same card twice is refused'
);
select throws_ok(
  $$select tarot.record_reading('tower', 'general', null, '[{"id":"m01","reversed":false}]')$$,
  '22023', null,
  'an unknown spread is refused'
);
select is((select count(*)::int from tarot.readings), 2, 'refused readings leave no row');

select lives_ok(
  $$update tarot.readings set hidden = true where spread = 'love'$$,
  'A hides a reading from their history'
);
select is((select coins from tarot.my_status()), 5, 'hiding a reading does not refund its coins');
select throws_ok(
  $$delete from tarot.readings$$,
  '42501', null,
  'readings cannot be deleted'
);

select * from finish();
rollback;
