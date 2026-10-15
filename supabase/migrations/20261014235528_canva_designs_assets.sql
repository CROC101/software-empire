-- Canvas (apps/canva) owns the `canva` schema (one schema per app — MASTER-SPEC ADR-02).
-- Owner-only access everywhere; link sharing from csmju-canvas is not ported yet.

create schema if not exists canva;
grant usage on schema canva to authenticated, service_role;

-- shared: keep updated_at honest without trusting the client
create function canva.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── folders ───────────────────────────────────────────────────────────────
create table canva.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on canva.folders (user_id);
create trigger folders_touch before update on canva.folders
  for each row execute function canva.touch_updated_at();

-- ── designs ───────────────────────────────────────────────────────────────
create table canva.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  design_type text not null check (design_type ~ '^[a-z][a-z0-9-]{1,39}$'),
  width int not null check (width between 16 and 8000),
  height int not null check (height between 16 and 8000),
  -- same limits as csmju-canvas: ≤ 4 MB of JSON, 1–100 pages
  document jsonb not null check (
    octet_length(document::text) <= 4194304
    and jsonb_typeof(document -> 'pages') = 'array'
    and jsonb_array_length(document -> 'pages') between 1 and 100
  ),
  thumbnail text check (
    thumbnail is null
    or (char_length(thumbnail) <= 280000
        and thumbnail ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$')
  ),
  folder_id uuid references canva.folders (id) on delete set null,
  source_template_id text check (char_length(source_template_id) <= 64),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  starred_at timestamptz,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on canva.designs (user_id, trashed_at, updated_at desc);
create index on canva.designs (folder_id);
create trigger designs_touch before update on canva.designs
  for each row execute function canva.touch_updated_at();

-- ── assets (uploaded files; bytes live in storage bucket canva-assets/<id>) ──
create table canva.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 200),
  mime_type text not null check (mime_type in (
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2'
  )),
  size_bytes int not null check (size_bytes between 1 and 10485760),
  source_url text check (char_length(source_url) <= 2000),
  source_site text check (char_length(source_site) <= 40),
  trashed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on canva.assets (user_id, trashed_at, created_at desc);

-- Free tier has 1 GB of storage for every app together: 50 MB and 100 files per user.
-- shortcut: size_bytes is declared by the client (each object is still capped at 10 MB by
-- the bucket), so the real ceiling is 100 × 10 MB. Verify sizes in an Edge Function if abused.
create function canva.enforce_asset_quota() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  used bigint;
  files int;
begin
  select coalesce(sum(size_bytes), 0), count(*) into used, files
  from canva.assets where user_id = new.user_id;
  if files >= 100 then
    raise exception 'เก็บไฟล์ได้ไม่เกิน 100 ไฟล์ — ลบไฟล์เก่าก่อน' using errcode = 'P0001';
  end if;
  if used + new.size_bytes > 52428800 then
    raise exception 'พื้นที่เก็บไฟล์เต็ม (50 MB) — ลบไฟล์เก่าก่อน' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger assets_quota before insert on canva.assets
  for each row execute function canva.enforce_asset_quota();

-- ── row level security: owner only ────────────────────────────────────────
alter table canva.folders enable row level security;
alter table canva.designs enable row level security;
alter table canva.assets enable row level security;

create policy "owner manages own folders" on canva.folders
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- a design may only point at the owner's own folder (folders RLS hides everyone else's)
create policy "owner manages own designs" on canva.designs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (folder_id is null or exists (select 1 from canva.folders f where f.id = folder_id))
  );

create policy "owner manages own assets" on canva.assets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on canva.folders, canva.designs, canva.assets to authenticated;
grant all on canva.folders, canva.designs, canva.assets to service_role;

-- ── storage: public-read bucket, uploads only for an asset row you own ───
-- Public URLs keep image/font URLs stable inside saved design JSON. Object names are
-- random UUIDs, so files are unlisted, not private — the UI says so at upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'canva-assets', 'canva-assets', true, 10485760,
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2'
  ]
);

create policy "canva: upload bytes for own asset" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'canva-assets'
    and exists (select 1 from canva.assets a where a.id::text = name)
  );

create policy "canva: delete bytes of own asset" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'canva-assets'
    and exists (select 1 from canva.assets a where a.id::text = name)
  );
