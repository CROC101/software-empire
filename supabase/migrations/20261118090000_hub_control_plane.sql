-- Control plane: admins open and close the site and each subsystem from /admin, no deploy.
-- hub.settings (one row) = launch time, countdown message, announcement bar.
-- hub.apps (one row per app) = open / maintenance / off, its message, whether it needs a login.
-- Everyone may read both (they only describe what the public already sees); only the admin_*
-- functions below write them, and each write is logged with the old and new values.

-- ── settings: exactly one row ──
create table hub.settings (
  id boolean primary key default true check (id),
  -- before this moment only admins (with TOTP) get past the countdown; the seed keeps the old date
  launch_at timestamptz not null default '2027-01-01 00:00:00+07',
  soon_message text not null default '' check (char_length(soon_message) <= 500),
  announcement text not null default '' check (char_length(announcement) <= 300),
  updated_at timestamptz not null default now()
);
alter table hub.settings enable row level security;
create policy "everyone reads the site settings" on hub.settings for select using (true);
grant select on hub.settings to anon, authenticated;
insert into hub.settings default values;

-- ── apps: one switch per subsystem ──
create table hub.apps (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,32}$'),
  status text not null default 'open' check (status in ('open', 'maintenance', 'off')),
  message text not null default '' check (char_length(message) <= 500),
  login boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table hub.apps enable row level security;
create policy "everyone reads the app switches" on hub.apps for select using (true);
grant select on hub.apps to anon, authenticated;
-- the hub is the public preview; every subsystem asks for an account (the owner's rule)
insert into hub.apps (slug, login) values
  ('hub', false), ('community', true), ('commerce', true), ('toolboxes', true), ('tarot', true),
  ('design', true), ('canva', true), ('crocbyte', false), ('stream', true);

-- ── audit: the old and new values of every change ──
alter table hub.admin_actions add column detail jsonb;
alter table hub.admin_actions drop constraint admin_actions_action_check;
alter table hub.admin_actions add constraint admin_actions_action_check check (
  action in ('ban', 'unban', 'make_admin', 'remove_admin', 'suspend', 'sign_out', 'settings', 'app')
);

/**
 * Who may open `app` right now. One call per page: 'open', 'soon' (before launch), 'closed'
 * (maintenance or off, with its message), 'login' (needs an account) or 'mfa' (an admin who has
 * not passed the TOTP step yet and would otherwise be stopped). Admins with aal2 always pass.
 * An unknown app is closed.
 */
create function hub.gate(app text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  s hub.settings;
  a hub.apps;
  verdict text;
  admin boolean := cms.is_admin();
begin
  select * into s from hub.settings;
  select * into a from hub.apps where slug = app;
  verdict := case
    when now() < s.launch_at then 'soon'
    when a.slug is null or a.status <> 'open' then 'closed'
    when a.login and (select auth.uid()) is null then 'login'
    else 'open'
  end;
  if admin then
    verdict := case
      when coalesce(auth.jwt() ->> 'aal', '') = 'aal2' then 'open'
      when verdict = 'open' then 'open'
      else 'mfa'
    end;
  end if;
  return jsonb_build_object(
    'verdict', verdict,
    'message', case when verdict = 'soon' then s.soon_message else coalesce(a.message, '') end,
    'status', coalesce(a.status, 'off'),
    'launch_at', s.launch_at
  );
end;
$$;

create function hub.admin_set_settings(
  launch_at timestamptz, soon_message text, announcement text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  before_row hub.settings;
  after_row hub.settings;
begin
  perform hub.require_admin();
  select * into before_row from hub.settings;
  update hub.settings s set
    launch_at = admin_set_settings.launch_at,
    soon_message = btrim(admin_set_settings.soon_message),
    announcement = btrim(admin_set_settings.announcement),
    updated_at = now()
  where s.id
  returning * into after_row;
  insert into hub.admin_actions (actor, action, detail) values ((select auth.uid()), 'settings',
    jsonb_build_object('old', to_jsonb(before_row) - 'id' - 'updated_at', 'new', to_jsonb(after_row) - 'id' - 'updated_at'));
end;
$$;

create function hub.admin_set_app(slug text, status text, message text, login boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  before_row hub.apps;
  after_row hub.apps;
begin
  perform hub.require_admin();
  -- the hub cannot be switched off from inside the hub: that would lock admins out of /admin
  if admin_set_app.slug = 'hub' and admin_set_app.status = 'off' then
    raise exception 'the hub can only go into maintenance' using errcode = '22023';
  end if;
  select * into before_row from hub.apps a where a.slug = admin_set_app.slug;
  if not found then
    raise exception 'no such app' using errcode = 'P0002';
  end if;
  update hub.apps a set
    status = admin_set_app.status,
    message = btrim(admin_set_app.message),
    login = admin_set_app.login,
    updated_at = now()
  where a.slug = admin_set_app.slug
  returning * into after_row;
  insert into hub.admin_actions (actor, action, detail) values ((select auth.uid()), 'app',
    jsonb_build_object('old', to_jsonb(before_row) - 'updated_at', 'new', to_jsonb(after_row) - 'updated_at'));
end;
$$;

-- timed suspension: until = null lifts it; sessions end right away like a ban
create function hub.admin_suspend(target uuid, until timestamptz) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  was timestamptz;
begin
  perform hub.require_admin();
  if target = (select auth.uid()) then
    raise exception 'you cannot suspend yourself' using errcode = '42501';
  end if;
  if until is not null and until <= now() then
    raise exception 'the end of a suspension must be in the future' using errcode = '22023';
  end if;
  select banned_until into was from auth.users where id = target;
  if not found then
    raise exception 'no such user' using errcode = 'P0002';
  end if;
  update auth.users set banned_until = until where id = target;
  if until is not null then
    delete from auth.sessions where user_id = target;
  end if;
  insert into hub.admin_actions (actor, target, action, detail) values ((select auth.uid()), target,
    case when until is null then 'unban' else 'suspend' end,
    jsonb_build_object('old', was, 'new', until));
end;
$$;

-- signs someone out of every device: their refresh tokens die now, access tokens within the JWT lifetime
create function hub.admin_sign_out(target uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform hub.require_admin();
  delete from auth.sessions where user_id = target;
  insert into hub.admin_actions (actor, target, action) values ((select auth.uid()), target, 'sign_out');
end;
$$;

-- the log now shows the details too
create or replace function hub.admin_log() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform hub.require_admin();
  return coalesce((
    select jsonb_agg(r order by r.at desc)
    from (
      select l.at, l.action, a.email as actor, t.email as target, l.detail
      from hub.admin_actions l
      left join auth.users a on a.id = l.actor
      left join auth.users t on t.id = l.target
      order by l.at desc limit 50
    ) r
  ), '[]'::jsonb);
end;
$$;

revoke execute on function hub.gate(text), hub.admin_set_settings(timestamptz, text, text),
  hub.admin_set_app(text, text, text, boolean), hub.admin_suspend(uuid, timestamptz),
  hub.admin_sign_out(uuid) from public;
-- the gate answers visitors who are not signed in too
grant execute on function hub.gate(text) to anon, authenticated;
grant execute on function hub.admin_set_settings(timestamptz, text, text),
  hub.admin_set_app(text, text, text, boolean), hub.admin_suspend(uuid, timestamptz),
  hub.admin_sign_out(uuid) to authenticated;
