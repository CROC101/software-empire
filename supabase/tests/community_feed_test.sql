-- Feed, uploads, bookmarks and attachments (community round 3) · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;
-- object paths, recorded as files land, so checks never read through RLS
create temp table paths (name text primary key, path text);
grant all on paths to authenticated;

-- stands in for the browser's PUT to the signed upload URL: storage records size + content type
create function pg_temp.put(asset_name text, mime text, bytes bigint) returns void
language sql security definer as $$
  insert into storage.objects (bucket_id, name, metadata)
  select 'community-' || a.bucket, a.object_path, jsonb_build_object('size', bytes, 'mimetype', mime)
  from community.assets a where a.id = (select id from ids where name = asset_name);
  insert into paths select asset_name, a.object_path
  from community.assets a where a.id = (select id from ids where name = asset_name);
$$;
create function pg_temp.upload(asset_name text, file text, mime text, bytes bigint) returns void
language plpgsql security definer as $$
begin
  insert into ids select asset_name, i.id from community.create_upload_intent(file, bytes, 'attachments') i;
  perform pg_temp.put(asset_name, mime, bytes);
  perform community.commit_asset((select id from ids where name = asset_name));
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

-- ── upload pipeline ──
select throws_ok(
  $$select community.create_upload_intent('page.html', 10, 'attachments')$$,
  'P0001', null, 'files a browser would render as a page are refused at intent'
);
select throws_ok(
  $$select community.create_upload_intent('big.png', 10485761, 'attachments')$$,
  'P0001', null, 'files over 10 MB are refused at intent'
);
select throws_ok(
  $$select community.create_upload_intent('photo.png', 10, 'reels')$$,
  'P0001', null, 'the reels bucket takes video only'
);
insert into ids select 'p1', id from community.create_upload_intent('photo.png', 2000, 'attachments');
select ok(
  (select object_path like '11111111-1111-1111-1111-111111111111/%.png' from community.assets
   where id = (select id from ids where name = 'p1')),
  'object paths start with the owner''s id'
);
select throws_ok(
  $$select community.commit_asset((select id from ids where name = 'p1'))$$,
  'P0001', null, 'commit before the bytes arrive fails'
);
select pg_temp.put('p1', 'image/png', 2400);
select is(
  (select status || ':' || size_bytes from community.commit_asset((select id from ids where name = 'p1'))),
  'READY:2400', 'commit marks the file READY at its real size, not the declared one'
);

insert into ids select 'fake', id from community.create_upload_intent('fake.png', 100, 'attachments');
select pg_temp.put('fake', 'text/html', 100);
select is(
  (select status from community.commit_asset((select id from ids where name = 'fake'))),
  'BLOCKED', 'bytes stored under another content type are blocked'
);

-- ── posts ──
select throws_ok(
  $$select community.create_post(asset_ids => array[(select id from ids where name = 'fake')])$$,
  'P0001', null, 'a blocked file cannot be posted'
);
select throws_ok(
  $$select community.create_post('  ', '')$$,
  'P0001', null, 'an empty post is refused'
);
select throws_ok(
  $$select community.create_post('x', course_tag => 'cs-201')$$,
  'P0001', null, 'course tags look like CS201'
);
insert into ids values ('post', community.create_post('', 'ดูรูปนี้', 'CS201', array[(select id from ids where name = 'p1')]));
select is(
  (select jsonb_array_length(media) from community.post_view where id = (select id from ids where name = 'post')),
  1, 'the post carries its photo'
);
select throws_ok(
  $$select community.create_post('again', asset_ids => array[(select id from ids where name = 'p1')])$$,
  'P0001', null, 'a file backs only one post'
);
select pg_temp.upload('p2', 'second.jpg', 'image/jpeg', 500);
select pg_temp.upload('clip', 'clip.mp4', 'video/mp4', 900);
select pg_temp.upload('dmfile', 'notes.pdf', 'application/pdf', 300);

-- ── bob, a stranger ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$select community.create_post('mine now', asset_ids => array[(select id from ids where name = 'p2')])$$,
  '42501', null, 'nobody posts someone else''s file'
);
select is((select count(*)::int from community.post_view where author_id = '11111111-1111-1111-1111-111111111111'), 1, 'bob sees alice''s post');
select ok(
  community.storage_can_read('community-attachments',
    (select media -> 0 ->> 'path' from community.post_view where id = (select id from ids where name = 'post'))),
  'bob may read the photo of a post he can see'
);
select ok(
  not community.storage_can_read('community-attachments',
    (select path from paths where name = 'p2')),
  'bob may not read alice''s unused upload'
);
select is((select count(*)::int from community.assets where id = (select id from ids where name = 'p2')), 0,
  'unused uploads are invisible to others');
select lives_ok(
  $$select community.add_comment((select id from ids where name = 'post'), 'สวยมาก')$$,
  'bob comments'
);
select is((select comment_count from community.posts where id = (select id from ids where name = 'post')), 1,
  'the comment counter follows');
select throws_ok(
  $$select community.delete_post((select id from ids where name = 'post'))$$,
  '42501', null, 'bob cannot delete alice''s post'
);
select lives_ok(
  $$insert into community.reactions (target_kind, target_id, user_id, emoji)
    values ('POST', (select id from ids where name = 'post'), auth.uid(), '🔥')$$,
  'bob reacts to the post'
);

-- bookmarks
select lives_ok(
  $$insert into community.bookmarks (target_kind, target_id) values ('POST', (select id from ids where name = 'post'))$$,
  'bob saves the post'
);
select is((select title from community.bookmark_view), 'ดูรูปนี้', 'a saved photo post is titled by its text');
with c as (insert into community.bookmark_collections (name) values ('ไอเดีย') returning id)
insert into ids select 'coll', id from c;
insert into community.bookmark_collection_items (collection_id, target_kind, target_id)
values ((select id from ids where name = 'coll'), 'POST', (select id from ids where name = 'post'));
select throws_ok(
  $$insert into community.bookmark_collection_items (collection_id, target_kind, target_id)
    values ((select id from ids where name = 'coll'), 'POST', gen_random_uuid())$$,
  '23503', null, 'only saved things go into a collection'
);
delete from community.bookmarks;
select is((select item_count from community.bookmark_collection_view), 0, 'unsaving empties it from collections');
select throws_ok(
  $$insert into community.bookmarks (target_kind, target_id) values ('REEL', gen_random_uuid())$$,
  '42501', null, 'nothing unseen can be saved'
);

-- ── alice turns comments off, blocks carol, sends bob a file ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
update community.profiles set comments_from = 'OFF' where user_id = auth.uid();
select community.block_user('33333333-3333-3333-3333-333333333333');
insert into ids values ('dm', community.open_direct(array['22222222-2222-2222-2222-222222222222'::uuid]));
insert into ids values ('msg', community.send_message((select id from ids where name = 'dm'), '', 'n1',
  attachments => array[(select id from ids where name = 'dmfile')]));
select throws_ok(
  $$select community.set_cover((select id from ids where name = 'clip'))$$,
  'P0001', null, 'a cover must be an image'
);
select lives_ok($$select community.set_cover((select id from ids where name = 'p2'))$$, 'alice sets a cover');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$select community.add_comment((select id from ids where name = 'post'), 'อีกเม้น')$$,
  '42501', null, 'comments off means off'
);
select is(
  (select attachments -> 0 ->> 'fileName' from community.message_view where id = (select id from ids where name = 'msg')),
  'notes.pdf', 'bob sees the attachment in the DM'
);

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is((select count(*)::int from community.post_view where author_id = '11111111-1111-1111-1111-111111111111'), 0, 'a blocked person sees none of alice''s posts');
select ok(
  not community.storage_can_read('community-attachments',
    (select path from paths where name = 'p2')),
  'or her cover photo'
);

-- ── alice deletes: files are freed for removal ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is(
  cardinality(community.delete_post((select id from ids where name = 'post'))), 1,
  'deleting a post hands back its photo for removal'
);
reset role;
select is(
  (select count(*)::int from community.reactions where target_kind = 'POST' and target_id = (select id from ids where name = 'post')), 0,
  'the post''s reactions go with it'
);
select ok(
  community.used_bytes('11111111-1111-1111-1111-111111111111') >= 500 + 900 + 300,
  'quota counts every byte still stored'
);

select * from finish();
rollback;
