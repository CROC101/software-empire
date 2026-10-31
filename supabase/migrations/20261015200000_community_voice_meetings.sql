-- Community round 6 (ported from csmju-nexus): meetings, voice rooms, 1:1 and group calls over
-- peer-to-peer WebRTC, screen sharing, call logs in chat, and call feedback.
--
-- No signalling server: the database decides who may do what, and pushes person-to-person events
-- (ring, answer, hang-up, room occupants) with realtime.send() on private topics:
--   user:<id>      — only that person receives (incoming calls, answers, occupants of their rooms)
--   voice:<id>     — the people in that voice session (WebRTC offers/answers/ICE, screen share)
-- Nobody can tell the database "I left" when a tab is killed, so participants heartbeat and anyone
-- silent for 90 s is swept out the next time someone joins, reads or shares in that room.

-- ── meetings ─────────────────────────────────────────────────────────────
create table community.meetings (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references community.channels (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  agenda text check (char_length(agenda) between 1 and 4000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- only SCHEDULED and CANCELLED are ever written; "live" is joinable_now
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on community.meetings (channel_id, starts_at);
create index on community.meetings (status, starts_at);

create view community.meeting_view with (security_invoker = true) as
select m.*,
  m.status <> 'CANCELLED' and now() >= m.starts_at - interval '10 minutes' and now() <= m.ends_at as joinable_now
from community.meetings m;

create function community.create_meeting(
  channel uuid, title text, starts_at timestamptz, ends_at timestamptz, agenda text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  t text := btrim(coalesce(title, ''));
  a text := nullif(btrim(coalesce(agenda, '')), '');
  span interval := ends_at - starts_at;
  new_id uuid;
  member uuid;
begin
  if community.require_member(channel) <> 'MODERATOR' and not community.is_staff() then
    raise exception 'เฉพาะผู้ดูแลห้องหรืออาจารย์เท่านั้นที่นัดประชุมได้' using errcode = '42501';
  end if;
  if char_length(t) not between 1 and 200 then raise exception 'หัวข้อต้องยาว 1-200 ตัวอักษร' using errcode = 'P0001'; end if;
  if char_length(a) > 4000 then raise exception 'วาระยาวได้ไม่เกิน 4000 ตัวอักษร' using errcode = 'P0001'; end if;
  if starts_at is null or ends_at is null or span <= interval '0' then
    raise exception 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม' using errcode = 'P0001';
  end if;
  if span < interval '5 minutes' then raise exception 'นัดประชุมสั้นสุด 5 นาที' using errcode = 'P0001'; end if;
  if span > interval '8 hours' then
    raise exception 'นัดประชุมยาวสุด 8 ชั่วโมง — ถ้าใส่วันที่ผิดให้ตรวจปีอีกครั้ง' using errcode = 'P0001';
  end if;
  insert into community.meetings (channel_id, title, agenda, starts_at, ends_at, created_by)
  values (channel, t, a, create_meeting.starts_at, create_meeting.ends_at, me) returning id into new_id;
  for member in select user_id from community.channel_members where channel_id = channel loop
    perform community.notify(member, 'MEETING_INVITE', new_id::text,
      jsonb_build_object('channelId', channel, 'title', t, 'startsAt', create_meeting.starts_at));
  end loop;
  return new_id;
end;
$$;

create function community.cancel_meeting(meeting uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m community.meetings;
  member uuid;
begin
  select * into m from community.meetings where id = meeting;
  if m.id is null or not community.is_member(m.channel_id) then
    raise exception 'ไม่พบนัดประชุมนี้' using errcode = 'P0002';
  end if;
  if m.created_by is distinct from auth.uid() and community.my_role(m.channel_id) <> 'MODERATOR'
     and not community.is_staff() then
    raise exception 'ยกเลิกได้เฉพาะนัดที่ตัวเองสร้าง' using errcode = '42501';
  end if;
  if m.status = 'CANCELLED' then return; end if;
  update community.meetings set status = 'CANCELLED' where id = meeting;
  for member in select user_id from community.channel_members where channel_id = m.channel_id loop
    perform community.notify(member, 'MEETING_INVITE', meeting::text,
      jsonb_build_object('channelId', m.channel_id, 'title', m.title, 'cancelled', true));
  end loop;
end;
$$;

-- ── voice rooms ──────────────────────────────────────────────────────────
create table community.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references community.channels (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  presenter_id uuid references auth.users (id) on delete set null
);
-- one open session per room
create unique index on community.voice_sessions (channel_id) where ended_at is null;
create index on community.voice_sessions (channel_id, started_at desc);

create table community.voice_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references community.voice_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_seen_at timestamptz not null default now(),
  muted boolean not null default false,
  deafened boolean not null default false,
  video boolean not null default false,
  sharing boolean not null default false
);
-- one active room per person: joining another leaves the first
create unique index on community.voice_participants (user_id) where left_at is null;
create index on community.voice_participants (session_id) where left_at is null;

create function community.in_voice(session uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from community.voice_participants
                 where session_id = session and user_id = auth.uid() and left_at is null);
$$;

create function community.send_to(person uuid, event text, payload jsonb) returns void
language sql security definer set search_path = ''
as $$ select realtime.send(payload, event, 'user:' || person::text, true); $$;

create function community.voice_occupants(channel uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'channelId', channel,
    'sessionId', s.id,
    'occupants', coalesce((
      select jsonb_agg(jsonb_build_object('coreUserId', p.user_id, 'muted', p.muted, 'deafened', p.deafened,
                                          'video', p.video, 'sharing', p.sharing) order by p.joined_at)
      from community.voice_participants p where p.session_id = s.id and p.left_at is null
    ), '[]'::jsonb))
  from (select channel as c) x
  left join community.voice_sessions s on s.channel_id = x.c and s.ended_at is null;
$$;

-- every member's sidebar shows who is in their rooms, so occupants go to each member personally
create function community.broadcast_occupants(channel uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  payload jsonb := community.voice_occupants(channel);
  member uuid;
begin
  for member in select user_id from community.channel_members where channel_id = channel limit 1000 loop
    perform community.send_to(member, 'voice:occupants', payload);
  end loop;
end;
$$;

-- people whose tab died stop heartbeating; let them go, close emptied sessions, drop stale sharing
create function community.sweep_voice(channel uuid default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  touched uuid;
begin
  for touched in
    with gone as (
      update community.voice_participants p set left_at = now(), sharing = false
      from community.voice_sessions s
      where p.session_id = s.id and p.left_at is null and p.last_seen_at < now() - interval '90 seconds'
        and (channel is null or s.channel_id = channel)
      returning s.channel_id
    )
    select distinct channel_id from gone
  loop
    perform community.close_if_empty(touched);
    perform community.broadcast_occupants(touched);
  end loop;
end;
$$;

create function community.close_if_empty(channel uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  s community.voice_sessions;
begin
  select * into s from community.voice_sessions where channel_id = channel and ended_at is null;
  if s.id is null then return; end if;
  if s.presenter_id is not null and not exists (
    select 1 from community.voice_participants
    where session_id = s.id and user_id = s.presenter_id and left_at is null
  ) then
    update community.voice_sessions set presenter_id = null where id = s.id;
    perform realtime.send(jsonb_build_object('sessionId', s.id, 'presenterCoreUserId', null),
      'screen:changed', 'voice:' || s.id::text, true);
  end if;
  if not exists (select 1 from community.voice_participants where session_id = s.id and left_at is null) then
    update community.voice_sessions set ended_at = now(), presenter_id = null where id = s.id;
    perform community.finish_calls(s.id, null);
  end if;
end;
$$;

create function community.session_json(session uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'id', s.id, 'channelId', s.channel_id, 'startedAt', s.started_at,
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('coreUserId', p.user_id, 'joinedAt', p.joined_at) order by p.joined_at)
      from community.voice_participants p where p.session_id = s.id and p.left_at is null), '[]'::jsonb),
    'maxSeats', c.max_seats,
    'seatsTaken', (select count(*) from community.voice_participants p where p.session_id = s.id and p.left_at is null))
  from community.voice_sessions s join community.channels c on c.id = s.channel_id
  where s.id = session;
$$;

create function community.join_voice(channel uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  s community.voice_sessions;
  seats int;
  present int;
  old_channel uuid;
begin
  perform community.require_member(channel);
  -- joins to one room queue behind each other: no duplicate sessions, no overbooked seats
  select max_seats into seats from community.channels where id = channel for update;
  perform community.sweep_voice(channel);

  select * into s from community.voice_sessions where channel_id = channel and ended_at is null;
  if s.id is not null and exists (
    select 1 from community.voice_participants where session_id = s.id and user_id = me and left_at is null
  ) then
    update community.voice_participants set last_seen_at = now()
    where session_id = s.id and user_id = me and left_at is null;
    return community.session_json(s.id);
  end if;
  if s.id is null then
    insert into community.voice_sessions (channel_id) values (channel) returning * into s;
  end if;
  select count(*) into present from community.voice_participants where session_id = s.id and left_at is null;
  if present >= seats then
    raise exception 'ห้องเต็มแล้ว (%/% คน) — ห้องเสียงแบบ P2P รับได้เท่านี้ รอให้มีคนออกก่อน', present, seats
      using errcode = 'P0001';
  end if;

  -- one room at a time: leave wherever I was
  select vs.channel_id into old_channel
  from community.voice_participants p join community.voice_sessions vs on vs.id = p.session_id
  where p.user_id = me and p.left_at is null;
  if old_channel is not null then
    update community.voice_participants set left_at = now(), sharing = false where user_id = me and left_at is null;
    perform community.close_if_empty(old_channel);
    perform community.broadcast_occupants(old_channel);
  end if;

  insert into community.voice_participants (session_id, user_id) values (s.id, me);
  perform community.broadcast_occupants(channel);
  return community.session_json(s.id);
end;
$$;

create function community.leave_voice(session uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  channel uuid;
begin
  update community.voice_participants p set left_at = now(), sharing = false
  where p.session_id = session and p.user_id = me and p.left_at is null;
  if not found then return; end if;
  select channel_id into channel from community.voice_sessions where id = session;
  perform community.finish_calls(session, me);
  perform community.close_if_empty(channel);
  perform community.broadcast_occupants(channel);
end;
$$;

create function community.voice_heartbeat(session uuid) returns boolean
language sql security definer set search_path = ''
as $$
  update community.voice_participants set last_seen_at = now()
  where session_id = session and user_id = auth.uid() and left_at is null
  returning true;
$$;

create function community.set_voice_state(
  session uuid, muted boolean default null, deafened boolean default null, video boolean default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  channel uuid;
begin
  update community.voice_participants p
  set muted = coalesce(set_voice_state.muted, p.muted),
      deafened = coalesce(set_voice_state.deafened, p.deafened),
      video = coalesce(set_voice_state.video, p.video),
      last_seen_at = now()
  where p.session_id = session and p.user_id = auth.uid() and p.left_at is null;
  if not found then raise exception 'คุณไม่ได้อยู่ในห้องเสียงนี้' using errcode = 'P0002'; end if;
  select channel_id into channel from community.voice_sessions where id = session;
  perform community.broadcast_occupants(channel);
  return community.voice_occupants(channel);
end;
$$;

create function community.voice_sessions_list(channel uuid default null) returns setof jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.sweep_voice(channel);
  return query
    select community.session_json(s.id)
    from community.voice_sessions s
    where s.ended_at is null and community.is_member(s.channel_id)
      and (channel is null or s.channel_id = channel);
end;
$$;

-- STUN for everyone; TURN only when an operator stored credentials (service_role) — free tier first
create table community.turn_config (
  id boolean primary key default true check (id),
  urls text[] not null,
  username text,
  credential text
);

create function community.ice_servers() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_array(jsonb_build_object('urls', jsonb_build_array(
      'stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302', 'stun:stun.cloudflare.com:3478')))
    || coalesce((select jsonb_build_array(jsonb_build_object(
          'urls', to_jsonb(t.urls), 'username', t.username, 'credential', t.credential))
        from community.turn_config t), '[]'::jsonb);
$$;

-- ── screen share (one presenter per session) ─────────────────────────────
create function community.claim_screen(session uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  s community.voice_sessions;
begin
  select * into s from community.voice_sessions where id = session and ended_at is null for update;
  if s.id is null or not community.in_voice(session) then
    return jsonb_build_object('ok', false, 'error', 'คุณไม่ได้อยู่ในห้องเสียงนี้');
  end if;
  perform community.sweep_voice(s.channel_id);
  if s.presenter_id is not null and s.presenter_id <> me and exists (
    select 1 from community.voice_participants where session_id = session and user_id = s.presenter_id and left_at is null
  ) then
    return jsonb_build_object('ok', false, 'presenterCoreUserId', s.presenter_id,
      'error', 'มีคนกำลังแชร์หน้าจออยู่ รอให้เขาหยุดก่อน');
  end if;
  update community.voice_sessions set presenter_id = me where id = session;
  update community.voice_participants set sharing = (user_id = me) where session_id = session and left_at is null;
  perform community.broadcast_occupants(s.channel_id);
  perform realtime.send(jsonb_build_object('sessionId', session, 'presenterCoreUserId', me),
    'screen:changed', 'voice:' || session::text, true);
  return jsonb_build_object('ok', true, 'presenterCoreUserId', me, 'maxViewers', 4);
end;
$$;

create function community.release_screen(session uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  channel uuid;
begin
  update community.voice_sessions set presenter_id = null
  where id = session and presenter_id = auth.uid() returning channel_id into channel;
  if channel is null then return; end if;
  update community.voice_participants set sharing = false where session_id = session and user_id = auth.uid();
  perform community.broadcast_occupants(channel);
  perform realtime.send(jsonb_build_object('sessionId', session, 'presenterCoreUserId', null),
    'screen:changed', 'voice:' || session::text, true);
end;
$$;

-- ── calls: ringing, answers and the call log card in chat ────────────────
alter table community.messages drop constraint messages_last_change_check;
alter table community.messages add constraint messages_last_change_check
  check (last_change in ('create', 'edit', 'delete', 'pin', 'unpin', 'reply', 'call'));

create table community.call_logs (
  message_id uuid primary key references community.messages (id) on delete cascade,
  channel_id uuid not null references community.channels (id) on delete cascade,
  session_id uuid not null,
  caller_id uuid not null references auth.users (id) on delete cascade,
  media text not null default 'AUDIO' check (media in ('AUDIO', 'VIDEO')),
  status text not null default 'RINGING'
    check (status in ('RINGING', 'ONGOING', 'ANSWERED', 'MISSED', 'DECLINED', 'CANCELLED')),
  invitees uuid[] not null default '{}',
  declined uuid[] not null default '{}',
  started_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  duration_sec int,
  unique (session_id, caller_id)
);
create index on community.call_logs (channel_id, started_at desc);
create index on community.call_logs (status, started_at);

-- the card's shape; live calls read as MISSED/ANSWERED with endedAt null
create function community.call_log_json(message uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'media', cl.media,
    'status', case cl.status when 'RINGING' then 'MISSED' when 'ONGOING' then 'ANSWERED' else cl.status end,
    'durationSec', cl.duration_sec, 'callerCoreUserId', cl.caller_id,
    'startedAt', cl.started_at, 'endedAt', cl.ended_at)
  from community.call_logs cl where cl.message_id = message;
$$;

create function community.finish_call(log community.call_logs, final text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  invitee uuid;
begin
  update community.call_logs
  set status = final, ended_at = now(),
      duration_sec = case when final = 'ANSWERED' and answered_at is not null
                          then round(extract(epoch from now() - answered_at))::int end
  where message_id = log.message_id and ended_at is null;
  if not found then return; end if;
  update community.messages set last_change = 'call' where id = log.message_id;
  if final = 'MISSED' then
    foreach invitee in array log.invitees loop
      if not invitee = any (log.declined) then
        perform community.notify_as(log.caller_id, invitee, 'MISSED_CALL', log.message_id::text,
          jsonb_build_object('channelId', log.channel_id, 'messageId', log.message_id, 'media', log.media));
      end if;
    end loop;
  end if;
end;
$$;

-- notify() takes the actor from the JWT; a sweep may run as someone else, so name the actor
create function community.notify_as(actor uuid, recipient uuid, kind text, ref text, payload jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  prev text := current_setting('request.jwt.claims', true);
begin
  perform set_config('request.jwt.claims', json_build_object('sub', actor, 'role', 'authenticated')::text, true);
  perform community.notify(recipient, kind, ref, payload);
  perform set_config('request.jwt.claims', coalesce(prev, ''), true);
end;
$$;

-- end every open call of a session (person = null) or every call that person was part of
create function community.finish_calls(session uuid, person uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  log community.call_logs;
begin
  for log in
    select * from community.call_logs
    where session_id = session and ended_at is null
      and (person is null or caller_id = person or person = any (invitees))
  loop
    perform community.finish_call(log, case
      when log.answered_at is not null then 'ANSWERED'
      when person is null or log.caller_id = person then 'CANCELLED'
      else log.status end);
  end loop;
end;
$$;

-- rings nobody picked up within a minute become missed calls, whoever happens to look next
create function community.sweep_calls() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  log community.call_logs;
begin
  for log in select * from community.call_logs
             where status = 'RINGING' and ended_at is null and started_at < now() - interval '60 seconds'
  loop
    perform community.finish_call(log, 'MISSED');
  end loop;
end;
$$;

create function community.call_ring(session uuid, callee uuid, media text default 'AUDIO') returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  s community.voice_sessions;
  k text;
  log community.call_logs;
  msg uuid;
begin
  if media is null or media not in ('AUDIO', 'VIDEO') then
    raise exception 'คำขอไม่ถูกต้อง' using errcode = 'P0001';
  end if;
  if callee = me then raise exception 'โทรหาตัวเองไม่ได้' using errcode = 'P0001'; end if;
  select * into s from community.voice_sessions where id = session and ended_at is null;
  if s.id is null then raise exception 'ไม่พบห้องเสียงนี้' using errcode = 'P0002'; end if;
  if not community.in_voice(session) then
    raise exception 'คุณไม่ได้อยู่ในห้องเสียงนี้' using errcode = 'P0001';
  end if;
  if not exists (select 1 from community.channel_members where channel_id = s.channel_id and user_id = callee)
     or community.is_blocked_either(me, callee) then
    raise exception 'โทรหาคนนี้ไม่ได้' using errcode = 'P0001';
  end if;
  perform community.sweep_calls();

  perform community.send_to(callee, 'call:incoming', jsonb_build_object(
    'sessionId', session, 'channelId', s.channel_id, 'fromCoreUserId', me, 'media', media));

  -- only DMs and group chats keep a call card in the conversation
  select kind into k from community.channels where id = s.channel_id;
  if k in ('DM', 'GROUP_DM') then
    select * into log from community.call_logs where session_id = session and caller_id = me;
    if log.message_id is null then
      insert into community.messages (channel_id, author_id, content, client_nonce)
      values (s.channel_id, me, null, 'call-' || session::text) returning id into msg;
      insert into community.call_logs (message_id, channel_id, session_id, caller_id, media, invitees)
      values (msg, s.channel_id, session, me, media, array[callee]);
    elsif log.ended_at is null and not callee = any (log.invitees) then
      update community.call_logs set invitees = invitees || callee where message_id = log.message_id;
    end if;
  end if;

  perform community.notify(callee, 'VOICE_INVITE', session::text, jsonb_build_object('channelId', s.channel_id));
end;
$$;

create function community.call_peer_check(session uuid, peer uuid) returns community.voice_sessions
language plpgsql security definer set search_path = ''
as $$
declare
  s community.voice_sessions;
begin
  select * into s from community.voice_sessions where id = session;
  if s.id is null or not community.is_member(s.channel_id)
     or not exists (select 1 from community.channel_members where channel_id = s.channel_id and user_id = peer) then
    raise exception 'ไม่พบห้องเสียงนี้' using errcode = 'P0002';
  end if;
  return s;
end;
$$;

create function community.call_answer(session uuid, caller uuid, accepted boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  log community.call_logs;
begin
  perform community.call_peer_check(session, caller);
  perform community.send_to(caller, 'call:answered', jsonb_build_object(
    'sessionId', session, 'fromCoreUserId', me, 'accepted', accepted));
  select * into log from community.call_logs
  where session_id = session and caller_id = caller and ended_at is null for update;
  if log.message_id is null or not me = any (log.invitees) then return; end if;
  if not accepted then
    update community.call_logs set declined = array_append(declined, me)
    where message_id = log.message_id and not me = any (declined)
    returning * into log;
    if log.answered_at is null and log.invitees <@ log.declined then
      perform community.finish_call(log, 'DECLINED');
    end if;
  elsif log.answered_at is null then
    update community.call_logs set status = 'ONGOING', answered_at = now() where message_id = log.message_id;
    update community.messages set last_change = 'call' where id = log.message_id;
  end if;
end;
$$;

-- the caller gives up before anyone answers; timed_out marks it missed (and tells the invitees)
create function community.call_cancel(session uuid, callee uuid, timed_out boolean default false) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  log community.call_logs;
begin
  perform community.call_peer_check(session, callee);
  perform community.send_to(callee, 'call:cancelled', jsonb_build_object('sessionId', session, 'fromCoreUserId', me));
  select * into log from community.call_logs
  where session_id = session and caller_id = me and ended_at is null and answered_at is null;
  if log.message_id is not null then
    perform community.finish_call(log, case when timed_out then 'MISSED' else 'CANCELLED' end);
  end if;
end;
$$;

create function community.call_end(session uuid, peer uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
begin
  perform community.call_peer_check(session, peer);
  perform community.send_to(peer, 'call:ended', jsonb_build_object('sessionId', session, 'fromCoreUserId', me));
  perform community.finish_calls(session, me);
end;
$$;

-- a call card is a record: no replies, threads, edits or pins
create function community.guard_call_log() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.reply_to_id is not null and exists (select 1 from community.call_logs where message_id = new.reply_to_id)
       or new.parent_id is not null and exists (select 1 from community.call_logs where message_id = new.parent_id) then
      raise exception 'ตอบกลับบันทึกการโทรไม่ได้' using errcode = 'P0001';
    end if;
  elsif exists (select 1 from community.call_logs where message_id = old.id) then
    if new.content is distinct from old.content and new.deleted_at is null then
      raise exception 'แก้ไขบันทึกการโทรไม่ได้' using errcode = 'P0001';
    end if;
    if new.pinned_at is not null and old.pinned_at is null then
      raise exception 'ปักหมุดบันทึกการโทรไม่ได้' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_call_log before insert or update on community.messages
  for each row execute function community.guard_call_log();

create table community.call_feedback (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references community.channels (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  duration_sec int check (duration_sec between 0 and 86400),
  kind text not null check (kind in ('AUDIO', 'VIDEO')),
  created_at timestamptz not null default now()
);
create index on community.call_feedback (created_at desc);

-- ── chat views learn about calls and voice rooms ─────────────────────────
create or replace view community.message_view with (security_invoker = true) as
select
  m.id, m.seq, m.channel_id, m.author_id, m.content, m.parent_id, m.reply_count,
  m.pinned_at, m.pinned_by, m.client_nonce, m.edited_at, m.created_at, m.forwarded, m.deleted_at,
  case when r.id is null then null else jsonb_build_object(
    'id', r.id,
    'authorCoreUserId', r.author_id,
    'preview', left(r.content, 120),
    'attachmentKind', (select ra.kind from community.assets ra
                       where ra.message_id = r.id and ra.status = 'READY' order by ra.created_at limit 1),
    'deleted', r.deleted_at is not null
  ) end as reply_to,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'fileName', a.file_name, 'kind', a.kind, 'mimeType', a.mime_type,
      'sizeBytes', a.size_bytes::text) order by a.created_at)
    from community.assets a where a.message_id = m.id and a.status = 'READY'
  ), '[]'::jsonb) as attachments,
  m.embed_kind, m.embed_ref, m.story_reply_kind, m.story_reply_emoji,
  community.call_log_json(m.id) as call_log
from community.messages m
left join community.messages r on r.id = m.reply_to_id;

create or replace function community.channel_rows(only_channel uuid default null, max_rows int default 50, skip int default 0)
returns setof jsonb
language sql stable security invoker set search_path = ''
as $$
  with mine as (
    select cm.*, c.kind, c.name, c.course_tag, c.max_seats, c.description, c.created_by, c.created_at as channel_created_at
    from community.channel_members cm
    join community.channels c on c.id = cm.channel_id
    where cm.user_id = auth.uid() and (only_channel is null or cm.channel_id = only_channel)
  ),
  enriched as (
    select
      mine.*,
      last.*,
      (select count(*) from community.channel_members x where x.channel_id = mine.channel_id) as member_count,
      (select count(*) from community.messages u
        where u.channel_id = mine.channel_id and u.parent_id is null and u.deleted_at is null
          and u.seq > mine.last_read_seq and u.author_id <> auth.uid()
          and (mine.cleared_at is null or u.created_at > mine.cleared_at)) as unread_count,
      peer.user_id as peer_id,
      peer.last_read_seq as peer_last_read_seq,
      (select coalesce(jsonb_object_agg(n.user_id, n.nickname) filter (where n.nickname is not null), '{}'::jsonb)
        from community.channel_members n where n.channel_id = mine.channel_id) as nicknames,
      case when mine.kind = 'GROUP_DM' then
        (select jsonb_agg(g.user_id order by g.joined_at) from community.channel_members g where g.channel_id = mine.channel_id)
      end as member_ids
    from mine
    left join lateral (
      select l.seq as last_seq, l.content as last_content, l.author_id as last_author, l.created_at as last_at,
        (select count(*) from community.assets la where la.message_id = l.id and la.status = 'READY') as last_attachments,
        community.call_log_json(l.id) as last_call
      from community.messages l
      where l.channel_id = mine.channel_id and l.parent_id is null and l.deleted_at is null
      order by l.seq desc limit 1
    ) last on true
    left join lateral (
      select p.user_id, p.last_read_seq from community.channel_members p
      where mine.kind = 'DM' and p.channel_id = mine.channel_id and p.user_id <> auth.uid()
      limit 1
    ) peer on true
    where only_channel is not null or mine.cleared_at is null or last.last_at > mine.cleared_at
  )
  select jsonb_build_object(
    'id', e.channel_id,
    'kind', e.kind,
    'name', e.name,
    'courseTag', e.course_tag,
    'maxSeats', e.max_seats,
    'memberCount', e.member_count,
    'myRole', e.role,
    'unreadCount', e.unread_count,
    'peerCoreUserId', e.peer_id,
    'description', e.description,
    'createdByCoreUserId', e.created_by,
    'canManage', community.can_manage(e.channel_id),
    'lastMessage', case when e.last_seq is null then null else jsonb_build_object(
      'seq', e.last_seq, 'content', e.last_content, 'authorCoreUserId', e.last_author,
      'attachmentCount', e.last_attachments, 'callLog', e.last_call, 'createdAt', e.last_at) end,
    -- a DM or group from someone you don't follow and never answered is a "request"
    'inboxFolder', coalesce(e.inbox_folder, case
      when e.kind in ('DM', 'GROUP_DM') and e.last_seq is not null
        and coalesce(e.peer_id, e.created_by) is distinct from auth.uid()
        and coalesce(e.peer_id, e.created_by) is not null
        and not exists (select 1 from community.follows f
                        where f.follower_id = auth.uid() and f.followee_id = coalesce(e.peer_id, e.created_by))
        and not exists (select 1 from community.messages s
                        where s.channel_id = e.channel_id and s.author_id = auth.uid())
      then 'REQUEST' else 'PRIMARY' end),
    'pinnedAt', e.inbox_pinned_at,
    'muted', e.muted,
    'clearedAt', e.cleared_at,
    'peerLastReadSeq', e.peer_last_read_seq,
    'memberCoreUserIds', e.member_ids,
    'nicknames', e.nicknames,
    'markedUnread', e.marked_unread,
    'voiceOccupants', case when e.kind = 'VOICE' then community.voice_occupants(e.channel_id) -> 'occupants' end,
    'createdAt', e.channel_created_at
  )
  from enriched e
  order by e.inbox_pinned_at desc nulls last, coalesce(e.last_at, e.channel_created_at) desc, e.channel_id desc
  limit least(greatest(max_rows, 1), 100) offset greatest(skip, 0);
$$;

-- ── row level security ───────────────────────────────────────────────────
alter table community.meetings enable row level security;
alter table community.voice_sessions enable row level security;
alter table community.voice_participants enable row level security;
alter table community.call_logs enable row level security;
alter table community.call_feedback enable row level security;
alter table community.turn_config enable row level security; -- no policies: RPC-only

create policy "members see their rooms' meetings" on community.meetings
  for select to authenticated using (community.is_member(channel_id));
create policy "members see their rooms' voice sessions" on community.voice_sessions
  for select to authenticated using (community.is_member(channel_id));
create policy "members see who is in their rooms' voice" on community.voice_participants
  for select to authenticated
  using (exists (select 1 from community.voice_sessions s where s.id = session_id));
create policy "members see their rooms' calls" on community.call_logs
  for select to authenticated using (community.is_member(channel_id));
create policy "rate calls in your rooms" on community.call_feedback
  for insert to authenticated
  with check ((select auth.uid()) = user_id and community.is_member(channel_id));
create policy "staff read call feedback" on community.call_feedback
  for select to authenticated using (community.is_staff());

grant select on community.meetings, community.meeting_view, community.voice_sessions,
  community.voice_participants, community.call_logs to authenticated;
grant select, insert on community.call_feedback to authenticated;
grant all on community.meetings, community.voice_sessions, community.voice_participants,
  community.call_logs, community.call_feedback, community.turn_config to service_role;

-- realtime: your personal topic, and the voice session you're in
create policy "everyone hears their own personal topic" on realtime.messages
  for select to authenticated
  using (realtime.topic() = 'user:' || (select auth.uid())::text);
create policy "voice participants hear the session topic" on realtime.messages
  for select to authenticated
  using (realtime.topic() ~ '^voice:[0-9a-f-]{36}$' and community.in_voice(substring(realtime.topic() from 7)::uuid));
create policy "voice participants signal on the session topic" on realtime.messages
  for insert to authenticated
  with check (realtime.topic() ~ '^voice:[0-9a-f-]{36}$' and community.in_voice(substring(realtime.topic() from 7)::uuid));

revoke all on function
  community.create_meeting(uuid, text, timestamptz, timestamptz, text), community.cancel_meeting(uuid),
  community.in_voice(uuid), community.send_to(uuid, text, jsonb), community.voice_occupants(uuid),
  community.broadcast_occupants(uuid), community.sweep_voice(uuid), community.close_if_empty(uuid),
  community.session_json(uuid), community.join_voice(uuid), community.leave_voice(uuid),
  community.voice_heartbeat(uuid), community.set_voice_state(uuid, boolean, boolean, boolean),
  community.voice_sessions_list(uuid), community.ice_servers(), community.claim_screen(uuid),
  community.release_screen(uuid), community.call_log_json(uuid), community.finish_call(community.call_logs, text),
  community.notify_as(uuid, uuid, text, text, jsonb), community.finish_calls(uuid, uuid), community.sweep_calls(),
  community.call_ring(uuid, uuid, text), community.call_peer_check(uuid, uuid),
  community.call_answer(uuid, uuid, boolean), community.call_cancel(uuid, uuid, boolean), community.call_end(uuid, uuid)
from public;
grant execute on function
  community.create_meeting(uuid, text, timestamptz, timestamptz, text), community.cancel_meeting(uuid),
  community.in_voice(uuid), community.voice_occupants(uuid), community.call_log_json(uuid),
  community.join_voice(uuid), community.leave_voice(uuid), community.voice_heartbeat(uuid),
  community.set_voice_state(uuid, boolean, boolean, boolean), community.voice_sessions_list(uuid),
  community.ice_servers(), community.claim_screen(uuid), community.release_screen(uuid),
  community.call_ring(uuid, uuid, text), community.call_answer(uuid, uuid, boolean),
  community.call_cancel(uuid, uuid, boolean), community.call_end(uuid, uuid)
to authenticated;
