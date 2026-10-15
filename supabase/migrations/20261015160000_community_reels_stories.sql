-- Community round 4 (ported from csmju-nexus): reels (likes · reposts · views · threaded
-- comments), 24-hour stories with viewers and DM replies, profile highlights, notes, and
-- post/reel/story cards shared into chat. Counters move only inside the RPCs that change them.

-- ── reels ─────────────────────────────────────────────────────────────────
create table community.reels (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  caption text check (char_length(caption) <= 2000),
  -- deleting the file deletes the reel (delete_reel removes the asset row)
  asset_id uuid not null unique references community.assets (id) on delete cascade,
  -- ≤ 60 s keeps egress inside the free tier
  duration_ms int not null check (duration_ms between 1000 and 60000),
  like_count int not null default 0,
  view_count int not null default 0,
  repost_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on community.reels (created_at desc, id desc);
create index on community.reels (author_id, created_at desc);

create table community.reel_likes (
  reel_id uuid not null references community.reels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
create index on community.reel_likes (user_id, created_at desc);

create table community.reel_reposts (
  reel_id uuid not null references community.reels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
create index on community.reel_reposts (user_id, created_at desc);

-- one row per person: views count people, not plays, so refreshing can't inflate them
create table community.reel_views (
  reel_id uuid not null references community.reels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

create table community.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references community.reels (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  -- one level deep, like Instagram (enforced in add_reel_comment)
  parent_id uuid references community.reel_comments (id) on delete cascade,
  like_count int not null default 0,
  reply_count int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index on community.reel_comments (reel_id, created_at desc);
create index on community.reel_comments (parent_id, created_at);
create index on community.reel_comments (author_id, created_at desc);

create table community.reel_comment_likes (
  comment_id uuid not null references community.reel_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ── stories · highlights · notes ─────────────────────────────────────────
create table community.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  asset_id uuid not null unique references community.assets (id) on delete cascade,
  caption text check (char_length(caption) <= 300),
  -- fixed at posting time, so changing the TTL later never stretches old stories
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);
create index on community.stories (author_id, created_at);
create index on community.stories (expires_at);

create table community.story_views (
  story_id uuid not null references community.stories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, user_id)
);
create index on community.story_views (user_id);

create table community.highlights (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 40),
  cover_story_id uuid references community.stories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on community.highlights (owner_id, created_at desc);
create trigger highlights_touch before update on community.highlights
  for each row execute function community.touch_updated_at();

create table community.highlight_items (
  highlight_id uuid not null references community.highlights (id) on delete cascade,
  story_id uuid not null references community.stories (id) on delete cascade,
  position int not null check (position between 0 and 99),
  primary key (highlight_id, story_id)
);
create index on community.highlight_items (story_id);

-- one note per person; posting again replaces it and restarts the 24 hours
create table community.notes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 60),
  audience text not null default 'MUTUAL_FOLLOWERS' check (audience in ('MUTUAL_FOLLOWERS', 'CLOSE_FRIENDS')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index on community.notes (expires_at);

-- ── cards in chat: shared posts/reels/stories and story replies ──────────
alter table community.messages
  add column embed_kind text check (embed_kind in ('POST', 'REEL', 'STORY')),
  add column embed_ref uuid,
  add column story_reply_kind text check (story_reply_kind in ('REPLY', 'REACTION')),
  add column story_reply_emoji text check (char_length(story_reply_emoji) <= 32),
  add constraint messages_embed_pair check ((embed_kind is null) = (embed_ref is null));
create index on community.messages (embed_kind, embed_ref) where embed_kind is not null;

-- ── visibility ───────────────────────────────────────────────────────────
create function community.can_see_reel(reel uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from community.reels r
    where r.id = reel and not community.is_blocked_either(auth.uid(), r.author_id)
  );
$$;

-- yours · live and you follow the author · or kept on a highlight (outside blocks)
create function community.can_see_story(story uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from community.stories s
    where s.id = story and (
      s.author_id = auth.uid()
      or (
        not community.is_blocked_either(auth.uid(), s.author_id)
        and (
          (s.expires_at > now() and exists (
            select 1 from community.follows f where f.follower_id = auth.uid() and f.followee_id = s.author_id))
          or exists (select 1 from community.highlight_items hi where hi.story_id = s.id)
        )
      )
    )
  );
$$;

-- Instagram's note audiences, decided by the relationship at read time
create function community.can_see_note(owner uuid, audience text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select owner = auth.uid() or (
    not community.is_blocked_either(auth.uid(), owner)
    and case audience
      when 'MUTUAL_FOLLOWERS' then
        exists (select 1 from community.follows where follower_id = auth.uid() and followee_id = owner)
        and exists (select 1 from community.follows where follower_id = owner and followee_id = auth.uid())
      when 'CLOSE_FRIENDS' then
        exists (select 1 from community.close_friends where owner_id = owner and friend_id = auth.uid())
      else false
    end
  );
$$;

create or replace function community.asset_in_use(asset uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from community.post_media where asset_id = asset)
      or exists (select 1 from community.assets where id = asset and message_id is not null)
      or exists (select 1 from community.profiles where cover_asset_id = asset)
      or exists (select 1 from community.reels where asset_id = asset)
      or exists (select 1 from community.stories where asset_id = asset);
$$;

create or replace function community.can_read_asset(asset uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from community.assets a
    where a.id = asset and a.status = 'READY' and (
      a.owner_id = auth.uid()
      or exists (
        select 1 from community.post_media pm join community.posts p on p.id = pm.post_id
        where pm.asset_id = a.id and not community.is_blocked_either(auth.uid(), p.author_id)
      )
      or exists (
        select 1 from community.messages m
        where m.id = a.message_id and m.deleted_at is null and community.is_member(m.channel_id)
      )
      or exists (
        select 1 from community.profiles pr
        where pr.cover_asset_id = a.id and not community.is_blocked_either(auth.uid(), pr.user_id)
      )
      or exists (select 1 from community.reels r where r.asset_id = a.id and community.can_see_reel(r.id))
      or exists (select 1 from community.stories s where s.asset_id = a.id and community.can_see_story(s.id))
    )
  );
$$;

create or replace function community.can_see_target(kind text, target uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select case kind
    when 'MESSAGE' then exists (
      select 1 from community.messages m
      join community.channel_members cm on cm.channel_id = m.channel_id and cm.user_id = auth.uid()
      where m.id = target and m.deleted_at is null
    )
    when 'POST' then exists (
      select 1 from community.posts p
      where p.id = target and not community.is_blocked_either(auth.uid(), p.author_id)
    )
    when 'REEL' then community.can_see_reel(target)
    when 'STORY' then community.can_see_story(target)
    else false
  end;
$$;

-- ── messages: send with an optional card ─────────────────────────────────
drop function community.send_message(uuid, text, text, uuid, uuid, boolean, uuid[]);
create function community.send_message(
  channel uuid, body text, nonce text, parent uuid default null, reply_to uuid default null,
  is_forward boolean default false, attachments uuid[] default null,
  embed_kind text default null, embed_ref uuid default null
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

  if text_body is null and coalesce(cardinality(attachments), 0) = 0 and embed_kind is null then
    raise exception 'ข้อความว่าง' using errcode = 'P0001';
  end if;
  if (embed_kind is null) <> (embed_ref is null) then
    raise exception 'การ์ดที่แชร์ต้องระบุทั้งชนิดและรหัส' using errcode = 'P0001';
  end if;
  -- you can only share what you can see; 404 either way so ids can't be probed
  if embed_kind is not null and not community.can_see_target(embed_kind, embed_ref) then
    raise exception 'ไม่พบสิ่งที่จะแชร์' using errcode = 'P0002';
  end if;
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
  perform community.claim_assets(attachments, array['IMAGE', 'VIDEO', 'AUDIO', 'CODE', 'DOCUMENT', 'ARCHIVE']);

  insert into community.messages (channel_id, author_id, content, client_nonce, parent_id, reply_to_id, forwarded,
                                  embed_kind, embed_ref)
  values (channel, me, text_body, nonce, parent, reply_to, is_forward, embed_kind, embed_ref)
  returning messages.id into new_id;
  update community.assets set message_id = new_id where id = any (attachments);

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
  m.embed_kind, m.embed_ref, m.story_reply_kind, m.story_reply_emoji
from community.messages m
left join community.messages r on r.id = m.reply_to_id;

-- ── reels: write paths ───────────────────────────────────────────────────
create function community.create_reel(title text, asset uuid, duration_ms int, caption text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  t text := btrim(coalesce(title, ''));
  c text := nullif(btrim(coalesce(caption, '')), '');
  new_id uuid;
begin
  if char_length(t) not between 1 and 120 then
    raise exception 'ชื่อคลิปต้องยาว 1-120 ตัวอักษร' using errcode = 'P0001';
  end if;
  if char_length(c) > 2000 then raise exception 'คำบรรยายยาวได้ไม่เกิน 2000 ตัวอักษร' using errcode = 'P0001'; end if;
  if duration_ms is null or duration_ms < 1000 then
    raise exception 'คลิปต้องยาวกว่า 1 วินาที' using errcode = 'P0001';
  end if;
  if duration_ms > 60000 then raise exception 'คลิปยาวได้ไม่เกิน 60 วินาที' using errcode = 'P0001'; end if;
  perform community.claim_assets(array[asset], array['VIDEO']);
  insert into community.reels (author_id, title, caption, asset_id, duration_ms)
  values (me, t, c, asset, create_reel.duration_ms) returning id into new_id;
  return new_id;
end;
$$;

-- returns the video's object path so the app can remove the bytes
create function community.delete_reel(reel uuid) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  path text;
begin
  select author_id, asset_id into r from community.reels where id = reel;
  if r.author_id is null or not community.can_see_reel(reel) then
    raise exception 'ไม่พบคลิปนี้' using errcode = 'P0002';
  end if;
  if r.author_id <> auth.uid() and not community.is_staff() then
    raise exception 'ลบได้เฉพาะคลิปของตัวเอง' using errcode = '42501';
  end if;
  -- the asset's cascade takes the reel, its likes, views, reposts and comments with it
  delete from community.assets where id = r.asset_id returning object_path into path;
  delete from community.reactions where target_kind = 'REEL' and target_id = reel;
  return path;
end;
$$;

create function community.require_reel(reel uuid) returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  author uuid;
begin
  select author_id into author from community.reels where id = reel;
  if author is null or community.is_blocked_either(auth.uid(), author) then
    raise exception 'ไม่พบคลิปนี้' using errcode = 'P0002';
  end if;
  return author;
end;
$$;

-- pressing twice never counts twice: the counter moves only when the row really changed
create function community.like_reel(reel uuid, liked boolean) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  changed int;
  total int;
begin
  perform community.require_reel(reel);
  if liked then
    insert into community.reel_likes (reel_id, user_id) values (reel, me) on conflict do nothing;
  else
    delete from community.reel_likes where reel_id = reel and user_id = me;
  end if;
  get diagnostics changed = row_count;
  update community.reels
  set like_count = greatest(like_count + case when liked then changed else -changed end, 0)
  where id = reel returning like_count into total;
  return total;
end;
$$;

create function community.repost_reel(reel uuid, reposted boolean) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  author uuid := community.require_reel(reel);
  changed int;
  total int;
begin
  if reposted and author = me then
    raise exception 'รีโพสต์คลิปของตัวเองไม่ได้' using errcode = 'P0001';
  end if;
  if reposted then
    insert into community.reel_reposts (reel_id, user_id) values (reel, me) on conflict do nothing;
  else
    delete from community.reel_reposts where reel_id = reel and user_id = me;
  end if;
  get diagnostics changed = row_count;
  update community.reels
  set repost_count = greatest(repost_count + case when reposted then changed else -changed end, 0)
  where id = reel returning repost_count into total;
  return total;
end;
$$;

create function community.view_reel(reel uuid) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  changed int;
  total int;
begin
  perform community.require_reel(reel);
  insert into community.reel_views (reel_id, user_id) values (reel, me) on conflict do nothing;
  get diagnostics changed = row_count;
  update community.reels set view_count = view_count + changed where id = reel returning view_count into total;
  return total;
end;
$$;

create function community.add_reel_comment(reel uuid, body text, parent uuid default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  author uuid := community.require_reel(reel);
  text_body text := btrim(coalesce(body, ''));
  p record;
  new_id uuid;
begin
  if not community.can_comment(author) then
    raise exception 'เจ้าของคลิปจำกัดว่าใครแสดงความคิดเห็นได้ คุณจึงคอมเมนต์คลิปนี้ไม่ได้' using errcode = '42501';
  end if;
  if char_length(text_body) not between 1 and 1000 then
    raise exception 'ความคิดเห็นต้องยาว 1-1000 ตัวอักษร' using errcode = 'P0001';
  end if;
  if (select count(*) from community.reel_comments
      where author_id = me and created_at > now() - interval '10 seconds') >= 10 then
    raise exception 'แสดงความคิดเห็นถี่เกินไป รอสักครู่แล้วลองใหม่' using errcode = 'P0001';
  end if;
  if parent is not null then
    select id, parent_id into p from community.reel_comments
    where id = parent and reel_id = reel and deleted_at is null;
    if p.id is null then raise exception 'ไม่พบความคิดเห็นที่จะตอบกลับ' using errcode = 'P0002'; end if;
    if p.parent_id is not null then
      raise exception 'ตอบคำตอบซ้อนไม่ได้ — ตอบที่ความคิดเห็นต้นเรื่องแทน' using errcode = 'P0001';
    end if;
  end if;
  insert into community.reel_comments (reel_id, author_id, content, parent_id)
  values (reel, me, text_body, parent) returning id into new_id;
  if parent is not null then
    update community.reel_comments set reply_count = reply_count + 1 where id = parent;
  end if;
  return new_id;
end;
$$;

create function community.like_reel_comment(comment uuid, liked boolean) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  reel uuid;
  changed int;
  total int;
begin
  select reel_id into reel from community.reel_comments where id = comment and deleted_at is null;
  if reel is null then raise exception 'ไม่พบความคิดเห็นนี้' using errcode = 'P0002'; end if;
  perform community.require_reel(reel);
  if liked then
    insert into community.reel_comment_likes (comment_id, user_id) values (comment, me) on conflict do nothing;
  else
    delete from community.reel_comment_likes where comment_id = comment and user_id = me;
  end if;
  get diagnostics changed = row_count;
  update community.reel_comments
  set like_count = greatest(like_count + case when liked then changed else -changed end, 0)
  where id = comment returning like_count into total;
  return total;
end;
$$;

-- a top-level comment takes its replies with it; a reply gives back its parent's count
create function community.delete_reel_comment(comment uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  c record;
begin
  select author_id, parent_id into c from community.reel_comments where id = comment and deleted_at is null;
  if c.author_id is null then raise exception 'ไม่พบความคิดเห็นนี้' using errcode = 'P0002'; end if;
  if c.author_id <> auth.uid() and not community.is_staff() then
    raise exception 'ลบได้เฉพาะความคิดเห็นของตัวเอง' using errcode = '42501';
  end if;
  update community.reel_comments set deleted_at = now() where id = comment;
  if c.parent_id is not null then
    update community.reel_comments set reply_count = greatest(reply_count - 1, 0) where id = c.parent_id;
  else
    update community.reel_comments set deleted_at = now() where parent_id = comment and deleted_at is null;
  end if;
end;
$$;

-- ── stories: write paths ─────────────────────────────────────────────────
create function community.create_story(asset uuid, caption text default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  c text := nullif(btrim(coalesce(caption, '')), '');
  new_id uuid;
begin
  if char_length(c) > 300 then raise exception 'คำบรรยายยาวได้ไม่เกิน 300 ตัวอักษร' using errcode = 'P0001'; end if;
  if (select count(*) from community.stories where author_id = me and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'ลงสตอรี่ถี่เกินไป รอสักครู่แล้วลองใหม่' using errcode = 'P0001';
  end if;
  perform community.claim_assets(array[asset], array['IMAGE', 'VIDEO']);
  insert into community.stories (author_id, asset_id, caption) values (me, asset, c) returning id into new_id;
  return new_id;
end;
$$;

create function community.delete_story(story uuid) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
  path text;
begin
  select author_id, asset_id into s from community.stories where id = story;
  if s.author_id is null or not community.can_see_story(story) then
    raise exception 'ไม่พบสตอรี่นี้' using errcode = 'P0002';
  end if;
  if s.author_id <> auth.uid() and not community.is_staff() then
    raise exception 'ลบได้เฉพาะสตอรี่ของตัวเอง' using errcode = '42501';
  end if;
  delete from community.assets where id = s.asset_id returning object_path into path;
  -- a highlight circle that opens onto nothing looks broken, so empty ones go too
  delete from community.highlights h
  where h.owner_id = s.author_id and not exists (select 1 from community.highlight_items i where i.highlight_id = h.id);
  return path;
end;
$$;

-- the count is the owner's business; everyone else gets 0
create function community.view_story(story uuid) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  author uuid;
begin
  select author_id into author from community.stories where id = story;
  if author is null or not community.can_see_story(story) then
    raise exception 'ไม่พบสตอรี่นี้ หรือหมดอายุไปแล้ว' using errcode = 'P0002';
  end if;
  insert into community.story_views (story_id, user_id) values (story, me) on conflict do nothing;
  return case when author = me then (select count(*)::int from community.story_views where story_id = story) else 0 end;
end;
$$;

-- A reply (typed or an emoji) is a DM to the author carrying the story card, like Instagram.
create function community.reply_story(story uuid, body text default null, emoji text default null)
returns table (channel uuid, message uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  s record;
  text_body text := nullif(btrim(coalesce(body, '')), '');
  e text := nullif(btrim(coalesce(emoji, '')), '');
  room uuid;
  sent uuid;
begin
  if (text_body is null) = (e is null) then
    raise exception 'ส่งข้อความตอบ หรืออิโมจิ อย่างใดอย่างหนึ่ง' using errcode = 'P0001';
  end if;
  if e is not null and (char_length(e) > 16 or e ~ '[[:alnum:][:space:]]') then
    raise exception 'อิโมจิไม่ถูกต้อง' using errcode = 'P0001';
  end if;
  select author_id, expires_at into s from community.stories where id = story;
  if s.author_id is null or s.expires_at <= now() or not community.can_see_story(story) then
    raise exception 'ไม่พบสตอรี่นี้ หรือหมดอายุไปแล้ว' using errcode = 'P0002';
  end if;
  if s.author_id = me then raise exception 'ตอบสตอรี่ของตัวเองไม่ได้' using errcode = 'P0001'; end if;

  room := community.open_direct(array[s.author_id]);
  sent := community.send_message(room, coalesce(text_body, e), gen_random_uuid()::text,
                                 embed_kind => 'STORY', embed_ref => story);
  update community.messages
  set story_reply_kind = case when e is null then 'REPLY' else 'REACTION' end, story_reply_emoji = e
  where id = sent;
  return query select room, sent;
end;
$$;

create function community.story_insights(story uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  author uuid;
begin
  select author_id into author from community.stories where id = story;
  if author is null then raise exception 'ไม่พบสตอรี่นี้' using errcode = 'P0002'; end if;
  if author <> auth.uid() then raise exception 'ดูสถิติได้เฉพาะสตอรี่ของตัวเอง' using errcode = '42501'; end if;
  return jsonb_build_object(
    'viewCount', (select count(*) from community.story_views where story_id = story),
    'replyCount', (select count(*) from community.messages
                   where embed_kind = 'STORY' and embed_ref = story and story_reply_kind = 'REPLY' and deleted_at is null),
    'reactionCounts', coalesce((
      select jsonb_object_agg(story_reply_emoji, n) from (
        select story_reply_emoji, count(*) as n from community.messages
        where embed_kind = 'STORY' and embed_ref = story and story_reply_kind = 'REACTION'
          and deleted_at is null and story_reply_emoji is not null
        group by story_reply_emoji) x
    ), '{}'::jsonb)
  );
end;
$$;

-- only your own stories go on your highlights; the cover must be one of them
create function community.check_highlight(title text, story_ids uuid[], cover uuid) returns void
language plpgsql stable security definer set search_path = ''
as $$
declare
  n int := coalesce(cardinality(story_ids), 0);
begin
  if title is not null and char_length(btrim(title)) not between 1 and 40 then
    raise exception 'ชื่อไฮไลต์ต้องยาว 1-40 ตัวอักษร' using errcode = 'P0001';
  end if;
  if story_ids is not null then
    if n not between 1 and 100 then
      raise exception 'ไฮไลต์ต้องมีสตอรี่ 1-100 ชิ้น' using errcode = 'P0001';
    end if;
    if (select count(distinct x) from unnest(story_ids) x) <> n then
      raise exception 'มีสตอรี่ซ้ำกัน' using errcode = 'P0001';
    end if;
    if (select count(*) from community.stories where id = any (story_ids)) <> n then
      raise exception 'ไม่พบสตอรี่บางชิ้น อาจถูกลบไปแล้ว' using errcode = 'P0002';
    end if;
    if exists (select 1 from community.stories where id = any (story_ids) and author_id <> auth.uid()) then
      raise exception 'ใส่ได้เฉพาะสตอรี่ของตัวเองในไฮไลต์' using errcode = '42501';
    end if;
  end if;
  if cover is not null and story_ids is not null and not cover = any (story_ids) then
    raise exception 'หน้าปกต้องเป็นสตอรี่ที่อยู่ในไฮไลต์นี้' using errcode = 'P0001';
  end if;
end;
$$;

create function community.create_highlight(title text, story_ids uuid[], cover uuid default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  new_id uuid;
begin
  if title is null or story_ids is null then
    raise exception 'ต้องมีชื่อไฮไลต์และสตอรี่อย่างน้อยหนึ่งชิ้น' using errcode = 'P0001';
  end if;
  perform community.check_highlight(title, story_ids, cover);
  insert into community.highlights (owner_id, title, cover_story_id) values (me, btrim(title), cover)
  returning id into new_id;
  insert into community.highlight_items (highlight_id, story_id, position)
  select new_id, x.story, x.ord - 1 from unnest(story_ids) with ordinality as x (story, ord);
  return new_id;
end;
$$;

-- null arguments keep what's there; set_cover with cover null resets the cover to the first story
create function community.update_highlight(
  highlight uuid, title text default null, story_ids uuid[] default null,
  cover uuid default null, set_cover boolean default false
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  owner uuid;
  current_cover uuid;
  final_ids uuid[];
begin
  select owner_id, cover_story_id into owner, current_cover from community.highlights where id = highlight;
  if owner is null or community.is_blocked_either(auth.uid(), owner) then
    raise exception 'ไม่พบไฮไลต์นี้' using errcode = 'P0002';
  end if;
  if owner <> auth.uid() then raise exception 'แก้ได้เฉพาะไฮไลต์ของตัวเอง' using errcode = '42501'; end if;
  if title is null and story_ids is null and not set_cover then
    raise exception 'ไม่มีอะไรให้แก้' using errcode = 'P0001';
  end if;
  final_ids := coalesce(story_ids, array(
    select i.story_id from community.highlight_items i where i.highlight_id = highlight order by i.position));
  perform community.check_highlight(title, story_ids, null);
  if set_cover then
    if cover is not null and not cover = any (final_ids) then
      raise exception 'หน้าปกต้องเป็นสตอรี่ที่อยู่ในไฮไลต์นี้' using errcode = 'P0001';
    end if;
    current_cover := cover;
  elsif current_cover is not null and not current_cover = any (final_ids) then
    -- the old cover left the highlight: fall back to the first story
    current_cover := null;
  end if;
  if story_ids is not null then
    delete from community.highlight_items where highlight_id = highlight;
    insert into community.highlight_items (highlight_id, story_id, position)
    select highlight, x.story, x.ord - 1 from unnest(story_ids) with ordinality as x (story, ord);
  end if;
  update community.highlights
  set title = coalesce(btrim(update_highlight.title), highlights.title), cover_story_id = current_cover
  where id = highlight;
end;
$$;

create function community.put_note(body text, audience text default 'MUTUAL_FOLLOWERS') returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  t text := btrim(coalesce(body, ''));
begin
  if char_length(t) not between 1 and 60 then
    raise exception 'โน้ตต้องยาว 1-60 ตัวอักษร (ไม่นับช่องว่างหัวท้าย)' using errcode = 'P0001';
  end if;
  if audience is null or audience not in ('MUTUAL_FOLLOWERS', 'CLOSE_FRIENDS') then
    raise exception 'audience ต้องเป็น MUTUAL_FOLLOWERS หรือ CLOSE_FRIENDS' using errcode = 'P0001';
  end if;
  insert into community.notes (user_id, text, audience)
  values (me, t, put_note.audience)
  on conflict (user_id) do update
  set text = excluded.text, audience = excluded.audience,
      created_at = now(), expires_at = now() + interval '24 hours';
end;
$$;

-- ── reading ──────────────────────────────────────────────────────────────
create view community.reel_view with (security_invoker = true) as
select
  r.id, r.author_id, r.title, r.caption, r.asset_id, r.duration_ms,
  r.like_count, r.view_count, r.repost_count, r.created_at,
  exists (select 1 from community.reel_likes l where l.reel_id = r.id and l.user_id = auth.uid()) as liked_by_me,
  exists (select 1 from community.reel_reposts x where x.reel_id = r.id and x.user_id = auth.uid()) as reposted_by_me,
  (select count(*)::int from community.reel_comments c where c.reel_id = r.id and c.deleted_at is null) as comment_count,
  community.can_comment(r.author_id) as can_comment,
  a.object_path as video_path
from community.reels r
join community.assets a on a.id = r.asset_id;

create view community.reel_comment_view with (security_invoker = true) as
select
  c.id, c.reel_id, c.author_id, c.content, c.parent_id, c.reply_count, c.like_count, c.created_at,
  exists (select 1 from community.reel_comment_likes l where l.comment_id = c.id and l.user_id = auth.uid()) as liked_by_me
from community.reel_comments c;

create view community.story_feed with (security_invoker = true) as
select
  s.id, s.author_id, s.asset_id, s.caption, s.created_at, s.expires_at,
  a.kind, a.object_path as path,
  exists (select 1 from community.story_views v where v.story_id = s.id and v.user_id = auth.uid()) as viewed_by_me,
  case when s.author_id = auth.uid()
    then (select count(*)::int from community.story_views v where v.story_id = s.id) else 0 end as view_count
from community.stories s
join community.assets a on a.id = s.asset_id;

create view community.highlight_view with (security_invoker = true) as
select
  h.id, h.owner_id, h.title, h.cover_story_id, h.created_at, h.updated_at,
  (select count(*)::int from community.highlight_items i where i.highlight_id = h.id) as item_count,
  cov.kind as cover_kind, cov.path as cover_path
from community.highlights h
left join lateral (
  select f.kind, f.path from community.story_feed f
  where f.id = coalesce(h.cover_story_id, (
    select i.story_id from community.highlight_items i where i.highlight_id = h.id order by i.position limit 1))
) cov on true;

create or replace view community.bookmark_view with (security_invoker = true) as
select
  b.user_id, b.target_kind, b.target_id, b.created_at,
  coalesce(nullif(p.title, ''), nullif(left(p.content, 80), ''), r.title) as title,
  coalesce(p.author_id, r.author_id) as author_id
from community.bookmarks b
left join community.posts p on b.target_kind = 'POST' and p.id = b.target_id
left join community.reels r on b.target_kind = 'REEL' and r.id = b.target_id;

-- ── row level security ───────────────────────────────────────────────────
alter table community.reels enable row level security;
alter table community.reel_likes enable row level security;
alter table community.reel_reposts enable row level security;
alter table community.reel_views enable row level security;
alter table community.reel_comments enable row level security;
alter table community.reel_comment_likes enable row level security;
alter table community.stories enable row level security;
alter table community.story_views enable row level security;
alter table community.highlights enable row level security;
alter table community.highlight_items enable row level security;
alter table community.notes enable row level security;

create policy "reels outside blocks" on community.reels
  for select to authenticated using (not community.is_blocked_either((select auth.uid()), author_id));
create policy "own reel likes" on community.reel_likes
  for select to authenticated using ((select auth.uid()) = user_id);
-- a profile's reposts tab is public, minus blocks either way
create policy "reposts outside blocks" on community.reel_reposts
  for select to authenticated
  using (
    not community.is_blocked_either((select auth.uid()), user_id)
    and exists (select 1 from community.reels r where r.id = reel_id)
  );
create policy "own reel views" on community.reel_views
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "live reel comments outside blocks" on community.reel_comments
  for select to authenticated
  using (
    deleted_at is null
    and not community.is_blocked_either((select auth.uid()), author_id)
    and exists (select 1 from community.reels r where r.id = reel_id)
  );
create policy "own comment likes" on community.reel_comment_likes
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "stories you may see" on community.stories
  for select to authenticated using (community.can_see_story(id));
create policy "your views, and who viewed your stories" on community.story_views
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (select 1 from community.stories s where s.id = story_id and s.author_id = (select auth.uid()))
  );
create policy "highlights outside blocks" on community.highlights
  for select to authenticated using (not community.is_blocked_either((select auth.uid()), owner_id));
create policy "owner deletes own highlights" on community.highlights
  for delete to authenticated using ((select auth.uid()) = owner_id);
create policy "items of visible highlights" on community.highlight_items
  for select to authenticated
  using (exists (select 1 from community.highlights h where h.id = highlight_id));

create policy "live notes for their audience" on community.notes
  for select to authenticated
  using (expires_at > now() and community.can_see_note(user_id, audience));
create policy "owner removes own note" on community.notes
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select on community.reels, community.reel_likes, community.reel_reposts, community.reel_views,
  community.reel_comments, community.reel_comment_likes, community.stories, community.story_views,
  community.highlights, community.highlight_items, community.notes to authenticated;
grant delete on community.highlights, community.notes to authenticated;
grant select on community.reel_view, community.reel_comment_view, community.story_feed,
  community.highlight_view to authenticated;
grant all on community.reels, community.reel_likes, community.reel_reposts, community.reel_views,
  community.reel_comments, community.reel_comment_likes, community.stories, community.story_views,
  community.highlights, community.highlight_items, community.notes to service_role;

revoke all on function
  community.can_see_reel(uuid), community.can_see_story(uuid), community.can_see_note(uuid, text),
  community.send_message(uuid, text, text, uuid, uuid, boolean, uuid[], text, uuid),
  community.create_reel(text, uuid, int, text), community.delete_reel(uuid), community.require_reel(uuid),
  community.like_reel(uuid, boolean), community.repost_reel(uuid, boolean), community.view_reel(uuid),
  community.add_reel_comment(uuid, text, uuid), community.like_reel_comment(uuid, boolean),
  community.delete_reel_comment(uuid), community.create_story(uuid, text), community.delete_story(uuid),
  community.view_story(uuid), community.reply_story(uuid, text, text), community.story_insights(uuid),
  community.check_highlight(text, uuid[], uuid), community.create_highlight(text, uuid[], uuid),
  community.update_highlight(uuid, text, uuid[], uuid, boolean), community.put_note(text, text)
from public;
grant execute on function
  community.can_see_reel(uuid), community.can_see_story(uuid), community.can_see_note(uuid, text),
  community.send_message(uuid, text, text, uuid, uuid, boolean, uuid[], text, uuid),
  community.create_reel(text, uuid, int, text), community.delete_reel(uuid),
  community.like_reel(uuid, boolean), community.repost_reel(uuid, boolean), community.view_reel(uuid),
  community.add_reel_comment(uuid, text, uuid), community.like_reel_comment(uuid, boolean),
  community.delete_reel_comment(uuid), community.create_story(uuid, text), community.delete_story(uuid),
  community.view_story(uuid), community.reply_story(uuid, text, text), community.story_insights(uuid),
  community.create_highlight(text, uuid[], uuid),
  community.update_highlight(uuid, text, uuid[], uuid, boolean), community.put_note(text, text)
to authenticated;
