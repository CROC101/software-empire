-- RLS tests for toolboxes.sync_items and the toolboxes-sync bucket · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');
insert into toolboxes.sync_items (user_id, path, sha256, size_bytes) values
  ('11111111-1111-1111-1111-111111111111', 'idb/photocraft', repeat('a', 64), 10),
  ('22222222-2222-2222-2222-222222222222', 'idb/wordcraft', repeat('b', 64), 20);
insert into storage.objects (bucket_id, name) values
  ('toolboxes-sync', '22222222-2222-2222-2222-222222222222/' || repeat('b', 64));

select ok(
  (select relrowsecurity from pg_class where oid = 'toolboxes.sync_items'::regclass),
  'row level security is enabled'
);
select is(
  (select public from storage.buckets where id = 'toolboxes-sync'),
  false,
  'the sync bucket is private'
);

-- act as user A
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

select results_eq(
  'select path from toolboxes.sync_items',
  $$values ('idb/photocraft')$$,
  'A sees only their own items'
);
select lives_ok(
  $$insert into toolboxes.sync_items (path, sha256, size_bytes)
    values ('opfs/projects/a%20b.pcf', repeat('c', 64), 5)$$,
  'A adds an item; user_id defaults to auth.uid()'
);
select lives_ok(
  $$update toolboxes.sync_items set sha256 = repeat('d', 64), updated_at = now()
    where path = 'idb/photocraft'$$,
  'A updates their own item'
);
select throws_ok(
  $$insert into toolboxes.sync_items (user_id, path, sha256, size_bytes)
    values ('22222222-2222-2222-2222-222222222222', 'idb/planted', repeat('e', 64), 1)$$,
  '42501', null,
  'A cannot add an item for B'
);
select throws_ok(
  $$insert into toolboxes.sync_items (path, sha256, size_bytes)
    values ('idb/../../escape', repeat('f', 64), 1)$$,
  '23514', null,
  'path format is enforced'
);
select throws_ok(
  $$insert into toolboxes.sync_items (path, sha256, size_bytes)
    values ('idb/huge', repeat('f', 64), 52428801)$$,
  '23514', null,
  'one item is at most 50 MB'
);
select throws_ok(
  $$insert into toolboxes.sync_items (path, sha256, size_bytes)
    select 'idb/big' || n, repeat('0', 64), 52428800 from generate_series(1, 21) n$$,
  'P0001', null,
  'the 1 GiB quota is enforced'
);

update toolboxes.sync_items set path = 'idb/hijacked'
  where user_id = '22222222-2222-2222-2222-222222222222';

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('toolboxes-sync', '11111111-1111-1111-1111-111111111111/' || repeat('a', 64))$$,
  'A uploads bytes into their own folder'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('toolboxes-sync', '22222222-2222-2222-2222-222222222222/' || repeat('e', 64))$$,
  '42501', null,
  'A cannot upload into B''s folder'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'toolboxes-sync'),
  1,
  'A lists only their own bytes'
);

reset role;
set local role anon;
select throws_ok(
  'select * from toolboxes.sync_items', '42501', null, 'signed-out visitors have no access'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'toolboxes-sync'),
  0,
  'signed-out visitors see no bytes'
);

reset role;
select is(
  (select path from toolboxes.sync_items where user_id = '22222222-2222-2222-2222-222222222222'),
  'idb/wordcraft',
  'A''s update could not touch B''s item'
);

select * from finish();
rollback;
