-- Reels, stories, highlights, notes and shared cards (community round 4) · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'dave@test.local');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;

-- intent → bytes land → commit, as the signed-in user (security definer so it can write storage)
create function pg_temp.upload(asset_name text, file text, mime text, bucket text default 'attachments') returns void
language plpgsql security definer as $$
begin
  insert into ids select asset_name, i.id from community.create_upload_intent(file, 100, bucket) i;
  insert into storage.objects (bucket_id, name, metadata)
  select 'community-' || a.bucket, a.object_path, jsonb_build_object('size', 100, 'mimetype', mime)
  from community.assets a where a.id = (select id from ids where name = asset_name);
  perform community.commit_asset((select id from ids where name = asset_name));
end;
$$;
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;
-- bob follows alice; alice blocks dave
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
insert into community.follows (follower_id, followee_id)
values (auth.uid(), '11111111-1111-1111-1111-111111111111');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select community.block_user('44444444-4444-4444-4444-444444444444');

-- ── reels ──
select pg_temp.upload('clip', 'clip.mp4', 'video/mp4', 'reels');
select pg_temp.upload('pic', 'pic.png', 'image/png');
select throws_ok(
  $$select community.create_reel('รูป', (select id from ids where name = 'pic'), 5000)$$,
  'P0001', null, 'a reel must be a video'
);
select throws_ok(
  $$select community.create_reel('ยาว', (select id from ids where name = 'clip'), 70000)$$,
  'P0001', null, 'reels stop at 60 seconds'
);
insert into ids values ('reel', community.create_reel('ทริคพอยน์เตอร์', (select id from ids where name = 'clip'), 15000));
select throws_ok(
  $$select community.repost_reel((select id from ids where name = 'reel'), true)$$,
  'P0001', null, 'nobody reposts their own reel'
);

select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select community.like_reel((select id from ids where name = 'reel'), true);
select is(community.like_reel((select id from ids where name = 'reel'), true), 1, 'liking twice counts once');
select is(community.like_reel((select id from ids where name = 'reel'), false), 0, 'unliking gives it back');
select is(community.repost_reel((select id from ids where name = 'reel'), true), 1, 'bob reposts');
select community.view_reel((select id from ids where name = 'reel'));
select is(community.view_reel((select id from ids where name = 'reel')), 1, 'views count people, not plays');
select ok(
  (select reposted_by_me and not liked_by_me from community.reel_view where id = (select id from ids where name = 'reel')),
  'reel_view knows what bob did'
);
insert into ids values ('c1', community.add_reel_comment((select id from ids where name = 'reel'), 'เจ๋ง'));
insert into ids values ('r1', community.add_reel_comment((select id from ids where name = 'reel'), 'จริง',
  (select id from ids where name = 'c1')));
select throws_ok(
  $$select community.add_reel_comment((select id from ids where name = 'reel'), 'ซ้อน', (select id from ids where name = 'r1'))$$,
  'P0001', null, 'replies go one level deep'
);
select is((select reply_count from community.reel_comments where id = (select id from ids where name = 'c1')), 1,
  'the parent counts its reply');
select is(community.like_reel_comment((select id from ids where name = 'c1'), true), 1, 'comments take likes');
select lives_ok($$select community.delete_reel_comment((select id from ids where name = 'c1'))$$, 'bob deletes his thread');
select is((select comment_count from community.reel_view where id = (select id from ids where name = 'reel')), 0,
  'a deleted top-level comment takes its replies with it');
select lives_ok(
  $$insert into community.bookmarks (target_kind, target_id) values ('REEL', (select id from ids where name = 'reel'))$$,
  'reels can be saved now'
);
select is((select title from community.bookmark_view where target_kind = 'REEL'), 'ทริคพอยน์เตอร์',
  'a saved reel is titled by the reel');

select pg_temp.as_user('44444444-4444-4444-4444-444444444444');
select is((select count(*)::int from community.reel_view), 0, 'blocked people see no reels');
select throws_ok(
  $$select community.like_reel((select id from ids where name = 'reel'), true)$$,
  'P0002', null, 'and cannot like them'
);
select throws_ok(
  $$select community.send_message(community.open_direct(array['33333333-3333-3333-3333-333333333333'::uuid]),
    'ดูนี่', 'x1', embed_kind => 'REEL', embed_ref => (select id from ids where name = 'reel'))$$,
  'P0002', null, 'or share them'
);

-- bob shares the reel to carol: the card travels with the message
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
insert into ids values ('bc', community.open_direct(array['33333333-3333-3333-3333-333333333333'::uuid]));
insert into ids values ('share', community.send_message((select id from ids where name = 'bc'), '', 's1',
  embed_kind => 'REEL', embed_ref => (select id from ids where name = 'reel')));
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is(
  (select embed_kind || ':' || (embed_ref = (select id from ids where name = 'reel'))::text
   from community.message_view where id = (select id from ids where name = 'share')),
  'REEL:true', 'carol receives the reel card'
);

-- ── stories ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select pg_temp.upload('s1pic', 'story.jpg', 'image/jpeg');
insert into ids values ('story', community.create_story((select id from ids where name = 's1pic'), 'ติวคืนนี้'));

select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is((select count(*)::int from community.story_feed), 0, 'live stories are for followers only');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is(community.view_story((select id from ids where name = 'story')), 0, 'viewers never learn the view count');
select throws_ok(
  $$select community.reply_story((select id from ids where name = 'story'), 'สวย', '🔥')$$,
  'P0001', null, 'a reply is text or an emoji, not both'
);
select lives_ok($$select community.reply_story((select id from ids where name = 'story'), emoji => '🔥')$$,
  'bob reacts to the story');
select is(
  (select count(*)::int from community.messages where embed_kind = 'STORY' and story_reply_kind = 'REACTION'),
  1, 'the reaction lands in the DM with the story card'
);
select throws_ok(
  $$select community.story_insights((select id from ids where name = 'story'))$$,
  '42501', null, 'insights are the owner''s'
);

select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select is((select view_count from community.story_feed where id = (select id from ids where name = 'story')), 1,
  'alice sees one viewer');
select is(
  (community.story_insights((select id from ids where name = 'story')) -> 'reactionCounts' ->> '🔥')::int, 1,
  'insights count the emoji'
);

-- expired, then kept on a highlight
reset role;
update community.stories set expires_at = now() - interval '1 minute';
set local role authenticated;
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from community.story_feed), 0, 'an expired story disappears');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select throws_ok(
  $$select community.create_highlight('ทริป', array[gen_random_uuid()])$$,
  'P0002', null, 'highlights take existing stories only'
);
insert into ids values ('hl', community.create_highlight('ติว', array[(select id from ids where name = 'story')]));
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is((select count(*)::int from community.story_feed), 1, 'a highlighted story is visible to anyone');
select pg_temp.as_user('44444444-4444-4444-4444-444444444444');
select is((select count(*)::int from community.highlight_view), 0, 'except people on the other side of a block');

select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select lives_ok($$select community.delete_story((select id from ids where name = 'story'))$$, 'alice deletes the story');
select is((select count(*)::int from community.highlights), 0, 'its now-empty highlight goes too');

-- ── notes ──
select community.put_note('สอบเสร็จแล้ว!');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from community.notes where user_id <> auth.uid()), 0,
  'following one way is not enough for a mutuals note');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into community.follows (follower_id, followee_id) values (auth.uid(), '22222222-2222-2222-2222-222222222222');
select community.put_note('เฉพาะเพื่อนสนิท', 'CLOSE_FRIENDS');
insert into community.close_friends (owner_id, friend_id) values (auth.uid(), '33333333-3333-3333-3333-333333333333');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from community.notes where user_id <> auth.uid()), 0,
  'a close-friends note skips mutuals who aren''t close friends');
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is((select text from community.notes), 'เฉพาะเพื่อนสนิท', 'close friends see it');

select * from finish();
rollback;
