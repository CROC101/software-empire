-- Meetings, voice rooms, calls and call cards (community round 6) · run: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'dave@test.local');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;
create function pg_temp.as_user(id text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', id, 'role', 'authenticated')::text, true);
$$;
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
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into ids values ('grp', community.create_channel('GROUP', 'ทีมโปรเจกต์'));
select community.add_members((select id from ids where name = 'grp'),
  array['22222222-2222-2222-2222-222222222222'::uuid, '33333333-3333-3333-3333-333333333333'::uuid]);

-- ── meetings ──
select throws_ok(
  $$select community.create_meeting((select id from ids where name = 'grp'), 'สั้นไป', now(), now() + interval '2 minutes')$$,
  'P0001', null, 'meetings last at least 5 minutes'
);
select throws_ok(
  $$select community.create_meeting((select id from ids where name = 'grp'), 'ยาวไป', now(), now() + interval '9 hours')$$,
  'P0001', null, 'and at most 8 hours'
);
insert into ids values ('mtg', community.create_meeting((select id from ids where name = 'grp'), 'สแตนด์อัป',
  now() + interval '5 minutes', now() + interval '35 minutes'));
select is(pg_temp.notes_of('22222222-2222-2222-2222-222222222222', 'MEETING_INVITE'), 1, 'members are invited');
select is(pg_temp.notes_of('11111111-1111-1111-1111-111111111111', 'MEETING_INVITE'), 0, 'the organiser is not');
select ok((select joinable_now from community.meeting_view where id = (select id from ids where name = 'mtg')),
  'a meeting opens 10 minutes early');

select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$select community.create_meeting((select id from ids where name = 'grp'), 'ของฉัน', now(), now() + interval '1 hour')$$,
  '42501', null, 'plain members cannot schedule'
);
select throws_ok(
  $$select community.cancel_meeting((select id from ids where name = 'mtg'))$$,
  '42501', null, 'or cancel someone else''s meeting'
);
select pg_temp.as_user('44444444-4444-4444-4444-444444444444');
select is((select count(*)::int from community.meeting_view), 0, 'outsiders see no meetings');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select community.cancel_meeting((select id from ids where name = 'mtg'));
select lives_ok($$select community.cancel_meeting((select id from ids where name = 'mtg'))$$, 'cancelling twice is fine');
select is(pg_temp.notes_of('22222222-2222-2222-2222-222222222222', 'MEETING_INVITE'), 2, 'members hear about the cancellation once');

-- ── voice rooms ──
insert into ids values ('vs', (community.join_voice((select id from ids where name = 'grp')) ->> 'id')::uuid);
select pg_temp.as_user('44444444-4444-4444-4444-444444444444');
select throws_ok(
  $$select community.join_voice((select id from ids where name = 'grp'))$$,
  'P0002', null, 'outsiders cannot join'
);
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is((community.join_voice((select id from ids where name = 'grp')) ->> 'id')::uuid,
  (select id from ids where name = 'vs'), 'the second person joins the same session');
select is((community.voice_occupants((select id from ids where name = 'grp')) -> 'occupants') ->> 1 is not null, true,
  'two occupants');
reset role;
update community.channels set max_seats = 2 where id = (select id from ids where name = 'grp');
set local role authenticated;
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select throws_ok(
  $$select community.join_voice((select id from ids where name = 'grp'))$$,
  'P0001', null, 'a full room turns people away'
);

-- screen share: one presenter at a time
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select is(community.claim_screen((select id from ids where name = 'vs')) ->> 'ok', 'true', 'alice shares her screen');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select is(community.claim_screen((select id from ids where name = 'vs')) ->> 'ok', 'false', 'bob has to wait');

-- a silent tab is swept out: carol can now take the seat bob held
reset role;
update community.voice_participants set last_seen_at = now() - interval '5 minutes'
where user_id = '22222222-2222-2222-2222-222222222222';
set local role authenticated;
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select lives_ok($$select community.join_voice((select id from ids where name = 'grp'))$$,
  'someone who stopped heartbeating loses their seat');
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select community.leave_voice((select id from ids where name = 'vs'));
select pg_temp.as_user('33333333-3333-3333-3333-333333333333');
select community.leave_voice((select id from ids where name = 'vs'));
select ok((select ended_at is not null from community.voice_sessions where id = (select id from ids where name = 'vs')),
  'the last one out closes the session');

-- ── a 1:1 call ──
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
insert into ids values ('dm', community.open_direct(array['22222222-2222-2222-2222-222222222222'::uuid]));
insert into ids values ('call', (community.join_voice((select id from ids where name = 'dm')) ->> 'id')::uuid);
select throws_ok(
  $$select community.call_ring((select id from ids where name = 'call'), '11111111-1111-1111-1111-111111111111')$$,
  'P0001', null, 'nobody calls themselves'
);
select throws_ok(
  $$select community.call_ring((select id from ids where name = 'call'), '44444444-4444-4444-4444-444444444444')$$,
  'P0001', null, 'only people in the chat can be rung'
);
select community.call_ring((select id from ids where name = 'call'), '22222222-2222-2222-2222-222222222222', 'VIDEO');
select is((select call_log ->> 'status' from community.message_view where channel_id = (select id from ids where name = 'dm')),
  'MISSED', 'a ringing call shows as a card with no end yet');
select is(pg_temp.notes_of('22222222-2222-2222-2222-222222222222', 'VOICE_INVITE'), 1, 'bob is told he is being called');
select throws_ok(
  $$select community.edit_message((select id from community.messages where client_nonce like 'call-%'), 'แก้')$$,
  'P0001', null, 'a call card cannot be edited'
);

select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select community.join_voice((select id from ids where name = 'dm'));
select community.call_answer((select id from ids where name = 'call'), '11111111-1111-1111-1111-111111111111', true);
select is((select status from community.call_logs), 'ONGOING', 'answering starts the call');
select community.call_end((select id from ids where name = 'call'), '11111111-1111-1111-1111-111111111111');
select is((select status || ':' || (duration_sec is not null)::text from community.call_logs), 'ANSWERED:true',
  'hanging up records an answered call with its length');

-- ── a missed call ──
select community.leave_voice((select id from ids where name = 'call'));
select pg_temp.as_user('11111111-1111-1111-1111-111111111111');
select community.leave_voice((select id from ids where name = 'call'));
insert into ids values ('call2', (community.join_voice((select id from ids where name = 'dm')) ->> 'id')::uuid);
select community.call_ring((select id from ids where name = 'call2'), '22222222-2222-2222-2222-222222222222');
select community.call_cancel((select id from ids where name = 'call2'), '22222222-2222-2222-2222-222222222222', true);
select is((select status from community.call_logs where session_id = (select id from ids where name = 'call2')),
  'MISSED', 'nobody picked up');
select is(pg_temp.notes_of('22222222-2222-2222-2222-222222222222', 'MISSED_CALL'), 1, 'bob gets a missed-call notice');

-- ── a declined call ──
select community.leave_voice((select id from ids where name = 'call2'));
insert into ids values ('call3', (community.join_voice((select id from ids where name = 'dm')) ->> 'id')::uuid);
select community.call_ring((select id from ids where name = 'call3'), '22222222-2222-2222-2222-222222222222');
select pg_temp.as_user('22222222-2222-2222-2222-222222222222');
select community.call_answer((select id from ids where name = 'call3'), '11111111-1111-1111-1111-111111111111', false);
select is((select status from community.call_logs where session_id = (select id from ids where name = 'call3')),
  'DECLINED', 'every invitee declined');
select is((select count(*)::int from community.message_view where call_log is not null), 3,
  'each call left one card in the chat');

select * from finish();
rollback;
