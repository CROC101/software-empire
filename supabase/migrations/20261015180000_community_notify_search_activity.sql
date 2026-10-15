-- Community round 5 (ported from csmju-nexus): notifications with per-person preferences,
-- an audit log (account history now, moderation in round 7), search, and "your activity".
--
-- Notifications come from triggers on the tables that change, not from each RPC: every write
-- path — RPC, direct insert, cascade — notifies the same way, and a failure to notify can never
-- undo the action (each trigger swallows its own errors).

-- ── notifications ────────────────────────────────────────────────────────
create table community.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'REEL_LIKE', 'REEL_COMMENT', 'POST_COMMENT', 'MENTION', 'VOICE_INVITE', 'FOLLOW', 'REACTION',
    'THREAD_REPLY', 'MEETING_INVITE', 'CHANNEL_INVITE', 'REEL_REPOST', 'STORY_REPLY', 'COMMENT_LIKE',
    'MISSED_CALL'
  )),
  ref_id text not null,
  actor_id uuid references auth.users (id) on delete set null,
  -- a snapshot at event time (camelCase keys), not a source of truth
  payload jsonb,
  -- written while notifications are paused: kept in the list, but no live pop-up
  silent boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on community.notifications (user_id, created_at desc);
create index on community.notifications (user_id, read_at) where read_at is null;

-- a missing row means every default below
create table community.notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  paused_until timestamptz,
  likes text not null default 'EVERYONE' check (likes in ('OFF', 'FOLLOWING', 'EVERYONE')),
  comments text not null default 'EVERYONE' check (comments in ('OFF', 'FOLLOWING', 'EVERYONE')),
  mentions text not null default 'EVERYONE' check (mentions in ('OFF', 'FOLLOWING', 'EVERYONE')),
  comment_likes boolean not null default true,
  new_followers boolean not null default true,
  reposts boolean not null default true,
  story_replies boolean not null default true,
  message_requests boolean not null default true,
  group_requests boolean not null default true,
  messages text not null default 'PRIMARY_GENERAL' check (messages in ('OFF', 'PRIMARY', 'PRIMARY_GENERAL')),
  updated_at timestamptz not null default now()
);
create trigger notification_preferences_touch before update on community.notification_preferences
  for each row execute function community.touch_updated_at();

-- Which inbox folder a DM/group sits in for one member — the same rule channel_rows uses for the
-- caller: a chat from someone you don't follow and never answered is a "request".
create function community.inbox_folder_of(member uuid, channel uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce(cm.inbox_folder, case
    when c.kind in ('DM', 'GROUP_DM')
      and other.id is not null and other.id <> member
      and not exists (select 1 from community.follows f where f.follower_id = member and f.followee_id = other.id)
      and not exists (select 1 from community.messages s where s.channel_id = channel and s.author_id = member)
    then 'REQUEST' else 'PRIMARY' end)
  from community.channel_members cm
  join community.channels c on c.id = cm.channel_id
  left join lateral (
    select coalesce(
      (select p.user_id from community.channel_members p
       where c.kind = 'DM' and p.channel_id = channel and p.user_id <> member limit 1),
      c.created_by) as id
  ) other on true
  where cm.channel_id = channel and cm.user_id = member;
$$;

create function community.is_muted(member uuid, channel uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select muted from community.channel_members where channel_id = channel and user_id = member), false);
$$;

-- The single write path. Skips yourself and anyone across a block; the recipient's preferences
-- decide whether a row is written at all, and a pause keeps it silent.
create function community.notify(recipient uuid, kind text, ref text, payload jsonb default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  p community.notification_preferences;
  allowed boolean;
  level text;
  channel uuid;
  folder text;
begin
  if recipient is null or recipient is not distinct from actor then return; end if;
  if actor is not null and community.is_blocked_either(recipient, actor) then return; end if;

  select * into p from community.notification_preferences where user_id = recipient;
  if p.user_id is null then p := row(recipient, null, 'EVERYONE', 'EVERYONE', 'EVERYONE',
    true, true, true, true, true, true, 'PRIMARY_GENERAL', now())::community.notification_preferences;
  end if;

  if kind in ('THREAD_REPLY', 'VOICE_INVITE', 'MISSED_CALL')
     or (kind = 'REACTION' and payload ->> 'targetKind' = 'MESSAGE') then
    channel := nullif(payload ->> 'channelId', '')::uuid;
    if channel is null then
      allowed := p.messages <> 'OFF';
    else
      folder := community.inbox_folder_of(recipient, channel);
      allowed := case
        when folder is null or folder = 'HIDDEN' then false
        when folder = 'REQUEST' then p.message_requests
        when folder = 'GENERAL' then p.messages = 'PRIMARY_GENERAL'
        else p.messages <> 'OFF'
      end;
    end if;
  elsif kind in ('REEL_LIKE', 'REACTION', 'REEL_COMMENT', 'POST_COMMENT', 'MENTION') then
    level := case
      when kind in ('REEL_LIKE', 'REACTION') then p.likes
      when kind = 'MENTION' then p.mentions
      else p.comments end;
    allowed := level = 'EVERYONE' or (level = 'FOLLOWING' and exists (
      select 1 from community.follows f where f.follower_id = recipient and f.followee_id = actor));
  else
    allowed := case kind
      when 'COMMENT_LIKE' then p.comment_likes
      when 'FOLLOW' then p.new_followers
      when 'REEL_REPOST' then p.reposts
      when 'STORY_REPLY' then p.story_replies
      when 'CHANNEL_INVITE' then p.group_requests
      else true -- MEETING_INVITE: always
    end;
  end if;
  if not coalesce(allowed, false) then return; end if;

  insert into community.notifications (user_id, kind, ref_id, actor_id, payload, silent)
  values (recipient, kind, ref, actor, payload, coalesce(p.paused_until > now(), false));
end;
$$;

-- ── who gets notified: one trigger per source table ──────────────────────
create function community.on_follow() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.notify(new.followee_id, 'FOLLOW', new.follower_id::text);
  return null;
exception when others then return null; -- never undo the follow over a notification
end;
$$;
create trigger notify_follow after insert on community.follows
  for each row execute function community.on_follow();

create function community.on_reel_like() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare r record;
begin
  select author_id, title into r from community.reels where id = new.reel_id;
  perform community.notify(r.author_id, 'REEL_LIKE', new.reel_id::text, jsonb_build_object('preview', r.title));
  return null;
exception when others then return null;
end;
$$;
create trigger notify_reel_like after insert on community.reel_likes
  for each row execute function community.on_reel_like();

create function community.on_reel_repost() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare r record;
begin
  select author_id, title into r from community.reels where id = new.reel_id;
  perform community.notify(r.author_id, 'REEL_REPOST', new.reel_id::text, jsonb_build_object('preview', r.title));
  return null;
exception when others then return null;
end;
$$;
create trigger notify_reel_repost after insert on community.reel_reposts
  for each row execute function community.on_reel_repost();

create function community.on_reel_comment() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  reel_author uuid;
  parent_author uuid;
  base jsonb;
begin
  select author_id into reel_author from community.reels where id = new.reel_id;
  base := jsonb_build_object('preview', left(new.content, 120), 'reelId', new.reel_id,
                             'commentId', new.id, 'parentId', new.parent_id);
  perform community.notify(reel_author, 'REEL_COMMENT', new.reel_id::text, base);
  if new.parent_id is not null then
    select author_id into parent_author from community.reel_comments where id = new.parent_id;
    if parent_author is distinct from reel_author then
      perform community.notify(parent_author, 'REEL_COMMENT', new.reel_id::text, base || '{"reply": true}');
    end if;
  end if;
  return null;
exception when others then return null;
end;
$$;
create trigger notify_reel_comment after insert on community.reel_comments
  for each row execute function community.on_reel_comment();

create function community.on_reel_comment_like() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare c record;
begin
  select author_id, reel_id, content into c from community.reel_comments where id = new.comment_id;
  perform community.notify(c.author_id, 'COMMENT_LIKE', c.reel_id::text,
    jsonb_build_object('reelId', c.reel_id, 'commentId', new.comment_id, 'preview', left(c.content, 120)));
  return null;
exception when others then return null;
end;
$$;
create trigger notify_comment_like after insert on community.reel_comment_likes
  for each row execute function community.on_reel_comment_like();

create function community.on_post_comment() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare p record;
begin
  select author_id, title into p from community.posts where id = new.post_id;
  perform community.notify(p.author_id, 'POST_COMMENT', new.post_id::text,
    jsonb_build_object('preview', left(new.content, 120), 'title', p.title));
  return null;
exception when others then return null;
end;
$$;
create trigger notify_post_comment after insert on community.post_comments
  for each row execute function community.on_post_comment();

create function community.on_reaction() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  owner uuid;
  context jsonb;
  m record;
begin
  if new.target_kind = 'POST' then
    select author_id, jsonb_build_object('preview', coalesce(nullif(title, ''), left(content, 80)))
    into owner, context from community.posts where id = new.target_id;
  elsif new.target_kind = 'REEL' then
    select author_id, jsonb_build_object('preview', title) into owner, context
    from community.reels where id = new.target_id;
  else
    select author_id, channel_id, content into m from community.messages where id = new.target_id;
    owner := m.author_id;
    if community.is_muted(owner, m.channel_id) then return null; end if;
    context := jsonb_build_object('channelId', m.channel_id, 'preview', left(m.content, 80));
  end if;
  perform community.notify(owner, 'REACTION', new.target_id::text,
    jsonb_build_object('targetKind', new.target_kind, 'emoji', new.emoji) || coalesce(context, '{}'));
  return null;
exception when others then return null;
end;
$$;
create trigger notify_reaction after insert on community.reactions
  for each row execute function community.on_reaction();

-- thread replies and @mentions (an @ followed by a member's id; @everyone/@channel/@here from a moderator)
create function community.on_message() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  parent_author uuid;
  broadcast boolean;
  target uuid;
  payload jsonb;
begin
  if new.parent_id is not null then
    select author_id into parent_author from community.messages where id = new.parent_id;
    if not community.is_muted(parent_author, new.channel_id) then
      perform community.notify(parent_author, 'THREAD_REPLY', new.parent_id::text,
        jsonb_build_object('channelId', new.channel_id));
    end if;
  end if;

  if new.content is not null and position('@' in new.content) > 0 then
    broadcast := new.content ~* '@(everyone|channel|here)\M'
      and exists (select 1 from community.channel_members
                  where channel_id = new.channel_id and user_id = new.author_id and role = 'MODERATOR');
    payload := jsonb_build_object('channelId', new.channel_id, 'preview', left(new.content, 120), 'broadcast', broadcast);
    for target in
      select cm.user_id from community.channel_members cm
      where cm.channel_id = new.channel_id and cm.user_id <> new.author_id and not cm.muted
        and (broadcast or cm.user_id in (
          select distinct m[1]::uuid
          from regexp_matches(new.content,
            '@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', 'gi') m
          limit 10))
    loop
      perform community.notify(target, 'MENTION', new.id::text, payload);
    end loop;
  end if;
  return null;
exception when others then return null;
end;
$$;
create trigger notify_message after insert on community.messages
  for each row execute function community.on_message();

-- reply_story marks the reply right after sending it
create function community.on_story_reply() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare author uuid;
begin
  select author_id into author from community.stories where id = new.embed_ref;
  perform community.notify(author, 'STORY_REPLY', new.embed_ref::text, jsonb_build_object(
    'storyId', new.embed_ref, 'channelId', new.channel_id, 'messageId', new.id,
    'replyKind', new.story_reply_kind, 'emoji', new.story_reply_emoji, 'preview', left(new.content, 120)));
  return null;
exception when others then return null;
end;
$$;
create trigger notify_story_reply after update of story_reply_kind on community.messages
  for each row when (old.story_reply_kind is null and new.story_reply_kind is not null and new.embed_kind = 'STORY')
  execute function community.on_story_reply();

-- being added to a group or room by someone else (a 1:1 DM is not an invitation)
create function community.on_member_added() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare c record;
begin
  select kind, name into c from community.channels where id = new.channel_id;
  if c.kind = 'DM' then return null; end if;
  perform community.notify(new.user_id, 'CHANNEL_INVITE', new.channel_id::text,
    jsonb_build_object('channelId', new.channel_id, 'kind', c.kind, 'name', c.name));
  return null;
exception when others then return null;
end;
$$;
create trigger notify_member_added after insert on community.channel_members
  for each row execute function community.on_member_added();

-- a new story pings followers — but only small audiences; past 50 the story ring does the job
create function community.on_story() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare follower uuid;
begin
  if (select count(*) from (select 1 from community.follows where followee_id = new.author_id limit 51) x) > 50 then
    return null;
  end if;
  for follower in select follower_id from community.follows where followee_id = new.author_id loop
    perform community.notify(follower, 'MENTION', new.id::text,
      jsonb_build_object('story', true, 'preview', new.caption));
  end loop;
  return null;
exception when others then return null;
end;
$$;
create trigger notify_story after insert on community.stories
  for each row execute function community.on_story();

create function community.mark_notification_read(notification uuid) returns int
language plpgsql security definer set search_path = ''
as $$
begin
  update community.notifications set read_at = coalesce(read_at, now())
  where id = notification and user_id = auth.uid();
  if not found then raise exception 'ไม่พบการแจ้งเตือนนี้' using errcode = 'P0002'; end if;
  return (select count(*) from community.notifications where user_id = auth.uid() and read_at is null);
end;
$$;

create function community.mark_all_notifications_read() returns int
language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  update community.notifications set read_at = now() where user_id = auth.uid() and read_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ── audit log ────────────────────────────────────────────────────────────
-- Who did what to which thing. Written only by triggers; owners read their own (account history),
-- staff read everything (round 7).
create table community.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_kind text,
  target_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on community.audit_logs (actor_id, created_at desc);
create index on community.audit_logs (action, created_at desc);

create function community.audit(action text, target_kind text, target_id text, metadata jsonb)
returns void
language sql security definer set search_path = ''
as $$
  insert into community.audit_logs (actor_id, action, target_kind, target_id, metadata)
  values (auth.uid(), action, target_kind, target_id, coalesce(metadata, '{}'));
$$;

create function community.on_profile_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.bio is distinct from old.bio then
    perform community.audit('profile.bio_change', 'USER', new.user_id::text, jsonb_build_object('new', new.bio));
  end if;
  if new.website is distinct from old.website then
    perform community.audit('profile.website_change', 'USER', new.user_id::text, jsonb_build_object('new', new.website));
  end if;
  if new.cover_asset_id is distinct from old.cover_asset_id then
    perform community.audit('profile.cover_change', 'USER', new.user_id::text,
      jsonb_build_object('removed', new.cover_asset_id is null));
  end if;
  return null;
end;
$$;
create trigger audit_profile after update on community.profiles
  for each row execute function community.on_profile_change();

create function community.on_content_delete() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform community.audit(tg_argv[0], tg_argv[1], old.id::text, jsonb_build_object(
    'author_core_user_id', old.author_id, 'by_moderator', auth.uid() is distinct from old.author_id));
  return null;
end;
$$;
create trigger audit_post_delete after delete on community.posts
  for each row execute function community.on_content_delete('post.delete', 'POST');
create trigger audit_reel_delete after delete on community.reels
  for each row execute function community.on_content_delete('reel.delete', 'REEL');
create trigger audit_story_delete after delete on community.stories
  for each row execute function community.on_content_delete('story.delete', 'STORY');

create function community.on_channel_create() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.kind <> 'DM' then
    perform community.audit('channel.create', 'CHANNEL', new.id::text,
      jsonb_build_object('name', new.name, 'kind', new.kind));
  end if;
  return null;
end;
$$;
create trigger audit_channel_create after insert on community.channels
  for each row execute function community.on_channel_create();

-- ── search ───────────────────────────────────────────────────────────────
-- Case-insensitive substring match, like nexus. Runs as the caller: RLS already hides blocked
-- people's posts, reels and profiles, and messages outside your rooms. kind=all returns up to 5
-- per kind; one kind pages normally. total = all matches of that kind.
create function community.search(q text, kind text default 'all', skip int default 0, max_rows int default 20)
returns table (hit_kind text, id text, title text, body text, author_id uuid, channel_id uuid,
               created_at timestamptz, total bigint)
language sql stable security invoker set search_path = ''
as $$
  with term as (
    select '%' || replace(replace(replace(btrim(search.q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as p
  ),
  hits as (
    select 'REEL' as k, r.id::text as hid, r.title as t, r.caption as b, r.author_id as a,
           null::uuid as ch, r.created_at as at
    from community.reels r, term
    where search.kind in ('all', 'reels') and (r.title ilike term.p or r.caption ilike term.p)
    union all
    select 'POST', p.id::text, p.title, p.content, p.author_id, null, p.created_at
    from community.posts p, term
    where search.kind in ('all', 'posts')
      and (p.title ilike term.p or p.content ilike term.p or p.course_tag ilike term.p)
    union all
    select 'PERSON', pr.user_id::text, pr.display_name, null, pr.user_id, null, null
    from community.profiles pr, term
    where search.kind in ('all', 'people') and pr.display_name ilike term.p
    union all
    select 'MESSAGE', m.id::text,
           coalesce(c.name, case c.kind when 'DM' then 'แชทส่วนตัว' when 'GROUP_DM' then 'แชทกลุ่ม' else 'ห้องแชท' end),
           m.content, m.author_id, m.channel_id, m.created_at
    from community.messages m
    join community.channels c on c.id = m.channel_id
    join community.channel_members cm on cm.channel_id = m.channel_id and cm.user_id = auth.uid()
    cross join term
    where search.kind in ('all', 'messages') and m.deleted_at is null and m.content ilike term.p
      -- a cleared chat stays cleared in search too
      and (cm.cleared_at is null or m.created_at > cm.cleared_at)
  ),
  ranked as (
    select h.*, count(*) over (partition by h.k) as n,
           row_number() over (partition by h.k order by h.at desc nulls last, h.t, h.hid) as rn
    from hits h
  )
  select k, hid, t, b, a, ch, at, n from ranked
  where (search.kind = 'all' and rn <= 5)
     or (search.kind <> 'all' and rn > greatest(search.skip, 0) and rn <= greatest(search.skip, 0) + least(greatest(search.max_rows, 1), 100))
  order by array_position(array['REEL', 'POST', 'PERSON', 'MESSAGE'], k), rn;
$$;

-- ── your activity ────────────────────────────────────────────────────────
create view community.my_comments with (security_invoker = true) as
select c.id, 'REEL' as target_kind, c.reel_id as target_id, r.title as target_title,
       r.author_id as target_author_id, c.content, c.created_at
from community.reel_comments c join community.reels r on r.id = c.reel_id
where c.author_id = auth.uid() and c.deleted_at is null
union all
select c.id, 'POST', c.post_id, coalesce(nullif(p.title, ''), left(p.content, 80)), p.author_id, c.content, c.created_at
from community.post_comments c join community.posts p on p.id = c.post_id
where c.author_id = auth.uid() and c.deleted_at is null;

-- one row per post: the latest emoji you left on it
create view community.my_post_reactions with (security_invoker = true) as
select distinct on (r.target_id)
  r.target_id as post_id, r.emoji, r.created_at as reacted_at,
  p.title, p.content, p.author_id, p.media
from community.reactions r
join community.post_view p on p.id = r.target_id
where r.target_kind = 'POST' and r.user_id = auth.uid()
order by r.target_id, r.created_at desc;

-- ── row level security ───────────────────────────────────────────────────
alter table community.notifications enable row level security;
alter table community.notification_preferences enable row level security;
alter table community.audit_logs enable row level security;

create policy "your notifications" on community.notifications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "your preferences" on community.notification_preferences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "your own history; staff see all" on community.audit_logs
  for select to authenticated using ((select auth.uid()) = actor_id or community.is_staff());

grant select on community.notifications, community.audit_logs to authenticated;
grant select, insert, update on community.notification_preferences to authenticated;
grant select on community.my_comments, community.my_post_reactions to authenticated;
grant all on community.notifications, community.notification_preferences, community.audit_logs to service_role;

revoke all on function
  community.inbox_folder_of(uuid, uuid), community.is_muted(uuid, uuid),
  community.notify(uuid, text, text, jsonb), community.audit(text, text, text, jsonb),
  community.mark_notification_read(uuid), community.mark_all_notifications_read(),
  community.search(text, text, int, int)
from public;
grant execute on function
  community.mark_notification_read(uuid), community.mark_all_notifications_read(),
  community.search(text, text, int, int)
to authenticated;

-- live notifications: postgres_changes respects RLS, so each person hears only their own
alter publication supabase_realtime add table community.notifications;
