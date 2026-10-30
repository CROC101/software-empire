-- CMS: the owner edits text, numbers, images, links and the order / visibility of sections on
-- every app's pages, from the hub's /admin. Content is public (it is shown on public pages); only
-- admins write. The design stays in code: each app declares its editable fields with defaults
-- (packages/core/src/cms.ts), and a row here only overrides one of them.
--
-- The first admin is added by the owner in SQL (never commit the email, the repo is public):
--   insert into cms.admins (user_id) select id from auth.users where email = '<you>';

create schema if not exists cms;
grant usage on schema cms to anon, authenticated, service_role;

-- ── admins: nobody reads or writes this through the API; only is_admin() looks inside ──
create table cms.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table cms.admins is 'Who may edit CMS content. Written by hand in SQL only.';
alter table cms.admins enable row level security;
-- no policies and no grants for anon / authenticated: nobody can list admins or add themselves

create function cms.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from cms.admins where user_id = (select auth.uid()));
$$;
revoke execute on function cms.is_admin() from public;
grant execute on function cms.is_admin() to anon, authenticated;

create function cms.touch_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

-- ── entries: one overridden field (or section switch) of one page ──
-- value shapes, mirrored by the Zod schemas in packages/core/src/cms.ts:
--   text {text}  number {n}  image {url, alt}  link {label, href}  section {visible, order}
-- hrefs and image URLs are https, mailto (links only) or same-site paths: never javascript:/data:
-- (images may also be http on localhost: the local Supabase serves uploads over http)
create table cms.entries (
  app text not null check (app ~ '^[a-z0-9-]{1,32}$'),
  page text not null check (page ~ '^[a-z0-9-]{1,64}$'),
  key text not null check (key ~ '^[a-z0-9_.-]{1,64}$'),
  kind text not null check (kind in ('text', 'number', 'image', 'link', 'section')),
  value jsonb not null check (
    case kind
      when 'text' then jsonb_typeof(value -> 'text') = 'string'
        and char_length(value ->> 'text') <= 2000
      when 'number' then jsonb_typeof(value -> 'n') = 'number'
        and (value ->> 'n')::numeric between -1e12 and 1e12
      when 'image' then jsonb_typeof(value -> 'url') = 'string'
        -- http only for the local Supabase, where uploads live on http://127.0.0.1:54321
        and value ->> 'url' ~ '^(https://|http://(localhost|127\.0\.0\.1)(:[0-9]+)?/|/[^/\\])'
        and char_length(value ->> 'url') <= 2000
        and jsonb_typeof(value -> 'alt') = 'string'
        and char_length(value ->> 'alt') <= 300
      when 'link' then jsonb_typeof(value -> 'label') = 'string'
        and char_length(value ->> 'label') <= 200
        and jsonb_typeof(value -> 'href') = 'string'
        and value ->> 'href' ~ '^(https://|mailto:|/($|[^/\\])|#)'
        and char_length(value ->> 'href') <= 2000
      when 'section' then jsonb_typeof(value -> 'visible') = 'boolean'
        and jsonb_typeof(value -> 'order') = 'number'
        and (value ->> 'order')::numeric between 0 and 999
    end
  ),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  primary key (app, page, key)
);
comment on table cms.entries is 'Public page content overrides. Anyone reads; only cms admins write.';
create trigger entries_touch before insert or update on cms.entries
  for each row execute function cms.touch_updated_at();

alter table cms.entries enable row level security;

create policy "anyone reads content" on cms.entries
  for select to anon, authenticated using (true);
create policy "admins add content" on cms.entries
  for insert to authenticated with check ((select cms.is_admin()));
create policy "admins change content" on cms.entries
  for update to authenticated using ((select cms.is_admin())) with check ((select cms.is_admin()));
create policy "admins remove content" on cms.entries
  for delete to authenticated using ((select cms.is_admin()));

-- who edited stays private: the public API never sees updated_by
grant select (app, page, key, kind, value, updated_at) on cms.entries to anon, authenticated;
-- PostgREST upserts set every column they send, so update covers the key columns too
grant insert (app, page, key, kind, value), update (app, page, key, kind, value), delete
  on cms.entries to authenticated;
grant all on cms.entries, cms.admins to service_role;

-- ── audit: every change, written by a trigger only, read by admins only ──
create table cms.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  app text not null,
  page text not null,
  key text not null,
  old_value jsonb,
  new_value jsonb,
  at timestamptz not null default now()
);
alter table cms.audit_log enable row level security;
create policy "admins read the audit log" on cms.audit_log
  for select to authenticated using ((select cms.is_admin()));
grant select on cms.audit_log to authenticated;
grant all on cms.audit_log to service_role;

create function cms.audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into cms.audit_log (actor, action, app, page, key, old_value, new_value)
  values (
    auth.uid(), tg_op,
    coalesce(new.app, old.app), coalesce(new.page, old.page), coalesce(new.key, old.key),
    case when tg_op = 'INSERT' then null else old.value end,
    case when tg_op = 'DELETE' then null else new.value end
  );
  return null;
end;
$$;
create trigger entries_audit after insert or update or delete on cms.entries
  for each row execute function cms.audit();

-- ── media: public images the admin uploads (object names are random, chosen by the server) ──
-- no SVG: it can carry script
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media', 'cms-media', true, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
);

create policy "cms: admins upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cms-media' and (select cms.is_admin()));
create policy "cms: admins replace media" on storage.objects
  for update to authenticated
  using (bucket_id = 'cms-media' and (select cms.is_admin()));
create policy "cms: admins remove media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cms-media' and (select cms.is_admin()));
