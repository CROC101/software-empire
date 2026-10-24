-- Profile frames (community "แต่งโปรไฟล์") · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local');

select is(
  (select avatar_frame from community.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  'classic', 'new members start with the classic frame'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$update community.profiles set avatar_frame = 'aurora' where user_id = '11111111-1111-1111-1111-111111111111'$$,
  'a member picks a frame for their own profile'
);
select is(
  (select avatar_frame from community.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  'aurora', 'the pick is saved'
);
select throws_ok(
  $$update community.profiles set avatar_frame = 'diamond' where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'only known frames are accepted'
);

-- RLS: someone else's row is simply not updatable
update community.profiles set avatar_frame = 'mono' where user_id = '22222222-2222-2222-2222-222222222222';
reset role;
select is(
  (select avatar_frame from community.profiles where user_id = '22222222-2222-2222-2222-222222222222'),
  'classic', 'nobody can change another member''s frame'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is(
  (select avatar_frame from community.profiles where user_id = '11111111-1111-1111-1111-111111111111'),
  'aurora', 'other members see the frame'
);

select * from finish();
rollback;
