-- Toolboxes owns the `toolboxes` schema (one schema per app — MASTER-SPEC ADR-02).
-- Favorites sync across devices for signed-in users; the browser keeps a local copy.

create schema if not exists toolboxes;

-- no anon access at all: signed-out visitors keep favorites in localStorage only
grant usage on schema toolboxes to authenticated, service_role;

create table toolboxes.favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- tool slugs are kebab-case ids from the app registry
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 64),
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);

comment on table toolboxes.favorites is 'Tools a user starred. Only the owner can read or change their rows.';

alter table toolboxes.favorites enable row level security;

-- (select auth.uid()) is evaluated once per statement instead of once per row
create policy "owner reads own favorites" on toolboxes.favorites
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "owner adds own favorites" on toolboxes.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "owner removes own favorites" on toolboxes.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

-- no update policy: a favorite is added or removed, never edited
grant select, insert, delete on toolboxes.favorites to authenticated;
grant all on toolboxes.favorites to service_role;

-- shortcut: no per-user row cap; ~120 valid slugs bound it in practice. Add a trigger cap if abused.
