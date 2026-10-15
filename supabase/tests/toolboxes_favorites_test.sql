-- RLS tests for toolboxes.favorites · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');
insert into toolboxes.favorites (user_id, slug) values
  ('11111111-1111-1111-1111-111111111111', 'json-formatter'),
  ('22222222-2222-2222-2222-222222222222', 'qr-code-generator');

select has_table('toolboxes', 'favorites', 'table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'toolboxes.favorites'::regclass),
  'row level security is enabled'
);

-- act as user A
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  'select slug from toolboxes.favorites',
  $$values ('json-formatter')$$,
  'A sees only their own favorites'
);
select lives_ok(
  $$insert into toolboxes.favorites (slug) values ('word-counter')$$,
  'A adds a favorite; user_id defaults to auth.uid()'
);
select throws_ok(
  $$insert into toolboxes.favorites (user_id, slug)
    values ('22222222-2222-2222-2222-222222222222', 'planted')$$,
  '42501', null,
  'A cannot add a favorite for B'
);
select throws_ok(
  $$update toolboxes.favorites set slug = 'renamed'$$,
  '42501', null,
  'favorites cannot be updated'
);
select throws_ok(
  $$insert into toolboxes.favorites (slug) values ('Not A Slug!')$$,
  '23514', null,
  'slug format is enforced'
);
-- B's row is invisible to A, so this deletes nothing
delete from toolboxes.favorites where user_id = '22222222-2222-2222-2222-222222222222';

reset role;
set local role anon;
select throws_ok(
  'select * from toolboxes.favorites',
  '42501', null,
  'signed-out visitors have no access'
);

reset role;
select results_eq(
  $$select count(*)::int from toolboxes.favorites
    where user_id = '22222222-2222-2222-2222-222222222222'$$,
  $$values (1)$$,
  'B''s favorite survived A''s delete'
);

select * from finish();
rollback;
