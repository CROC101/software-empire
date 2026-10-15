-- Community round 2: chat — channels, members, messages, reactions, realtime.
-- Ported rules from csmju-nexus channels/messages services. Reads go through RLS
-- (membership); every write goes through a security-definer function that re-checks the
-- rule it replaces, so a client can never skip a check by calling the table directly.

-- ── tables ───────────────────────────────────────────────────────────────
create table community.channels (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('DM', 'GROUP', 'COURSE', 'VOICE', 'GROUP_DM')),
  name text check (char_length(btrim(name)) between 1 and 60),
  course_tag text check (char_length(course_tag) <= 40),
  max_seats int not null default 8 check (max_seats between 2 and 25),
  description text check (char_length(description) <= 300),
  created_by uuid references auth.users (id) on delete set null,
  -- one DM per pair: "<smaller uuid>:<larger uuid>"
  dm_key text unique,
  created_at timestamptz not null default now(),
  check ((kind = 'DM') = (dm_key is not null))
);

create table community.channel_members (
  channel_id uuid not null references community.channels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('MEMBER', 'MODERATOR')),
  last_read_seq bigint not null default 0,
  joined_at timestamptz not null default now(),
  inbox_folder text check (inbox_folder in ('PRIMARY', 'GENERAL', 'HIDDEN')),
  inbox_pinned_at timestamptz,
  muted boolean not null default false,
  cleared_at timestamptz,
  nickname text check (char_length(btrim(nickname)) between 1 and 40),
  marked_unread boolean not null default false,
  primary key (channel_id, user_id)
);
create index on community.channel_members (user_id);

create table community.messages (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  client_nonce text not null check (char_length(client_nonce) between 1 and 64),
  content text check (char_length(content) <= 4000),
  channel_id uuid not null references community.channels (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references community.messages (id) on delete cascade,
  reply_count int not null default 0,
  pinned_at timestamptz,
  pinned_by uuid references auth.users (id) on delete set null,
  reply_to_id uuid references community.messages (id) on delete set null,
  forwarded boolean not null default false,
  edited_at timestamptz,
  -- soft delete keeps the row for moderators; content is wiped
  deleted_at timestamptz,
  -- why the row last changed — realtime subscribers only get the new row (RLS hides old values)
  last_change text not null default 'create'
    check (last_change in ('create', 'edit', 'delete', 'pin', 'unpin', 'reply')),
  created_at timestamptz not null default now(),
  unique (channel_id, author_id, client_nonce)
);
create index on community.messages (channel_id, seq desc);
create index on community.messages (parent_id, seq);
create index on community.messages (channel_id, pinned_at desc) where pinned_at is not null;
create index on community.messages (author_id, created_at desc);

-- generic reactions (posts and reels join in later rounds)
create table community.reactions (
  target_kind text not null check (target_kind in ('MESSAGE', 'POST', 'REEL')),
  target_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- emoji only: no letters, digits or whitespace, so reactions can't carry text
  emoji text not null check (char_length(emoji) between 1 and 16 and emoji !~ '[[:alnum:][:space:]]'),
  created_at timestamptz not null default now(),
  primary key (target_kind, target_id, user_id, emoji)
);
create index on community.reactions (target_kind, target_id);

-- ── helpers ──────────────────────────────────────────────────────────────
create function community.is_member(channel uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from community.channel_members
    where channel_id = channel and user_id = auth.uid()
  );
$$;

create function community.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select role = 'ADMIN' from community.profiles where user_id = auth.uid()), false);
$$;

create function community.my_role(channel uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select role from community.channel_members where channel_id = channel and user_id = auth.uid();
$$;

-- who can see a reaction: for messages, members of the message's channel
create function community.can_see_target(kind text, target uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select case kind
    when 'MESSAGE' then exists (
      select 1 from community.messages m
      join community.channel_members cm on cm.channel_id = m.channel_id and cm.user_id = auth.uid()
      where m.id = target and m.deleted_at is null
    )
    else false -- posts and reels arrive with their own rounds
  end;
$$;

revoke all on function community.is_member(uuid), community.is_staff(), community.my_role(uuid),
  community.can_see_target(text, uuid) from public;
grant execute on function community.is_member(uuid), community.is_staff(), community.my_role(uuid),
  community.can_see_target(text, uuid) to authenticated;

create function community.require_user() returns uuid
language plpgsql stable set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'ต้องเข้าสู่ระบบ' using errcode = '42501'; end if;
  return auth.uid();
end;
$$;

-- 404 instead of 403 so outsiders can't learn that a room exists
create function community.require_member(channel uuid) returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  r text;
begin
  select role into r from community.channel_members where channel_id = channel and user_id = auth.uid();
  if r is null then raise exception 'ไม่พบห้องนี้ หรือคุณไม่ได้เป็นสมาชิก' using errcode = 'P0002'; end if;
  return r;
end;
$$;

-- ── row level security: read = membership; no direct writes except reactions ──
alter table community.channels enable row level security;
alter table community.channel_members enable row level security;
alter table community.messages enable row level security;
alter table community.reactions enable row level security;

create policy "members see their channels" on community.channels
  for select to authenticated using (community.is_member(id));
create policy "members see co-members" on community.channel_members
  for select to authenticated using (community.is_member(channel_id));
create policy "members read messages" on community.messages
  for select to authenticated using (community.is_member(channel_id));

create policy "see reactions on what you can see" on community.reactions
  for select to authenticated using (community.can_see_target(target_kind, target_id));
create policy "react as yourself on what you can see" on community.reactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id and community.can_see_target(target_kind, target_id));
create policy "remove your own reactions" on community.reactions
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select on community.channels, community.channel_members, community.messages to authenticated;
grant select, insert, delete on community.reactions to authenticated;
grant all on community.channels, community.channel_members, community.messages, community.reactions
  to service_role;

-- ── channels ─────────────────────────────────────────────────────────────
create function community.create_channel(
  kind text, name text, description text default null, course_tag text default null, max_seats int default 8
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  id uuid;
begin
  if kind not in ('GROUP', 'COURSE', 'VOICE') then
    raise exception 'ชนิดห้องไม่ถูกต้อง' using errcode = 'P0001';
  end if;
  if kind = 'COURSE' and not community.is_staff() then
    raise exception 'ห้องประจำวิชาสร้างได้เฉพาะผู้ดูแล — สร้างห้องกลุ่มแทนได้' using errcode = '42501';
  end if;
  insert into community.channels (kind, name, description, course_tag, max_seats, created_by)
  values (kind, btrim(name), nullif(btrim(description), ''), nullif(btrim(course_tag), ''), coalesce(max_seats, 8), me)
  returning channels.id into id;
  insert into community.channel_members (channel_id, user_id, role) values (id, me, 'MODERATOR');
  return id;
end;
$$;

create function community.open_direct(peers uuid[], group_name text default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  others uuid[];
  peer uuid;
  key text;
  id uuid;
begin
  select array_agg(distinct p) into others from unnest(peers) p where p is not null and p <> me;
  if others is null then raise exception 'สร้างห้องแชทกับตัวเองไม่ได้' using errcode = 'P0001'; end if;
  foreach peer in array others loop
    if not exists (select 1 from auth.users where auth.users.id = peer) then
      raise exception 'ไม่พบผู้ใช้บางคน' using errcode = 'P0002';
    end if;
    if community.is_blocked_either(me, peer) then
      raise exception 'ส่งข้อความหาคนนี้ไม่ได้' using errcode = '42501';
    end if;
  end loop;

  if array_length(others, 1) = 1 then
    peer := others[1];
    key := least(me::text, peer::text) || ':' || greatest(me::text, peer::text);
    select channels.id into id from community.channels where dm_key = key;
    if id is null then
      insert into community.channels (kind, dm_key, created_by) values ('DM', key, me)
      returning channels.id into id;
      insert into community.channel_members (channel_id, user_id) values (id, me), (id, peer);
    else
      -- someone who left the DM comes back to the same history
      insert into community.channel_members (channel_id, user_id) values (id, me), (id, peer)
      on conflict do nothing;
    end if;
    return id;
  end if;

  if array_length(others, 1) + 1 > 32 then
    raise exception 'แชทกลุ่มมีได้ไม่เกิน 32 คนรวมตัวคุณ' using errcode = 'P0001';
  end if;
  insert into community.channels (kind, name, created_by)
  values ('GROUP_DM', nullif(btrim(group_name), ''), me) returning channels.id into id;
  insert into community.channel_members (channel_id, user_id, role) values (id, me, 'MODERATOR');
  insert into community.channel_members (channel_id, user_id) select id, unnest(others);
  return id;
end;
$$;

create function community.can_manage(channel uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select c.kind <> 'DM' and (
    c.created_by = auth.uid() or community.my_role(c.id) = 'MODERATOR' or community.is_staff()
  )
  from community.channels c where c.id = channel;
$$;
grant execute on function community.can_manage(uuid) to authenticated;

create function community.update_channel(channel uuid, new_name text default null, new_description text default null) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.require_member(channel);
  if not community.can_manage(channel) then
    raise exception 'แก้ห้องนี้ได้เฉพาะผู้ดูแลห้อง' using errcode = '42501';
  end if;
  update community.channels
  set name = coalesce(nullif(btrim(new_name), ''), name),
      description = case when new_description is null then description else nullif(btrim(new_description), '') end
  where id = channel;
end;
$$;

create function community.delete_channel(channel uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.require_member(channel);
  if not community.can_manage(channel) then
    raise exception 'ลบห้องนี้ได้เฉพาะผู้ดูแลห้อง' using errcode = '42501';
  end if;
  delete from community.channels where id = channel;
end;
$$;

create function community.add_members(channel uuid, users uuid[]) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  my_role text := community.require_member(channel);
  k text;
  current_count int;
  added int;
begin
  select kind into k from community.channels where id = channel;
  if k = 'DM' then raise exception 'เพิ่มคนเข้าแชทส่วนตัวไม่ได้' using errcode = 'P0001'; end if;
  if my_role <> 'MODERATOR' and not community.is_staff() then
    raise exception 'เพิ่มสมาชิกได้เฉพาะผู้ดูแลห้อง' using errcode = '42501';
  end if;
  select count(*) into current_count from community.channel_members where channel_id = channel;
  with candidates as (
    select distinct u from unnest(users) u
    where u <> me and exists (select 1 from auth.users where id = u)
      and not community.is_blocked_either(me, u)
      and not exists (select 1 from community.channel_members where channel_id = channel and user_id = u)
  )
  select count(*) into added from candidates;
  if k = 'GROUP_DM' and current_count + added > 32 then
    raise exception 'แชทกลุ่มมีได้ไม่เกิน 32 คน' using errcode = 'P0001';
  end if;
  insert into community.channel_members (channel_id, user_id)
  select channel, u from (
    select distinct u from unnest(users) u
    where u <> me and exists (select 1 from auth.users where id = u)
      and not community.is_blocked_either(me, u)
  ) c
  on conflict do nothing;
  return added;
end;
$$;

create function community.remove_member(channel uuid, target uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  my_role text := community.require_member(channel);
  c record;
  target_role text;
begin
  select kind, created_by into c from community.channels where id = channel;
  if c.kind = 'DM' then raise exception 'นำคนออกจากแชทส่วนตัวไม่ได้' using errcode = 'P0001'; end if;
  if target = me then raise exception 'ใช้ "ออกจากห้อง" แทน' using errcode = 'P0001'; end if;
  select role into target_role from community.channel_members where channel_id = channel and user_id = target;
  if target_role is null then raise exception 'คนนี้ไม่ได้อยู่ในห้องนี้' using errcode = 'P0002'; end if;
  if not community.is_staff() and (
    my_role <> 'MODERATOR'
    or target = c.created_by
    or (target_role = 'MODERATOR' and c.created_by is distinct from me)
  ) then
    raise exception 'คุณนำคนนี้ออกไม่ได้' using errcode = '42501';
  end if;
  delete from community.channel_members where channel_id = channel and user_id = target;
end;
$$;

create function community.leave_channel(channel uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
begin
  perform community.require_member(channel);
  delete from community.channel_members where channel_id = channel and user_id = me;
  if not exists (select 1 from community.channel_members where channel_id = channel) then
    delete from community.channels where id = channel;
  elsif not exists (select 1 from community.channel_members where channel_id = channel and role = 'MODERATOR') then
    -- a room is never left without a moderator: the longest-standing member takes over
    update community.channel_members set role = 'MODERATOR'
    where (channel_id, user_id) = (
      select channel_id, user_id from community.channel_members
      where channel_id = channel order by joined_at, user_id limit 1
    );
  end if;
end;
$$;

-- per-member inbox state; null = leave unchanged
create function community.update_inbox(
  channel uuid, folder text default null, pinned boolean default null, mute boolean default null
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.require_member(channel);
  update community.channel_members
  set inbox_folder = coalesce(folder, inbox_folder),
      inbox_pinned_at = case when pinned is null then inbox_pinned_at when pinned then now() else null end,
      muted = coalesce(mute, muted)
  where channel_id = channel and user_id = auth.uid();
end;
$$;

create function community.set_nickname(channel uuid, target uuid, nick text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  k text;
begin
  perform community.require_member(channel);
  select kind into k from community.channels where id = channel;
  if k not in ('DM', 'GROUP_DM') then
    raise exception 'ตั้งชื่อเล่นได้เฉพาะแชทส่วนตัวและแชทกลุ่ม' using errcode = 'P0001';
  end if;
  update community.channel_members set nickname = nullif(btrim(nick), '')
  where channel_id = channel and user_id = target;
  if not found then raise exception 'คนนี้ไม่ได้อยู่ในแชทนี้' using errcode = 'P0002'; end if;
end;
$$;

create function community.mark_read(channel uuid, upto bigint) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.require_member(channel);
  update community.channel_members
  set last_read_seq = greatest(last_read_seq, coalesce(upto, 0)), marked_unread = false
  where channel_id = channel and user_id = auth.uid();
end;
$$;

create function community.mark_unread(channel uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.require_member(channel);
  if not exists (select 1 from community.messages where channel_id = channel and deleted_at is null) then
    raise exception 'ห้องนี้ยังไม่มีข้อความให้ทำเครื่องหมายว่ายังไม่ได้อ่าน' using errcode = 'P0001';
  end if;
  update community.channel_members set marked_unread = true
  where channel_id = channel and user_id = auth.uid();
end;
$$;

create function community.clear_channel(channel uuid) returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  at timestamptz := now();
begin
  perform community.require_member(channel);
  update community.channel_members set cleared_at = at
  where channel_id = channel and user_id = auth.uid();
  return at;
end;
$$;

-- ── messages ─────────────────────────────────────────────────────────────
create function community.send_message(
  channel uuid, body text, nonce text, parent uuid default null, reply_to uuid default null, is_forward boolean default false
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  k text;
  peer uuid;
  existing uuid;
  new_id uuid;
  text_body text := nullif(btrim(body), '');
begin
  perform community.require_member(channel);
  -- same nonce = the client retried after a flaky connection: return the first copy
  select messages.id into existing from community.messages
  where channel_id = channel and author_id = me and client_nonce = nonce;
  if existing is not null then return existing; end if;

  if text_body is null then raise exception 'ข้อความว่าง' using errcode = 'P0001'; end if;
  if (select count(*) from community.messages
      where author_id = me and created_at > now() - interval '10 seconds') >= 20 then
    raise exception 'ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่' using errcode = 'P0001';
  end if;

  select kind into k from community.channels where channels.id = channel;
  if k = 'DM' then
    select user_id into peer from community.channel_members where channel_id = channel and user_id <> me;
    if peer is not null and community.is_blocked_either(me, peer) then
      raise exception 'ส่งข้อความหาคนนี้ไม่ได้' using errcode = '42501';
    end if;
  end if;

  if parent is not null and not exists (
    select 1 from community.messages
    where messages.id = parent and channel_id = channel and parent_id is null and deleted_at is null
  ) then
    raise exception 'ไม่พบข้อความต้นเธรดนี้' using errcode = 'P0002';
  end if;
  if reply_to is not null and not exists (
    select 1 from community.messages where messages.id = reply_to and channel_id = channel
  ) then
    raise exception 'ไม่พบข้อความที่จะตอบกลับในห้องนี้' using errcode = 'P0002';
  end if;

  insert into community.messages (channel_id, author_id, content, client_nonce, parent_id, reply_to_id, forwarded)
  values (channel, me, text_body, nonce, parent, reply_to, is_forward)
  returning messages.id into new_id;

  if parent is not null then
    update community.messages set reply_count = reply_count + 1, last_change = 'reply' where messages.id = parent;
  end if;
  -- the sender has read everything up to their own message
  update community.channel_members
  set last_read_seq = (select seq from community.messages where messages.id = new_id), marked_unread = false
  where channel_id = channel and user_id = me;
  return new_id;
end;
$$;

create function community.edit_message(message uuid, body text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m record;
begin
  select author_id, channel_id, deleted_at into m from community.messages where id = message;
  if m.channel_id is null or not community.is_member(m.channel_id) or m.deleted_at is not null then
    raise exception 'ไม่พบข้อความนี้' using errcode = 'P0002';
  end if;
  if m.author_id <> auth.uid() then
    raise exception 'แก้ได้เฉพาะข้อความของตัวเอง' using errcode = '42501';
  end if;
  if nullif(btrim(body), '') is null then raise exception 'ข้อความว่าง' using errcode = 'P0001'; end if;
  update community.messages set content = btrim(body), edited_at = now(), last_change = 'edit' where id = message;
end;
$$;

create function community.delete_message(message uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m record;
begin
  select author_id, channel_id, deleted_at into m from community.messages where id = message;
  if m.channel_id is null or not community.is_member(m.channel_id) or m.deleted_at is not null then
    raise exception 'ไม่พบข้อความนี้' using errcode = 'P0002';
  end if;
  if m.author_id <> auth.uid() and community.my_role(m.channel_id) <> 'MODERATOR' and not community.is_staff() then
    raise exception 'ลบได้เฉพาะข้อความของตัวเอง' using errcode = '42501';
  end if;
  update community.messages
  set deleted_at = now(), content = null, pinned_at = null, pinned_by = null, last_change = 'delete'
  where id = message;
end;
$$;

create function community.set_pin(message uuid, pinned boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m record;
  k text;
begin
  select channel_id, deleted_at into m from community.messages where id = message;
  if m.channel_id is null or not community.is_member(m.channel_id) or m.deleted_at is not null then
    raise exception 'ไม่พบข้อความนี้' using errcode = 'P0002';
  end if;
  select kind into k from community.channels where id = m.channel_id;
  if k not in ('DM', 'GROUP_DM') and community.my_role(m.channel_id) <> 'MODERATOR' and not community.is_staff() then
    raise exception 'ปักหมุดได้เฉพาะผู้ดูแลห้อง' using errcode = '42501';
  end if;
  if pinned and (select count(*) from community.messages where channel_id = m.channel_id and pinned_at is not null) >= 50 then
    raise exception 'ห้องนี้ปักหมุดครบ 50 ข้อความแล้ว — ถอนหมุดเก่าก่อน' using errcode = 'P0001';
  end if;
  update community.messages
  set pinned_at = case when pinned then now() end,
      pinned_by = case when pinned then auth.uid() end,
      last_change = case when pinned then 'pin' else 'unpin' end
  where id = message;
end;
$$;

-- ── reading ──────────────────────────────────────────────────────────────
-- messages with the reply-to preview the UI shows; RLS of messages applies (security invoker)
create view community.message_view with (security_invoker = true) as
select
  m.id, m.seq, m.channel_id, m.author_id, m.content, m.parent_id, m.reply_count,
  m.pinned_at, m.pinned_by, m.client_nonce, m.edited_at, m.created_at, m.forwarded, m.deleted_at,
  case when r.id is null then null else jsonb_build_object(
    'id', r.id,
    'authorCoreUserId', r.author_id,
    'preview', left(r.content, 120),
    'attachmentKind', null,
    'deleted', r.deleted_at is not null
  ) end as reply_to
from community.messages m
left join community.messages r on r.id = m.reply_to_id;
grant select on community.message_view to authenticated;

-- one row per channel in the shape the nexus inbox expects
create function community.channel_rows(only_channel uuid default null, max_rows int default 50, skip int default 0)
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
      select l.seq as last_seq, l.content as last_content, l.author_id as last_author, l.created_at as last_at
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
      'attachmentCount', 0, 'createdAt', e.last_at) end,
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
    'voiceOccupants', case when e.kind = 'VOICE' then '[]'::jsonb end,
    'createdAt', e.channel_created_at
  )
  from enriched e
  order by e.inbox_pinned_at desc nulls last, coalesce(e.last_at, e.channel_created_at) desc, e.channel_id desc
  limit least(greatest(max_rows, 1), 100) offset greatest(skip, 0);
$$;

create function community.reaction_summaries(kind text, targets uuid[])
returns table (target_id uuid, emoji text, count int, reacted_by_me boolean, first_at timestamptz)
language sql stable security invoker set search_path = ''
as $$
  select r.target_id, r.emoji, count(*)::int, bool_or(r.user_id = auth.uid()), min(r.created_at)
  from community.reactions r
  where r.target_kind = kind and r.target_id = any (targets)
  group by r.target_id, r.emoji
  order by r.target_id, min(r.created_at);
$$;

revoke all on function
  community.create_channel(text, text, text, text, int), community.open_direct(uuid[], text),
  community.update_channel(uuid, text, text), community.delete_channel(uuid),
  community.add_members(uuid, uuid[]), community.remove_member(uuid, uuid), community.leave_channel(uuid),
  community.update_inbox(uuid, text, boolean, boolean), community.set_nickname(uuid, uuid, text),
  community.mark_read(uuid, bigint), community.mark_unread(uuid), community.clear_channel(uuid),
  community.send_message(uuid, text, text, uuid, uuid, boolean), community.edit_message(uuid, text),
  community.delete_message(uuid), community.set_pin(uuid, boolean),
  community.require_member(uuid), community.require_user()
from public;
grant execute on function
  community.create_channel(text, text, text, text, int), community.open_direct(uuid[], text),
  community.update_channel(uuid, text, text), community.delete_channel(uuid),
  community.add_members(uuid, uuid[]), community.remove_member(uuid, uuid), community.leave_channel(uuid),
  community.update_inbox(uuid, text, boolean, boolean), community.set_nickname(uuid, uuid, text),
  community.mark_read(uuid, bigint), community.mark_unread(uuid), community.clear_channel(uuid),
  community.send_message(uuid, text, text, uuid, uuid, boolean), community.edit_message(uuid, text),
  community.delete_message(uuid), community.set_pin(uuid, boolean),
  community.channel_rows(uuid, int, int), community.reaction_summaries(text, uuid[]),
  community.require_member(uuid), community.require_user()
to authenticated;

-- ── realtime ─────────────────────────────────────────────────────────────
-- postgres_changes respects RLS: members receive their rooms' messages, nobody else
alter publication supabase_realtime add table community.messages, community.channel_members, community.channels;

-- private broadcast/presence topics: "room:<channel id>" for members, "online" for everyone signed in
create policy "room members use the room topic" on realtime.messages
  for select to authenticated
  using (
    realtime.topic() ~ '^room:[0-9a-f-]{36}$'
    and community.is_member(substring(realtime.topic() from 6)::uuid)
  );
create policy "room members send to the room topic" on realtime.messages
  for insert to authenticated
  with check (
    realtime.topic() ~ '^room:[0-9a-f-]{36}$'
    and community.is_member(substring(realtime.topic() from 6)::uuid)
  );
create policy "signed-in users share online presence" on realtime.messages
  for select to authenticated using (realtime.topic() = 'online' and extension = 'presence');
create policy "signed-in users publish online presence" on realtime.messages
  for insert to authenticated with check (realtime.topic() = 'online' and extension = 'presence');
