-- Notifications, preferences, audit log, search, activity (community round 5) · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local');
update community.profiles set display_name = 'Alice Wonder' where user_id = '11111111-1111-1111-1111-111111111111';

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
$$;
-- counts as the recipient (through RLS), then puts the caller back
create function pg_temp.notes_of(id uuid, k text) returns int language plpgsql as $$
declare
  prev text := current_setting('request.jwt.claims', true);
  n int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
  select count(*) into n from community.notifications where kind = k;
  perform set_config('request.jwt.claims', prev, true);
  return n;
end;
$$;

set local role authenticated;

-- ── triggers create notifications ──
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
insert into community.follows (follower_id, followee_id) values (auth.uid(), '11111111-1111-1111-1111-111111111111');
select is(pg_temp.notes_of('11111111-1111-1111-1111-111111111111', 'FOLLOW'), 1, 'a new follower is announced');

select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into ids values ('post', community.create_post('hello world', 'สวัสดีชาวโลก'));
select community.add_comment((select id from ids where name = 'post'), 'ตอบตัวเอง');
select is(pg_temp.notes_of('11111111-1111-1111-1111-111111111111', 'POST_COMMENT'), 0, 'nobody is notified about themselves');

select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select community.add_comment((select id from ids where name = 'post'), 'เยี่ยม');
select is(pg_temp.notes_of('11111111-1111-1111-1111-111111111111', 'POST_COMMENT'), 1, 'a comment on your post is announced');
insert into community.reactions (target_kind, target_id, user_id, emoji)
values ('POST', (select id from ids where name = 'post'), auth.uid(), '🔥');
select is(pg_temp.notes_of('11111111-1111-1111-1111-111111111111', 'REACTION'), 1, 'so is a reaction');

-- ── preferences ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into community.notification_preferences (likes, paused_until) values ('OFF', now() + interval '1 hour');
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
insert into community.reactions (target_kind, target_id, user_id, emoji)
values ('POST', (select id from ids where name = 'post'), auth.uid(), '👍');
select is(pg_temp.notes_of('11111111-1111-1111-1111-111111111111', 'REACTION'), 1, 'likes=OFF writes nothing');
select community.add_comment((select id from ids where name = 'post'), 'ด้วยคน');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from community.notifications where kind = 'POST_COMMENT' and silent), 1,
  'while paused, notifications are kept but silent'
);
select is((select count(*)::int from community.notifications), 4, 'alice reads her own notifications');
select throws_ok(
  $$select community.mark_notification_read(gen_random_uuid())$$,
  'P0002', null, 'an unknown notification is not found'
);
select is(community.mark_notification_read((select id from community.notifications where kind = 'FOLLOW')), 3,
  'marking one read returns the unread count');
select is(community.mark_all_notifications_read(), 3, 'mark all read returns how many it marked');

select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from community.notifications where user_id <> auth.uid()), 0,
  'nobody reads someone else''s notifications');

-- ── chat: invites, mentions, thread replies ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into ids values ('dm', community.open_direct(array['22222222-2222-2222-2222-222222222222'::uuid]));
select is(pg_temp.notes_of('22222222-2222-2222-2222-222222222222', 'CHANNEL_INVITE'), 0, 'a 1:1 DM is not an invitation');
insert into ids values ('grp', community.create_channel('GROUP', 'ทีม'));
select community.add_members((select id from ids where name = 'grp'),
  array['22222222-2222-2222-2222-222222222222'::uuid, '33333333-3333-3333-3333-333333333333'::uuid]);
select is(pg_temp.notes_of('22222222-2222-2222-2222-222222222222', 'CHANNEL_INVITE'), 1, 'being added to a group is');
insert into ids values ('root', community.send_message((select id from ids where name = 'grp'),
  'ประชุม @22222222-2222-2222-2222-222222222222 ด้วยนะ', 'm1'));
select is(pg_temp.notes_of('22222222-2222-2222-2222-222222222222', 'MENTION'), 1, 'an @mention reaches the member');
select is(pg_temp.notes_of('33333333-3333-3333-3333-333333333333', 'MENTION'), 0, 'and only them');
select community.send_message((select id from ids where name = 'grp'), '@everyone เริ่มแล้ว', 'm2');
select is(pg_temp.notes_of('33333333-3333-3333-3333-333333333333', 'MENTION'), 1, '@everyone from a moderator reaches all');

select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select community.update_inbox((select id from ids where name = 'grp'), null, null, true);
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select community.send_message((select id from ids where name = 'grp'), '@everyone ลองบ้าง', 'm3');
select is(pg_temp.notes_of('33333333-3333-3333-3333-333333333333', 'MENTION'), 1,
  '@everyone from a plain member does nothing (and carol muted the room anyway)');
select community.send_message((select id from ids where name = 'grp'), 'รับทราบ', 'm4',
  parent => (select id from ids where name = 'root'));
select is(pg_temp.notes_of('11111111-1111-1111-1111-111111111111', 'THREAD_REPLY'), 1, 'a thread reply reaches its starter');

-- ── audit log ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
update community.profiles set bio = 'นักพัฒนา' where user_id = auth.uid();
select is((select action from community.audit_logs where action like 'profile.%'), 'profile.bio_change',
  'profile edits land in the audit log');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from community.audit_logs where action like 'profile.%'), 0,
  'other people''s history is private');

-- ── search ──
select is((select count(*)::int from community.search('hello', 'posts')), 1, 'bob finds the post by title');
select is((select hit_kind from community.search('wonder', 'people')), 'PERSON', 'and alice by display name');
select is((select count(*)::int from community.search('ประชุม', 'messages')), 1, 'messages in his rooms are searchable');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select community.block_user('33333333-3333-3333-3333-333333333333');
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select is((select count(*)::int from community.search('hello', 'all') where hit_kind = 'POST'), 0,
  'a blocked person finds none of alice''s posts');

-- ── activity ──
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((select target_kind || ':' || content from community.my_comments), 'POST:เยี่ยม', 'bob sees his own comments');

select * from finish();
rollback;
