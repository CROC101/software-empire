-- Work saved in the toolboxes apps (/craft/* and /apps/*) follows a signed-in user to any device.
-- The apps keep their data in the browser (IndexedDB, OPFS). /sync/crocwork-sync.js (src/sync)
-- copies it into the private bucket toolboxes-sync as <user id>/<sha256 of the bytes>, and this
-- table names what each object is, so a device learns what changed without downloading it.
-- Signed out, nothing leaves the browser.

create table toolboxes.sync_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- idb/<database> or opfs/<dir>/<file>, each part URI-encoded by the client, no "." or ".." parts
  path text not null check (
    char_length(path) <= 1024
    and path ~ '^(idb|opfs)(/[A-Za-z0-9%._~!*''()-]{1,255}){1,16}$'
    and path !~ '/\.+(/|$)'
  ),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes bigint not null check (size_bytes between 0 and 52428800),
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

comment on table toolboxes.sync_items is
  'What a user''s app data in bucket toolboxes-sync (<user_id>/<sha256>) is. Owner only.';

alter table toolboxes.sync_items enable row level security;

create policy "owner reads own sync items" on toolboxes.sync_items
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "owner adds own sync items" on toolboxes.sync_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "owner changes own sync items" on toolboxes.sync_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "owner removes own sync items" on toolboxes.sync_items
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on toolboxes.sync_items to authenticated;
grant all on toolboxes.sync_items to service_role;

-- 1 GiB and 5,000 items per user.
-- shortcut: size_bytes is what the client reports; the bucket caps each object at 50 MB.
-- Read the real size from storage.objects in a commit RPC if anyone abuses it.
create function toolboxes.sync_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from toolboxes.sync_items where user_id = new.user_id) > 5000 then
    raise exception 'sync: item limit reached';
  end if;
  if (select coalesce(sum(size_bytes), 0) from toolboxes.sync_items where user_id = new.user_id)
     > 1073741824 then
    raise exception 'sync: storage quota reached';
  end if;
  return null;
end;
$$;

revoke execute on function toolboxes.sync_quota() from public, anon, authenticated;

create constraint trigger sync_quota after insert or update on toolboxes.sync_items
  for each row execute function toolboxes.sync_quota();

-- ── bytes: private bucket, each user only inside their own <user id>/ folder ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('toolboxes-sync', 'toolboxes-sync', false, 52428800, array['application/octet-stream']);

create policy "toolboxes: read own sync bytes" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'toolboxes-sync'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "toolboxes: upload own sync bytes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'toolboxes-sync'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "toolboxes: replace own sync bytes" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'toolboxes-sync'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'toolboxes-sync'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "toolboxes: delete own sync bytes" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'toolboxes-sync'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
