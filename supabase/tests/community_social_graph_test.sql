-- Social graph privacy rules · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- A, B, C sign up; the trigger creates their profiles
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local');

select is(
  (select display_name from community.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  'alice',
  'signup creates a profile named after the email'
);

-- B follows A, A follows C, C follows B (as postgres)
insert into community.follows (follower_id, followee_id) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select count(*)::int from community.profiles where user_id in (
    '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333')),
  3,
  'A sees every profile while nobody blocks'
);
select results_eq(
  'select user_id from community.follow_suggestions(10)',
  $$values ('22222222-2222-2222-2222-222222222222'::uuid)$$,
  'A is suggested B (followed by C, whom A follows)'
);
select throws_ok(
  $$update community.profiles set role = 'ADMIN' where user_id = auth.uid()$$,
  '42501', null,
  'A cannot promote themselves'
);
select lives_ok(
  $$update community.profiles set bio = 'สวัสดี', website = 'https://example.com' where user_id = auth.uid()$$,
  'A edits their own bio and website'
);
update community.profiles set bio = 'hijack' where user_id = '22222222-2222-2222-2222-222222222222';
select throws_ok(
  $$update community.profiles set website = 'javascript:alert(1)' where user_id = auth.uid()$$,
  '23514', null,
  'website must be http(s)'
);
select throws_ok(
  $$insert into community.follows (follower_id, followee_id)
    values ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')$$,
  '42501', null,
  'A cannot create a follow on B''s behalf'
);
select throws_ok(
  $$insert into community.blocks (blocker_id, blocked_id)
    values (auth.uid(), '22222222-2222-2222-2222-222222222222')$$,
  '42501', null,
  'blocks go through block_user(), not a raw insert'
);

-- A blocks B: B's follow of A disappears
select lives_ok(
  $$select community.block_user('22222222-2222-2222-2222-222222222222')$$,
  'A blocks B'
);
select is(
  (select count(*)::int from community.follows where follower_id = '22222222-2222-2222-2222-222222222222'
     and followee_id = auth.uid()),
  0,
  'blocking removed B''s follow of A'
);
select throws_ok(
  $$insert into community.follows (follower_id, followee_id)
    values (auth.uid(), '22222222-2222-2222-2222-222222222222')$$,
  '42501', null,
  'A cannot follow someone they blocked'
);
select is(
  (select count(*)::int from community.follow_suggestions(10)),
  0,
  'blocked people are never suggested'
);

-- B's view: A's profile is hidden, B cannot see A blocked them
select set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is(
  (select count(*)::int from community.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'B cannot see the profile of someone who blocked them'
);
select is((select count(*)::int from community.blocks), 0, 'B cannot see who blocked them');

reset role;
select is(
  (select bio from community.profiles where user_id = '22222222-2222-2222-2222-222222222222'),
  null,
  'A''s update could not touch B''s profile'
);

select * from finish();
rollback;
