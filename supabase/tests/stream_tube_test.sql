-- stream Tube phase 1: subscriptions, engagement + counters, comments, reports, skip segments, notes · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(54);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'a@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'b@test.local');
insert into cms.admins (user_id) values ('11111111-1111-1111-1111-111111111111');

select ok((select bool_and(relrowsecurity) from pg_class
  where oid in ('stream.subscriptions'::regclass, 'stream.video_stats'::regclass,
                'stream.video_engagement'::regclass, 'stream.comments'::regclass,
                'stream.comment_reports'::regclass, 'stream.video_segments'::regclass,
                'stream.segment_votes'::regclass, 'stream.timestamp_notes'::regclass)),
  'every Tube table has RLS');

-- ── A, signed in ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

-- subscriptions
select lives_ok($$insert into stream.subscriptions (channel_id, title) values ('UC_x5XG1OV2P6uZZ5FSM9Ttw', 'ช่อง')$$,
  'A follows a channel');
select throws_ok($$insert into stream.subscriptions (channel_id, title) values ('not-a-channel', 'x')$$,
  '23514', null, 'only real channel ids are followed');
select throws_ok($$insert into stream.subscriptions (user_id, channel_id, title) values ('33333333-3333-3333-3333-333333333333', 'UC_x5XG1OV2P6uZZ5FSM9Ttw', 'x')$$,
  '42501', null, 'A cannot follow for B');

-- likes and their counters
select lives_ok($$insert into stream.video_engagement (youtube_id, value) values ('M7lc1UVf-VE', 1)$$, 'A likes a video');
select is((select likes from stream.video_stats where youtube_id = 'M7lc1UVf-VE'), 1, 'the like is counted');
select lives_ok($$update stream.video_engagement set value = -1 where youtube_id = 'M7lc1UVf-VE'$$, 'A switches to dislike');
select results_eq($$select likes, dislikes from stream.video_stats where youtube_id = 'M7lc1UVf-VE'$$,
  $$values (0, 1)$$, 'switching moves the count');
select throws_ok($$insert into stream.video_engagement (youtube_id, value) values ('M7lc1UVf-VE', 5)$$,
  '23514', null, 'a rating is like or dislike only');
select throws_ok($$insert into stream.video_engagement (user_id, youtube_id, value) values ('33333333-3333-3333-3333-333333333333', 'dQw4w9WgXcQ', 1)$$,
  '42501', null, 'A cannot like for B');
select throws_ok($$update stream.video_stats set likes = 999$$, '42501', null, 'nobody writes counters by hand');

-- comments
select lives_ok($$insert into stream.comments (id, youtube_id, body) values ('aaaaaaaa-0000-0000-0000-000000000001', 'M7lc1UVf-VE', 'คลิปดีมาก')$$,
  'A comments');
select throws_ok($$insert into stream.comments (youtube_id, body, pinned) values ('M7lc1UVf-VE', 'pin me', true)$$,
  '42501', null, 'A cannot post a pinned comment');
select throws_ok($$insert into stream.comments (youtube_id, body) values ('M7lc1UVf-VE', '')$$,
  '23514', null, 'an empty comment is rejected');
select throws_ok($$insert into stream.comments (user_id, youtube_id, body) values ('33333333-3333-3333-3333-333333333333', 'M7lc1UVf-VE', 'x')$$,
  '42501', null, 'A cannot comment as B');
select lives_ok($$update stream.comments set body = 'คลิปดีมาก (แก้)' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'A edits their comment');
select isnt((select edited_at from stream.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001'), null,
  'an edit is marked');
select throws_ok($$update stream.comments set pinned = true where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501', null, 'A cannot pin their own comment');
select throws_ok($$update stream.comments set replies = 99$$, '42501', null, 'nobody sets the reply count');

-- notes
select lives_ok($$insert into stream.timestamp_notes (youtube_id, at_s, body) values ('M7lc1UVf-VE', 12, 'ส่วนตัว')$$,
  'A keeps a private note');
select lives_ok($$insert into stream.timestamp_notes (youtube_id, at_s, body, shared) values ('M7lc1UVf-VE', 90, 'useState hooks in **React**', true)$$,
  'A shares a note');
select throws_ok($$insert into stream.timestamp_notes (user_id, youtube_id, at_s, body) values ('33333333-3333-3333-3333-333333333333', 'M7lc1UVf-VE', 1, 'x')$$,
  '42501', null, 'A cannot write B''s notes');

-- skip segments
select lives_ok($$insert into stream.video_segments (id, youtube_id, category, start_s, end_s) values ('bbbbbbbb-0000-0000-0000-000000000001', 'M7lc1UVf-VE', 'sponsor', 30, 75)$$,
  'A marks a sponsor segment');
select throws_ok($$insert into stream.video_segments (youtube_id, category, start_s, end_s) values ('M7lc1UVf-VE', 'sponsor', 75, 30)$$,
  '23514', null, 'a segment ends after it starts');
select throws_ok($$insert into stream.video_segments (youtube_id, category, start_s, end_s) values ('M7lc1UVf-VE', 'ad', 1, 2)$$,
  '23514', null, 'a segment has a known category');
select throws_ok($$insert into stream.video_segments (youtube_id, category, start_s, end_s, score) values ('M7lc1UVf-VE', 'intro', 0, 5, 100)$$,
  '42501', null, 'nobody sets a score');
select lives_ok($$insert into stream.segment_votes (segment_id, value) values ('bbbbbbbb-0000-0000-0000-000000000001', -1)$$,
  'A votes on a segment');

-- ── B, signed in ──
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is((select count(*)::int from stream.subscriptions), 0, 'B does not see A''s subscriptions');
select is((select count(*)::int from stream.video_engagement), 0, 'B does not see A''s likes');
select is((select count(*)::int from stream.segment_votes), 0, 'B does not see A''s votes');
select is((select count(*)::int from stream.timestamp_notes), 1, 'B sees only A''s shared note');
select is((select count(*)::int from stream.timestamp_notes where search @@ to_tsquery('simple', 'react')), 1,
  'shared notes are searchable');
select lives_ok($$insert into stream.comments (id, youtube_id, parent_id, body) values ('aaaaaaaa-0000-0000-0000-000000000002', 'M7lc1UVf-VE', 'aaaaaaaa-0000-0000-0000-000000000001', 'เห็นด้วย')$$,
  'B replies');
select results_eq($$select replies, (select comments from stream.video_stats where youtube_id = 'M7lc1UVf-VE') from stream.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  $$values (1, 2)$$, 'the reply is counted on the comment and the video');
select throws_ok($$insert into stream.comments (youtube_id, parent_id, body) values ('M7lc1UVf-VE', 'aaaaaaaa-0000-0000-0000-000000000002', 'x')$$,
  '23514', null, 'replies go one level deep');
select throws_ok($$insert into stream.comments (youtube_id, parent_id, body) values ('dQw4w9WgXcQ', 'aaaaaaaa-0000-0000-0000-000000000001', 'x')$$,
  '23514', null, 'a reply stays on the same video');
select lives_ok($$update stream.comments set body = 'hacked' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'B''s edit of A''s comment runs but matches nothing');
select lives_ok($$delete from stream.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'B''s delete of A''s comment runs but matches nothing');
select lives_ok($$insert into stream.segment_votes (segment_id, value) values ('bbbbbbbb-0000-0000-0000-000000000001', 1)$$,
  'B votes up');
select lives_ok($$update stream.segment_votes set value = -1$$, 'B changes their vote');
select lives_ok($$delete from stream.video_segments$$, 'B''s delete of A''s segment runs but matches nothing');
select lives_ok($$insert into stream.comment_reports (comment_id, reason) values ('aaaaaaaa-0000-0000-0000-000000000001', 'spam')$$,
  'B reports A''s comment');
select is((select count(*)::int from stream.comment_reports), 0, 'B cannot read reports');
-- 9 more comments in a minute is fine, the 11th is not
select lives_ok($$insert into stream.comments (youtube_id, body) select 'dQw4w9WgXcQ', 'x' || g from generate_series(1, 9) g$$,
  'B comments 10 times in a minute');
select throws_ok($$insert into stream.comments (youtube_id, body) values ('dQw4w9WgXcQ', 'one more')$$,
  '54000', null, 'the 11th comment in a minute is refused');

-- ── the admin moderates ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$update stream.comments set pinned = true, hearted = true where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'an admin pins and hearts');
select throws_ok($$update stream.comments set body = 'x' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501', null, 'an admin cannot put words in A''s mouth');
select is((select count(*)::int from stream.comment_reports), 1, 'an admin reads reports');
select lives_ok($$delete from stream.comments where id = 'aaaaaaaa-0000-0000-0000-000000000002'$$, 'an admin removes a reply');
reset role;
select results_eq($$select replies, (select comments from stream.video_stats where youtube_id = 'M7lc1UVf-VE') from stream.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  $$values (0, 1)$$, 'removing a reply lowers both counts');
select is((select body from stream.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'คลิปดีมาก (แก้)',
  'A''s comment keeps A''s words');
select is((select score from stream.video_segments where id = 'bbbbbbbb-0000-0000-0000-000000000001'), -2,
  'a segment''s score is the sum of its votes');

-- ── a visitor who is not signed in ──
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq($$select (select count(*)::int from stream.comments where youtube_id = 'M7lc1UVf-VE'),
  (select count(*)::int from stream.video_segments), (select count(*)::int from stream.timestamp_notes)$$,
  $$values (1, 1, 1)$$, 'anyone reads comments, segments and shared notes');
select throws_ok($$insert into stream.comments (youtube_id, body) values ('M7lc1UVf-VE', 'x')$$,
  '42501', null, 'anon cannot comment');
reset role;

select * from finish();
rollback;
