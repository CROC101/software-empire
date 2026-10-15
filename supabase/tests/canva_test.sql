-- RLS, constraints and quota for the canva schema · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local');

-- B's data, created as postgres (bypasses RLS)
insert into canva.folders (id, user_id, name) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'B folder');
insert into canva.designs (id, user_id, title, design_type, width, height, document) values
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'B design', 'poster', 800, 600, '{"pages":[{"elements":[]}]}');
insert into canva.assets (id, user_id, file_name, mime_type, size_bytes) values
  ('bbbbbbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'b.png', 'image/png', 100);

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('canva.folders'::regclass, 'canva.designs'::regclass, 'canva.assets'::regclass)),
  'row level security is enabled on every canva table'
);

-- act as user A
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::int from canva.designs), 0, 'A cannot see B''s designs');
select is((select count(*)::int from canva.assets), 0, 'A cannot see B''s assets');

select lives_ok(
  $$insert into canva.designs (title, design_type, width, height, document)
    values ('A design', 'poster', 800, 600, '{"pages":[{"elements":[]}]}')$$,
  'A creates a design; user_id defaults to auth.uid()'
);
select throws_ok(
  $$insert into canva.designs (title, design_type, width, height, document, folder_id)
    values ('sneaky', 'poster', 800, 600, '{"pages":[{"elements":[]}]}',
            'bbbbbbbb-0000-0000-0000-000000000001')$$,
  '42501', null,
  'A cannot file a design into B''s folder'
);
select throws_ok(
  $$insert into canva.designs (user_id, title, design_type, width, height, document)
    values ('22222222-2222-2222-2222-222222222222', 'planted', 'poster', 800, 600,
            '{"pages":[{"elements":[]}]}')$$,
  '42501', null,
  'A cannot create a design owned by B'
);
select throws_ok(
  $$insert into canva.designs (title, design_type, width, height, document)
    values ('no pages', 'poster', 800, 600, '{"pages":[]}')$$,
  '23514', null,
  'a design needs 1–100 pages'
);
select throws_ok(
  $$insert into canva.designs (title, design_type, width, height, document, thumbnail)
    values ('bad thumb', 'poster', 800, 600, '{"pages":[{"elements":[]}]}',
            'javascript:alert(1)')$$,
  '23514', null,
  'thumbnail must be an image data URL'
);

update canva.designs set title = 'hijacked' where id = 'bbbbbbbb-0000-0000-0000-000000000002';

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('canva-assets', 'bbbbbbbb-0000-0000-0000-000000000003')$$,
  '42501', null,
  'A cannot upload bytes for B''s asset'
);
select lives_ok(
  $$insert into canva.assets (file_name, mime_type, size_bytes)
    select 'a' || n || '.png', 'image/png', 10485760 from generate_series(1, 5) n$$,
  'A fills the 50 MB quota with five 10 MB files'
);
select throws_ok(
  $$insert into canva.assets (file_name, mime_type, size_bytes)
    values ('one-more.png', 'image/png', 1)$$,
  'P0001', null,
  'quota is enforced'
);

reset role;
set local role anon;
select throws_ok('select * from canva.designs', '42501', null, 'signed-out visitors have no access');

reset role;
select is(
  (select title from canva.designs where id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  'B design',
  'A''s update could not touch B''s design'
);

select * from finish();
rollback;
