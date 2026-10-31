-- The back-office overview at the hub's /admin: real counts across every app's schema and the
-- latest CMS edits with who made them. One admin-only SECURITY DEFINER function, so the
-- dashboard reads other apps' tables (and auth.users emails) without opening their RLS.

create function cms.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not cms.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'users', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'week', (select count(*) from auth.users where created_at > now() - interval '7 days')
    ),
    'community', jsonb_build_object(
      'members', (select count(*) from community.profiles),
      'posts', (select count(*) from community.posts),
      'reels', (select count(*) from community.reels),
      'messages', (select count(*) from community.messages),
      'open_reports', (select count(*) from community.reports where status = 'OPEN')
    ),
    'commerce', jsonb_build_object(
      'sellers', (select count(*) from commerce.profiles),
      'services', (select count(*) from commerce.services where published),
      'orders', (select count(*) from commerce.orders),
      'open_orders', (select count(*) from commerce.orders where status in ('CREATED', 'FUNDED', 'DELIVERED', 'DISPUTED'))
    ),
    'canva', jsonb_build_object(
      'designs', (select count(*) from canva.designs where trashed_at is null)
    ),
    'toolboxes', jsonb_build_object(
      'favorites', (select count(*) from toolboxes.favorites),
      'people', (select count(distinct user_id) from toolboxes.favorites)
    ),
    'cms', jsonb_build_object(
      'pages', coalesce((
        select jsonb_agg(jsonb_build_object('app', app, 'page', page, 'count', n) order by app, page)
        from (select app, page, count(*) as n from cms.entries group by app, page) p
      ), '[]'::jsonb),
      'recent', coalesce((
        select jsonb_agg(r order by r.at desc)
        from (
          select a.at, a.action, a.app, a.page, a.key, a.old_value, a.new_value, u.email as actor
          from cms.audit_log a left join auth.users u on u.id = a.actor
          order by a.at desc
          limit 12
        ) r
      ), '[]'::jsonb)
    )
  );
end;
$$;
revoke execute on function cms.admin_overview() from public, anon;
grant execute on function cms.admin_overview() to authenticated;
