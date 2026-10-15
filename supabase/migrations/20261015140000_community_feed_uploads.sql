-- Community round 3 (ported from csmju-nexus): uploads, the post board with comments,
-- post reactions, bookmarks + collections, chat attachments and profile cover photos.
--
-- Uploads keep nexus' three steps — intent → PUT bytes to storage → commit — but the bytes go
-- straight to Supabase Storage through a signed upload URL, and commit reads the real size and
-- content type from storage.objects. Bytes are only ever removed through the Storage API
-- (the app calls it after the SQL that frees them), never by SQL.

-- ── assets ────────────────────────────────────────────────────────────────
create table community.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- API name; the storage bucket is 'community-' || bucket
  bucket text not null check (bucket in ('attachments', 'reels')),
  -- <owner>/<id>.<ext> — the owner prefix keeps paths unguessable and attributable
  object_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  -- decided from the extension at intent; commit rejects bytes stored under any other type
  mime_type text not null,
  kind text not null check (kind in ('IMAGE', 'VIDEO', 'AUDIO', 'CODE', 'DOCUMENT', 'ARCHIVE')),
  -- declared size while PENDING (reserves quota), real size once READY
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  status text not null default 'PENDING' check (status in ('PENDING', 'READY', 'BLOCKED')),
  blocked_reason text,
  message_id uuid references community.messages (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on community.assets (owner_id, created_at desc);
create index on community.assets (message_id) where message_id is not null;

-- Free tier: 1 GB of storage for every app together. 50 MB per member here, like canva.
create function community.quota_bytes() returns bigint
language sql immutable set search_path = ''
as $$ select 52428800::bigint $$;

-- Every byte a member's asset rows point at counts, whatever the row's state: a file declared as
-- 1 KB but uploaded at 10 MB counts 10 MB as soon as it lands, and rejected files count until
-- they are removed — so the only person an abandoned upload can crowd out is its owner.
create function community.used_bytes(owner uuid, except_asset uuid default null) returns bigint
language sql stable security definer set search_path = ''
as $$
  select coalesce(sum(greatest(a.size_bytes, coalesce((o.metadata ->> 'size')::bigint, 0))), 0)::bigint
  from community.assets a
  left join storage.objects o on o.bucket_id = 'community-' || a.bucket and o.name = a.object_path
  where a.owner_id = used_bytes.owner and a.id is distinct from used_bytes.except_asset;
$$;

-- What a file name may be, and the one content type its bytes must be stored under.
-- shortcut: the type comes from the extension and the bucket allowlist, not from sniffing magic
-- bytes as nexus did — files are served from the storage origin, never ours, and anything that
-- isn't media downloads as an attachment. Sniff in an Edge Function at commit if abuse shows up.
create function community.file_type(file_name text, hint text default null, out mime text, out kind text, out ext text)
language plpgsql immutable set search_path = ''
as $$
declare
  audio boolean := coalesce(hint, '') ilike 'audio/%';
begin
  ext := lower(substring(file_name from '\.([^.]+)$'));
  if ext in ('html', 'htm', 'xhtml', 'shtml', 'svg', 'xml', 'xsl', 'mhtml', 'swf', 'exe', 'dll',
             'msi', 'scr', 'com', 'jar', 'docm', 'xlsm', 'pptm', 'dotm', 'xltm', 'potm', 'xlam', 'ppam') then
    raise exception 'ไม่รับไฟล์นามสกุล .% — ถ้าต้องการแชร์ ให้เปลี่ยนเป็น .txt หรือใส่ใน .zip', ext
      using errcode = 'P0001';
  end if;
  case
    when ext = 'png' then mime := 'image/png'; kind := 'IMAGE';
    when ext in ('jpg', 'jpeg') then mime := 'image/jpeg'; kind := 'IMAGE';
    when ext = 'gif' then mime := 'image/gif'; kind := 'IMAGE';
    when ext = 'webp' then mime := 'image/webp'; kind := 'IMAGE';
    -- webm/mp4 hold either video or voice notes; MediaRecorder's audio/* hint tells them apart
    when ext in ('mp4', 'm4v') then
      mime := case when audio then 'audio/mp4' else 'video/mp4' end;
      kind := case when audio then 'AUDIO' else 'VIDEO' end;
    when ext = 'webm' then
      mime := case when audio then 'audio/webm' else 'video/webm' end;
      kind := case when audio then 'AUDIO' else 'VIDEO' end;
    when ext = 'mov' then mime := 'video/quicktime'; kind := 'VIDEO';
    when ext = 'weba' then mime := 'audio/webm'; kind := 'AUDIO';
    when ext in ('ogg', 'oga', 'opus') then mime := 'audio/ogg'; kind := 'AUDIO';
    when ext = 'mp3' then mime := 'audio/mpeg'; kind := 'AUDIO';
    when ext = 'm4a' then mime := 'audio/mp4'; kind := 'AUDIO';
    when ext = 'wav' then mime := 'audio/wav'; kind := 'AUDIO';
    when ext = 'pdf' then mime := 'application/pdf'; kind := 'DOCUMENT';
    when ext = 'zip' then mime := 'application/zip'; kind := 'ARCHIVE';
    when ext = 'docx' then mime := 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; kind := 'DOCUMENT';
    when ext = 'xlsx' then mime := 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; kind := 'DOCUMENT';
    when ext = 'pptx' then mime := 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; kind := 'DOCUMENT';
    when ext = 'doc' then mime := 'application/msword'; kind := 'DOCUMENT';
    when ext = 'xls' then mime := 'application/vnd.ms-excel'; kind := 'DOCUMENT';
    when ext = 'ppt' then mime := 'application/vnd.ms-powerpoint'; kind := 'DOCUMENT';
    when ext in ('txt', 'md', 'json', 'yml', 'yaml', 'csv', 'py', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx',
                 'java', 'kt', 'c', 'h', 'cpp', 'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'sql', 'sh', 'bat',
                 'ps1', 'ipynb', 'toml', 'ini', 'env', 'gitignore', 'dockerfile') then
      mime := 'text/plain'; kind := 'CODE';
    else
      raise exception 'ไม่รองรับไฟล์นามสกุล .% — รองรับรูปภาพ วิดีโอ ไฟล์เสียง PDF ไฟล์ Office .zip และไฟล์โค้ด/ข้อความ',
        coalesce(ext, '(ไม่มีนามสกุล)') using errcode = 'P0001';
  end case;
end;
$$;

-- ── posts ─────────────────────────────────────────────────────────────────
create table community.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- '' (not null) for photo-only posts, so every existing renderer keeps working
  title text not null default '' check (char_length(title) <= 200),
  content text not null default '' check (char_length(content) <= 8000),
  course_tag text check (course_tag ~ '^[A-Z]{2,4}[0-9]{3}$'),
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on community.posts (created_at desc, id desc);
create index on community.posts (course_tag, created_at desc);
create index on community.posts (author_id, created_at desc);

create table community.post_media (
  post_id uuid not null references community.posts (id) on delete cascade,
  asset_id uuid not null unique references community.assets (id) on delete cascade,
  position int not null check (position between 0 and 9),
  primary key (post_id, position)
);

create table community.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index on community.post_comments (post_id, created_at);
create index on community.post_comments (author_id, created_at desc);

alter table community.profiles
  add column cover_asset_id uuid unique references community.assets (id) on delete set null;

-- a READY file can back exactly one thing: a post, a message or a cover photo
create function community.asset_in_use(asset uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from community.post_media where asset_id = asset)
      or exists (select 1 from community.assets where id = asset and message_id is not null)
      or exists (select 1 from community.profiles where cover_asset_id = asset);
$$;

-- ── who may read a file ──────────────────────────────────────────────────
-- the owner, anyone who can see the post / room / profile the file belongs to
create function community.can_read_asset(asset uuid) returns boolean
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
    )
  );
$$;

-- nexus' commentsFrom: EVERYONE · FOLLOWING (people the owner follows) · FOLLOWERS · MUTUAL · OFF
create function community.can_comment(owner uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    when owner = auth.uid() then true
    when community.is_blocked_either(auth.uid(), owner) then false
    else case coalesce((select comments_from from community.profiles where user_id = owner), 'EVERYONE')
      when 'EVERYONE' then true
      when 'FOLLOWING' then exists (
        select 1 from community.follows where follower_id = owner and followee_id = auth.uid())
      when 'FOLLOWERS' then exists (
        select 1 from community.follows where follower_id = auth.uid() and followee_id = owner)
      when 'MUTUAL' then
        exists (select 1 from community.follows where follower_id = owner and followee_id = auth.uid())
        and exists (select 1 from community.follows where follower_id = auth.uid() and followee_id = owner)
      else false
    end
  end;
$$;

-- reactions and bookmarks now reach posts (reels arrive in round 4)
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
    else false
  end;
$$;

-- ── upload pipeline ──────────────────────────────────────────────────────
-- step 1: check name, size and quota, reserve the declared size, hand back the object path
create function community.create_upload_intent(
  file_name text, size_bytes bigint, bucket text, content_type text default null
) returns table (id uuid, path text, mime text)
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  t record;
  used bigint;
  pending int;
  new_id uuid := gen_random_uuid();
  new_path text;
begin
  if bucket is null or bucket not in ('attachments', 'reels') then
    raise exception 'bucket ต้องเป็น attachments หรือ reels' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(file_name, ''))) not between 1 and 255 then
    raise exception 'ชื่อไฟล์ต้องยาว 1-255 ตัวอักษร' using errcode = 'P0001';
  end if;
  if size_bytes is null or size_bytes < 1 then
    raise exception 'ไฟล์ว่างอัปโหลดไม่ได้' using errcode = 'P0001';
  end if;
  if size_bytes > 10485760 then
    raise exception 'ไฟล์ใหญ่ได้ไม่เกิน 10 MB' using errcode = 'P0001';
  end if;
  select * into t from community.file_type(btrim(file_name), content_type);
  if bucket = 'reels' and t.kind <> 'VIDEO' then
    raise exception 'bucket "reels" รับเฉพาะไฟล์วิดีโอ' using errcode = 'P0001';
  end if;

  -- one member's uploads queue behind each other, so parallel intents can't overbook the quota
  perform pg_advisory_xact_lock(hashtextextended('community.quota:' || me::text, 0));
  used := community.used_bytes(me);
  select count(*) into pending from community.assets a where a.owner_id = me and a.status = 'PENDING';
  if pending >= 10 then
    raise exception 'มีไฟล์ที่ยังอัปโหลดไม่เสร็จหลายไฟล์ — รอให้เสร็จหรือยกเลิกก่อน' using errcode = 'P0001';
  end if;
  if used + size_bytes > community.quota_bytes() then
    raise exception 'พื้นที่ไม่พอ — เหลือ % MB แต่ไฟล์นี้ % MB ลบไฟล์เก่าที่ไม่ใช้แล้วก่อน',
      round((community.quota_bytes() - used) / 1048576.0, 1), round(size_bytes / 1048576.0, 1)
      using errcode = 'P0001';
  end if;

  new_path := me::text || '/' || new_id::text || '.' || t.ext;
  insert into community.assets (id, owner_id, bucket, object_path, file_name, mime_type, kind, size_bytes)
  values (new_id, me, bucket, new_path, btrim(file_name), t.mime, t.kind, size_bytes);
  return query select new_id, new_path, t.mime;
end;
$$;

-- step 3: the bytes must exist, under the agreed type, and fit the quota at their real size.
-- A file that fails is marked BLOCKED (not raised, so the mark sticks); the app then deletes it.
create function community.commit_asset(asset uuid) returns community.assets
language plpgsql security definer set search_path = ''
as $$
declare
  a community.assets;
  real_size bigint;
  real_mime text;
  used bigint;
  reason text;
begin
  select * into a from community.assets where assets.id = asset and owner_id = auth.uid();
  if a.id is null then raise exception 'ไม่พบรายการอัปโหลดนี้' using errcode = 'P0002'; end if;
  if a.status = 'READY' then return a; end if;
  if a.status = 'BLOCKED' then
    raise exception 'ไฟล์นี้ถูกปฏิเสธไปแล้ว (%) — อัปโหลดใหม่', a.blocked_reason using errcode = 'P0001';
  end if;

  select (o.metadata ->> 'size')::bigint, lower(btrim(split_part(o.metadata ->> 'mimetype', ';', 1)))
  into real_size, real_mime
  from storage.objects o
  where o.bucket_id = 'community-' || a.bucket and o.name = a.object_path;
  if real_size is null then
    raise exception 'ยังไม่พบไฟล์ในที่เก็บ — อัปโหลดให้สำเร็จก่อนยืนยัน' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('community.quota:' || a.owner_id::text, 0));
  used := community.used_bytes(a.owner_id, a.id);

  if real_mime is distinct from a.mime_type then
    reason := 'เนื้อไฟล์ไม่ตรงกับนามสกุล';
  elsif real_size > 10485760 then
    reason := 'ไฟล์ใหญ่เกิน 10 MB';
  elsif used + real_size > community.quota_bytes() then
    reason := 'ไฟล์จริงใหญ่เกินพื้นที่ที่เหลือ';
  end if;

  if reason is not null then
    update community.assets set status = 'BLOCKED', blocked_reason = reason, size_bytes = least(real_size, 10485760)
    where assets.id = a.id returning * into a;
  else
    update community.assets set status = 'READY', size_bytes = real_size
    where assets.id = a.id returning * into a;
  end if;
  return a;
end;
$$;

-- Deletes the row and returns the object path; the app then removes the bytes. Whatever used the
-- file loses it (post media rows cascade, a cover goes blank, a message attachment disappears).
create function community.delete_asset(asset uuid) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  a record;
begin
  select owner_id, object_path into a from community.assets where id = asset;
  if a.owner_id is null or (a.owner_id <> auth.uid() and not community.is_staff()) then
    raise exception 'ไม่พบไฟล์นี้' using errcode = 'P0002';
  end if;
  delete from community.assets where id = asset;
  return a.object_path;
end;
$$;

-- checks shared by posts, messages and covers: my own, committed, unused file of the right kind
create function community.claim_assets(assets uuid[], kinds text[]) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  a record;
  wanted int := coalesce(cardinality(assets), 0);
  found int := 0;
begin
  if wanted = 0 then return; end if;
  if wanted > 10 then raise exception 'แนบไฟล์ได้ไม่เกิน 10 ไฟล์' using errcode = 'P0001'; end if;
  if (select count(distinct x) from unnest(assets) x) <> wanted then
    raise exception 'มีไฟล์ซ้ำกัน' using errcode = 'P0001';
  end if;
  -- lock the rows so two posts (or a post and a message) can't take the same file at once
  for a in
    select x.id, x.owner_id, x.status, x.kind from community.assets x
    where x.id = any (assets) order by x.id for update
  loop
    found := found + 1;
    if a.owner_id <> auth.uid() then
      raise exception 'ใช้ไฟล์ของคนอื่นไม่ได้' using errcode = '42501';
    end if;
    if a.status <> 'READY' then
      raise exception 'มีไฟล์ที่ยังอัปโหลดไม่เสร็จ — ยืนยันการอัปโหลดให้สำเร็จก่อน' using errcode = 'P0001';
    end if;
    if not a.kind = any (kinds) then
      raise exception 'ไฟล์ชนิดนี้ใช้ตรงนี้ไม่ได้' using errcode = 'P0001';
    end if;
    if community.asset_in_use(a.id) then
      raise exception 'มีไฟล์ที่ถูกใช้ไปแล้ว — อัปโหลดใหม่ถ้าต้องการใช้ซ้ำ' using errcode = 'P0001';
    end if;
  end loop;
  if found <> wanted then
    raise exception 'ไม่พบไฟล์บางรายการ — อัปโหลดให้เสร็จก่อน' using errcode = 'P0002';
  end if;
end;
$$;

-- ── posts: write paths ───────────────────────────────────────────────────
create function community.create_post(
  title text default null, content text default null, course_tag text default null, asset_ids uuid[] default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  t text := btrim(coalesce(title, ''));
  c text := btrim(coalesce(content, ''));
  tag text := nullif(btrim(coalesce(course_tag, '')), '');
  new_id uuid;
begin
  if t = '' and c = '' and coalesce(cardinality(asset_ids), 0) = 0 then
    raise exception 'โพสต์ว่างเปล่า — ต้องมีหัวข้อ เนื้อหา หรือรูป/วิดีโออย่างน้อยหนึ่งอย่าง' using errcode = 'P0001';
  end if;
  if char_length(t) > 200 then raise exception 'หัวข้อยาวได้ไม่เกิน 200 ตัวอักษร' using errcode = 'P0001'; end if;
  if char_length(c) > 8000 then raise exception 'เนื้อหายาวได้ไม่เกิน 8000 ตัวอักษร' using errcode = 'P0001'; end if;
  if tag is not null and tag !~ '^[A-Z]{2,4}[0-9]{3}$' then
    raise exception 'แท็กวิชาต้องอยู่ในรูปแบบเช่น CS201' using errcode = 'P0001';
  end if;
  if (select count(*) from community.posts where author_id = me and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'โพสต์ถี่เกินไป รอสักครู่แล้วลองใหม่' using errcode = 'P0001';
  end if;
  perform community.claim_assets(asset_ids, array['IMAGE', 'VIDEO']);

  insert into community.posts (author_id, title, content, course_tag)
  values (me, t, c, tag) returning id into new_id;
  insert into community.post_media (post_id, asset_id, position)
  select new_id, x.asset, x.ord - 1 from unnest(asset_ids) with ordinality as x (asset, ord);
  return new_id;
end;
$$;

-- returns the object paths whose bytes the app should now remove from storage
create function community.delete_post(post uuid) returns text[]
language plpgsql security definer set search_path = ''
as $$
declare
  author uuid;
  paths text[];
begin
  select author_id into author from community.posts where id = post;
  if author is null or community.is_blocked_either(auth.uid(), author) then
    raise exception 'ไม่พบโพสต์นี้ อาจถูกลบไปแล้ว' using errcode = 'P0002';
  end if;
  -- staff moderate the board too: it is the community's official space
  if author <> auth.uid() and not community.is_staff() then
    raise exception 'ลบได้เฉพาะโพสต์ของตัวเอง' using errcode = '42501';
  end if;
  with gone as (
    delete from community.assets a using community.post_media pm
    where pm.post_id = post and a.id = pm.asset_id
    returning a.object_path
  )
  select coalesce(array_agg(object_path), '{}') into paths from gone;
  delete from community.posts where id = post;
  -- reactions point at posts without a foreign key, so they don't cascade on their own
  delete from community.reactions where target_kind = 'POST' and target_id = post;
  return paths;
end;
$$;

create function community.add_comment(post uuid, body text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  author uuid;
  text_body text := btrim(coalesce(body, ''));
  new_id uuid;
begin
  select author_id into author from community.posts where id = post;
  if author is null or community.is_blocked_either(me, author) then
    raise exception 'ไม่พบโพสต์นี้' using errcode = 'P0002';
  end if;
  if not community.can_comment(author) then
    raise exception 'เจ้าของโพสต์จำกัดว่าใครแสดงความคิดเห็นได้ คุณจึงคอมเมนต์โพสต์นี้ไม่ได้' using errcode = '42501';
  end if;
  if char_length(text_body) not between 1 and 4000 then
    raise exception 'ความคิดเห็นต้องยาว 1-4000 ตัวอักษร' using errcode = 'P0001';
  end if;
  if (select count(*) from community.post_comments
      where author_id = me and created_at > now() - interval '10 seconds') >= 10 then
    raise exception 'แสดงความคิดเห็นถี่เกินไป รอสักครู่แล้วลองใหม่' using errcode = 'P0001';
  end if;
  insert into community.post_comments (post_id, author_id, content)
  values (post, me, text_body) returning id into new_id;
  update community.posts set comment_count = comment_count + 1 where id = post;
  return new_id;
end;
$$;

create function community.delete_comment(post uuid, comment uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  author uuid;
begin
  select author_id into author from community.post_comments
  where id = comment and post_id = post and deleted_at is null;
  if author is null then raise exception 'ไม่พบความคิดเห็นนี้' using errcode = 'P0002'; end if;
  if author <> auth.uid() and not community.is_staff() then
    raise exception 'ลบได้เฉพาะความคิดเห็นของตัวเอง' using errcode = '42501';
  end if;
  -- soft delete, and keep the counter equal to what people can see
  update community.post_comments set deleted_at = now() where id = comment;
  update community.posts set comment_count = greatest(comment_count - 1, 0) where id = post;
end;
$$;

-- ── cover photo ──────────────────────────────────────────────────────────
-- null clears it; returns the old cover's path so the app can remove its bytes
create function community.set_cover(asset uuid default null) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  old uuid;
  old_path text;
begin
  select cover_asset_id into old from community.profiles where user_id = me;
  if asset is not distinct from old then return null; end if;
  if asset is not null then perform community.claim_assets(array[asset], array['IMAGE']); end if;
  update community.profiles set cover_asset_id = asset where user_id = me;
  delete from community.assets where id = old returning object_path into old_path;
  return old_path;
end;
$$;

-- ── chat attachments ─────────────────────────────────────────────────────
drop function community.send_message(uuid, text, text, uuid, uuid, boolean);
create function community.send_message(
  channel uuid, body text, nonce text, parent uuid default null, reply_to uuid default null,
  is_forward boolean default false, attachments uuid[] default null
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

  if text_body is null and coalesce(cardinality(attachments), 0) = 0 then
    raise exception 'ข้อความว่าง' using errcode = 'P0001';
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

  insert into community.messages (channel_id, author_id, content, client_nonce, parent_id, reply_to_id, forwarded)
  values (channel, me, text_body, nonce, parent, reply_to, is_forward)
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

-- deleting a message deletes its files too (the app removes the bytes it read beforehand)
create or replace function community.delete_message(message uuid) returns void
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
  delete from community.assets where message_id = message;
  update community.messages
  set deleted_at = now(), content = null, pinned_at = null, pinned_by = null, last_change = 'delete'
  where id = message;
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
  ), '[]'::jsonb) as attachments
from community.messages m
left join community.messages r on r.id = m.reply_to_id;

-- the inbox preview counts attachments, so a photo-only message isn't a blank line
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
        (select count(*) from community.assets la where la.message_id = l.id and la.status = 'READY') as last_attachments
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
      'attachmentCount', e.last_attachments, 'createdAt', e.last_at) end,
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

-- ── reading posts ────────────────────────────────────────────────────────
-- RLS of posts and assets applies (security invoker); the app signs the media paths
create view community.post_view with (security_invoker = true) as
select
  p.id, p.author_id, p.title, p.content, p.course_tag, p.comment_count, p.created_at,
  community.can_comment(p.author_id) as can_comment,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'assetId', a.id, 'kind', a.kind, 'mimeType', a.mime_type, 'path', a.object_path) order by pm.position)
    from community.post_media pm join community.assets a on a.id = pm.asset_id
    where pm.post_id = p.id
  ), '[]'::jsonb) as media
from community.posts p;

-- ── bookmarks + collections (owner only) ─────────────────────────────────
create table community.bookmarks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  target_kind text not null check (target_kind in ('POST', 'REEL')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_kind, target_id)
);
create index on community.bookmarks (user_id, created_at desc);

create table community.bookmark_collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on community.bookmark_collections (owner_id, created_at desc);
create trigger bookmark_collections_touch before update on community.bookmark_collections
  for each row execute function community.touch_updated_at();

-- only saved things go in a collection; unsaving drops them from every collection (the FK cascade)
create table community.bookmark_collection_items (
  collection_id uuid not null references community.bookmark_collections (id) on delete cascade,
  owner_id uuid not null default auth.uid(),
  target_kind text not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (collection_id, target_kind, target_id),
  foreign key (owner_id, target_kind, target_id)
    references community.bookmarks (user_id, target_kind, target_id) on delete cascade
);
create index on community.bookmark_collection_items (collection_id, created_at desc);
create index on community.bookmark_collection_items (owner_id, target_kind, target_id);

-- title/author at read time — null once the post is gone or hidden by a block
create view community.bookmark_view with (security_invoker = true) as
select
  b.user_id, b.target_kind, b.target_id, b.created_at,
  coalesce(nullif(p.title, ''), nullif(left(p.content, 80), '')) as title,
  p.author_id
from community.bookmarks b
left join community.posts p on b.target_kind = 'POST' and p.id = b.target_id;

create view community.bookmark_collection_view with (security_invoker = true) as
select
  c.id, c.owner_id, c.name, c.created_at, c.updated_at,
  (select count(*)::int from community.bookmark_collection_items i where i.collection_id = c.id) as item_count,
  (select jsonb_build_object('targetKind', i.target_kind, 'targetId', i.target_id)
   from community.bookmark_collection_items i where i.collection_id = c.id
   order by i.created_at desc limit 1) as cover
from community.bookmark_collections c;

-- ── row level security ───────────────────────────────────────────────────
alter table community.assets enable row level security;
alter table community.posts enable row level security;
alter table community.post_media enable row level security;
alter table community.post_comments enable row level security;
alter table community.bookmarks enable row level security;
alter table community.bookmark_collections enable row level security;
alter table community.bookmark_collection_items enable row level security;

create policy "owners and audiences see files" on community.assets
  for select to authenticated
  using ((select auth.uid()) = owner_id or community.can_read_asset(id));
-- cleanup of a failed upload; committed files go through delete_asset
create policy "owners drop unfinished uploads" on community.assets
  for delete to authenticated
  using ((select auth.uid()) = owner_id and status <> 'READY');

create policy "posts outside blocks" on community.posts
  for select to authenticated
  using (not community.is_blocked_either((select auth.uid()), author_id));
create policy "media of visible posts" on community.post_media
  for select to authenticated
  using (exists (select 1 from community.posts p where p.id = post_id));
create policy "live comments outside blocks on visible posts" on community.post_comments
  for select to authenticated
  using (
    deleted_at is null
    and not community.is_blocked_either((select auth.uid()), author_id)
    and exists (select 1 from community.posts p where p.id = post_id)
  );

create policy "owner reads own bookmarks" on community.bookmarks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "save what you can see" on community.bookmarks
  for insert to authenticated
  with check ((select auth.uid()) = user_id and community.can_see_target(target_kind, target_id));
create policy "owner unsaves" on community.bookmarks
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "owner manages own collections" on community.bookmark_collections
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "owner manages items of own collections" on community.bookmark_collection_items
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from community.bookmark_collections c
      where c.id = collection_id and c.owner_id = bookmark_collection_items.owner_id
    )
  );

grant select, delete on community.assets to authenticated;
grant select on community.posts, community.post_media, community.post_comments to authenticated;
grant select on community.post_view, community.bookmark_view, community.bookmark_collection_view to authenticated;
grant select, insert, delete on community.bookmarks to authenticated;
grant select, insert, update (name), delete on community.bookmark_collections to authenticated;
grant select, insert, delete on community.bookmark_collection_items to authenticated;
grant all on community.assets, community.posts, community.post_media, community.post_comments,
  community.bookmarks, community.bookmark_collections, community.bookmark_collection_items to service_role;

revoke all on function
  community.quota_bytes(), community.used_bytes(uuid, uuid), community.file_type(text, text), community.asset_in_use(uuid),
  community.can_read_asset(uuid), community.can_comment(uuid), community.claim_assets(uuid[], text[]),
  community.create_upload_intent(text, bigint, text, text), community.commit_asset(uuid),
  community.delete_asset(uuid), community.create_post(text, text, text, uuid[]), community.delete_post(uuid),
  community.add_comment(uuid, text), community.delete_comment(uuid, uuid), community.set_cover(uuid),
  community.send_message(uuid, text, text, uuid, uuid, boolean, uuid[])
from public;
grant execute on function
  community.can_read_asset(uuid), community.can_comment(uuid),
  community.create_upload_intent(text, bigint, text, text), community.commit_asset(uuid),
  community.delete_asset(uuid), community.create_post(text, text, text, uuid[]), community.delete_post(uuid),
  community.add_comment(uuid, text), community.delete_comment(uuid, uuid), community.set_cover(uuid),
  community.send_message(uuid, text, text, uuid, uuid, boolean, uuid[])
to authenticated;

-- ── storage: private buckets, signed URLs only ───────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('community-attachments', 'community-attachments', false, 10485760, array[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav',
    'application/pdf', 'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
    'text/plain'
  ]),
  ('community-reels', 'community-reels', false, 10485760,
    array['video/mp4', 'video/webm', 'video/quicktime']);

create function community.storage_can_upload(bucket text, name text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from community.assets a
    where a.object_path = name and 'community-' || a.bucket = storage_can_upload.bucket
      and a.owner_id = auth.uid() and a.status = 'PENDING'
  );
$$;

create function community.storage_can_read(bucket text, name text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from community.assets a
    where a.object_path = name and 'community-' || a.bucket = storage_can_read.bucket
      and community.can_read_asset(a.id)
  );
$$;

-- bytes may go once the SQL freed them (no row left) or when they are your own unfinished upload
create function community.storage_can_purge(bucket text, name text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (
    select 1 from community.assets a
    where a.object_path = name and (a.status = 'READY' or a.owner_id <> auth.uid())
  );
$$;

revoke all on function community.storage_can_upload(text, text), community.storage_can_read(text, text),
  community.storage_can_purge(text, text) from public;
grant execute on function community.storage_can_upload(text, text), community.storage_can_read(text, text),
  community.storage_can_purge(text, text) to authenticated;

create policy "community: upload bytes for own pending asset" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('community-attachments', 'community-reels')
              and community.storage_can_upload(bucket_id, name));
create policy "community: read bytes you may see" on storage.objects
  for select to authenticated
  using (bucket_id in ('community-attachments', 'community-reels')
         and community.storage_can_read(bucket_id, name));
-- Storage deletes with RETURNING, which needs a matching SELECT policy. Freed bytes have no row
-- and live under an unguessable path only until the app removes them a moment later.
create policy "community: see freed bytes to remove them" on storage.objects
  for select to authenticated
  using (bucket_id in ('community-attachments', 'community-reels')
         and community.storage_can_purge(bucket_id, name));
create policy "community: remove freed bytes" on storage.objects
  for delete to authenticated
  using (bucket_id in ('community-attachments', 'community-reels')
         and community.storage_can_purge(bucket_id, name));
