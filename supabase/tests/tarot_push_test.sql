-- Daily reminder subscriptions for the tarot schema · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');

select ok(
  (select relrowsecurity from pg_class where oid = 'tarot.push_subscriptions'::regclass),
  'row level security is enabled on push subscriptions'
);

set local role anon;
select throws_ok(
  $$select tarot.save_push('https://push.example/a', 'k', 'x')$$,
  '42501', null,
  'anon cannot subscribe'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok(
  $$select tarot.save_push('https://push.example/a', 'key-a', 'auth-a')$$,
  'A subscribes a browser'
);
select throws_ok(
  $$insert into tarot.push_subscriptions (endpoint, p256dh, auth) values ('https://push.example/b', 'k', 'x')$$,
  '42501', null,
  'subscriptions are not written directly'
);
select throws_ok(
  $$select tarot.save_push('http://push.example/c', 'k', 'x')$$,
  '23514', null,
  'only https push endpoints are kept'
);

-- B subscribes the same browser (a shared device): it moves to B
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select lives_ok(
  $$select tarot.save_push('https://push.example/a', 'key-b', 'auth-b')$$,
  'B subscribes the same browser'
);
select is((select count(*)::int from tarot.push_subscriptions), 1, 'B now owns that browser');

select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select tarot.drop_push('https://push.example/a');
reset role;
select is((select count(*)::int from tarot.push_subscriptions), 1, 'A cannot unsubscribe B''s browser');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select tarot.drop_push('https://push.example/a');
reset role;
select is((select count(*)::int from tarot.push_subscriptions), 0, 'B unsubscribes their browser');

select * from finish();
rollback;
