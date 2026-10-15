-- Chat rules ported from csmju-nexus · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'dave@test.local');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

-- ── DMs ──
insert into ids values ('dm', community.open_direct(array['22222222-2222-2222-2222-222222222222'::uuid]));
select is(
  community.open_direct(array['22222222-2222-2222-2222-222222222222'::uuid]),
  (select id from ids where name = 'dm'),
  'opening the same DM twice returns the same room'
);
select throws_ok(
  $$select community.open_direct(array['11111111-1111-1111-1111-111111111111'::uuid])$$,
  'P0001', null, 'you cannot DM yourself'
);
select lives_ok(
  $$insert into ids values ('m1', community.send_message((select id from ids where name = 'dm'), 'สวัสดี', 'n1'))$$,
  'alice sends a DM'
);
select is(
  community.send_message((select id from ids where name = 'dm'), 'สวัสดี', 'n1'),
  (select id from ids where name = 'm1'),
  'a retried nonce returns the first copy instead of a duplicate'
);
select throws_ok(
  $$insert into community.messages (channel_id, author_id, content, client_nonce)
    values ((select id from ids where name = 'dm'), auth.uid(), 'raw', 'raw')$$,
  '42501', null, 'messages cannot be inserted directly, only through send_message'
);

-- ── a group alice moderates ──
insert into ids values ('grp', community.create_channel('GROUP', 'ทีมโปรเจกต์'));
select throws_ok(
  $$select community.create_channel('COURSE', 'วิชา 101')$$,
  '42501', null, 'only staff create course rooms'
);
select is(community.add_members((select id from ids where name = 'grp'),
  array['22222222-2222-2222-2222-222222222222'::uuid, '33333333-3333-3333-3333-333333333333'::uuid]), 2,
  'moderator adds two members');
insert into ids values ('g1', community.send_message((select id from ids where name = 'grp'), 'ประชุมพรุ่งนี้', 'g1'));

-- ── dave is an outsider ──
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select is((select count(*)::int from community.messages), 0, 'outsiders read no messages');
select is((select count(*)::int from community.channels), 0, 'outsiders see no channels');
select throws_ok(
  $$select community.send_message((select id from ids where name = 'grp'), 'แทรก', 'x')$$,
  'P0002', null, 'outsiders cannot post (and are told the room does not exist)'
);
select throws_ok(
  $$insert into community.reactions (target_kind, target_id, user_id, emoji)
    values ('MESSAGE', (select id from ids where name = 'g1'), auth.uid(), '👍')$$,
  '42501', null, 'outsiders cannot react to messages they cannot see'
);

-- ── bob, a plain member of the group ──
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$select community.edit_message((select id from ids where name = 'g1'), 'แก้ของคนอื่น')$$,
  '42501', null, 'members cannot edit someone else''s message'
);
select throws_ok(
  $$select community.delete_message((select id from ids where name = 'g1'))$$,
  '42501', null, 'members cannot delete someone else''s message'
);
select throws_ok(
  $$select community.set_pin((select id from ids where name = 'g1'), true)$$,
  '42501', null, 'only moderators pin in group rooms'
);
select lives_ok(
  $$select community.set_pin((select id from ids where name = 'm1'), true)$$,
  'either person pins in a DM'
);
select throws_ok(
  $$select community.remove_member((select id from ids where name = 'grp'), '33333333-3333-3333-3333-333333333333')$$,
  '42501', null, 'members cannot remove members'
);
select lives_ok(
  $$insert into community.reactions (target_kind, target_id, user_id, emoji)
    values ('MESSAGE', (select id from ids where name = 'g1'), auth.uid(), '🎉')$$,
  'members react to messages in their room'
);
select throws_ok(
  $$insert into community.reactions (target_kind, target_id, user_id, emoji)
    values ('MESSAGE', (select id from ids where name = 'g1'), auth.uid(), 'lol')$$,
  '23514', null, 'reactions must be emoji, not text'
);
select is(
  (select (row->>'inboxFolder') from community.channel_rows((select id from ids where name = 'dm')) row),
  'REQUEST',
  'a DM from someone bob does not follow lands in requests'
);
select is(
  (select (row->>'unreadCount')::int from community.channel_rows((select id from ids where name = 'dm')) row),
  1,
  'bob has one unread message'
);

-- blocking stops the DM
select community.block_user('11111111-1111-1111-1111-111111111111');
select throws_ok(
  $$select community.send_message((select id from ids where name = 'dm'), 'ตอบ', 'b1')$$,
  '42501', null, 'no messages across a block'
);

-- ── alice leaves her group: someone else becomes moderator ──
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$select community.leave_channel((select id from ids where name = 'grp'))$$, 'alice leaves');
reset role;
select is(
  (select count(*)::int from community.channel_members
   where channel_id = (select id from ids where name = 'grp') and role = 'MODERATOR'),
  1,
  'the room got a new moderator'
);
select is(
  (select reply_count from community.messages where id = (select id from ids where name = 'g1')),
  0,
  'sanity: no thread replies were created'
);

select * from finish();
rollback;
