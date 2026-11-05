-- RLS, check-in rules and coins for the tarot schema · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');

-- B's data, created as postgres (bypasses RLS)
insert into tarot.profiles (user_id, nickname) values
  ('22222222-2222-2222-2222-222222222222', 'บีบี');
insert into tarot.checkins (user_id, day, coins) values
  ('22222222-2222-2222-2222-222222222222', tarot.today(), 10);

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('tarot.profiles'::regclass, 'tarot.checkins'::regclass)),
  'row level security is enabled on every tarot table'
);

-- anon sees nothing and cannot check in
set local role anon;
select throws_ok($$select * from tarot.profiles$$, '42501', null, 'anon cannot read profiles');
select throws_ok($$select * from tarot.check_in()$$, '42501', null, 'anon cannot check in');

-- act as user A
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from tarot.profiles), 0, 'A cannot see B''s profile');
select is((select count(*)::int from tarot.checkins), 0, 'A cannot see B''s check-ins');

select lives_ok(
  $$insert into tarot.profiles (nickname, gender) values ('เอ', 'lgbtq')$$,
  'A creates a profile; user_id defaults to auth.uid()'
);
select throws_ok(
  $$insert into tarot.profiles (user_id, nickname)
    values ('22222222-2222-2222-2222-222222222222', 'แอบ')$$,
  '42501', null,
  'A cannot create a profile for B'
);
select throws_ok(
  $$update tarot.profiles set nickname = 'x' where user_id = (select auth.uid())$$,
  '23514', null,
  'a nickname needs at least 2 characters'
);
select throws_ok(
  $$insert into tarot.checkins (user_id, day, coins)
    values ('11111111-1111-1111-1111-111111111111', tarot.today(), 100)$$,
  '42501', null,
  'A cannot write check-in rows directly'
);

select is(
  (select row(coins, streak, checked_today, earned)::text from tarot.check_in()),
  '(10,1,t,10)',
  'first check-in pays 10 coins and starts a streak of 1'
);
select is(
  (select row(coins, streak, checked_today, earned)::text from tarot.check_in()),
  '(10,1,t,0)',
  'a second check-in the same day pays nothing'
);

-- six earlier days in a row (planted as postgres), so tomorrow's logic can be checked today
reset role;
delete from tarot.checkins where user_id = '11111111-1111-1111-1111-111111111111';
insert into tarot.checkins (user_id, day, coins)
  select '11111111-1111-1111-1111-111111111111', tarot.today() - n, 10 from generate_series(1, 6) n;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select row(coins, streak, checked_today)::text from tarot.my_status()),
  '(60,6,f)',
  'a streak is still alive the day after the last check-in'
);
select is(
  (select row(coins, streak, earned)::text from tarot.check_in()),
  '(90,7,30)',
  'the 7th day in a row pays 30'
);

-- a gap resets the streak
reset role;
delete from tarot.checkins where user_id = '11111111-1111-1111-1111-111111111111';
insert into tarot.checkins (user_id, day, coins) values
  ('11111111-1111-1111-1111-111111111111', tarot.today() - 2, 10);
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select streak from tarot.my_status()),
  0,
  'missing yesterday ends the streak'
);
select is(
  (select row(streak, earned)::text from tarot.check_in()),
  '(1,10)',
  'checking in after a gap starts again at 1'
);
select is(
  (select coins from tarot.my_status()),
  20,
  'coins add up across every check-in'
);

select * from finish();
rollback;
