-- Community round 7 (ported from csmju-nexus): reports and moderation, member roles and storage
-- quotas, the admin overview and the audit log browser. Staff = profiles.role 'ADMIN'
-- (community.is_staff()); there is no other tier. The first admin is promoted by the owner in SQL:
--   update community.profiles set role = 'ADMIN'
--   where user_id = (select id from auth.users where email = '<you>');

-- ── per-member storage quota (was a flat 50 MB) ──────────────────────────
alter table community.profiles
  add column role_explicit boolean not null default false,
  add column storage_quota_bytes bigint not null default 52428800
    check (storage_quota_bytes between 0 and 5368709120);

-- upload RPCs run as the uploader, so "my quota" is the uploader's
create or replace function community.quota_bytes() returns bigint
language sql stable security definer set search_path = ''
as $$
  select coalesce((select storage_quota_bytes from community.profiles where user_id = auth.uid()), 52428800);
$$;

-- ── reports ──────────────────────────────────────────────────────────────
create table community.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  target_kind text not null check (target_kind in ('REEL', 'POST', 'MESSAGE', 'COMMENT', 'USER', 'SYSTEM')),
  target_id text not null check (char_length(target_id) between 1 and 140),
  reason text not null check (char_length(reason) between 10 and 1000),
  status text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED', 'REJECTED')),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_kind, target_id)
);
create index on community.reports (status, created_at);

create function community.create_report(target_kind text, target_id text, reason text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := community.require_user();
  r text := btrim(coalesce(reason, ''));
  t text := btrim(coalesce(target_id, ''));
  target uuid;
  found_it boolean;
  new_id uuid;
begin
  if target_kind is null or target_kind not in ('REEL', 'POST', 'MESSAGE', 'COMMENT', 'USER', 'SYSTEM') then
    raise exception 'targetKind ไม่ถูกต้อง' using errcode = 'P0001';
  end if;
  if char_length(r) not between 10 and 1000 then
    raise exception 'เหตุผลต้องยาว 10-1000 ตัวอักษร เพื่อให้ผู้ดูแลตัดสินได้' using errcode = 'P0001';
  end if;
  if char_length(t) not between 1 and 128 then raise exception 'targetId ไม่ถูกต้อง' using errcode = 'P0001'; end if;

  if target_kind = 'SYSTEM' then
    -- app feedback can be sent again and again: make each one distinct
    t := t || '#' || left(replace(gen_random_uuid()::text, '-', ''), 8);
  else
    begin
      target := t::uuid;
    exception when invalid_text_representation then
      raise exception 'ไม่พบสิ่งที่รายงาน อาจถูกลบไปแล้ว' using errcode = 'P0002';
    end;
    if target_kind = 'USER' and target = me then
      raise exception 'รายงานตัวเองไม่ได้' using errcode = 'P0001';
    end if;
    -- you can only report what you can see
    found_it := case target_kind
      when 'REEL' then community.can_see_reel(target)
      when 'POST' then community.can_see_target('POST', target)
      when 'MESSAGE' then exists (select 1 from community.messages m
                                  where m.id = target and community.is_member(m.channel_id))
      when 'COMMENT' then exists (select 1 from community.reel_comments where id = target)
                       or exists (select 1 from community.post_comments where id = target)
      when 'USER' then exists (select 1 from community.profiles where user_id = target)
                       and not community.is_blocked_either(me, target)
    end;
    if not found_it then raise exception 'ไม่พบสิ่งที่รายงาน อาจถูกลบไปแล้ว' using errcode = 'P0002'; end if;
  end if;

  insert into community.reports (reporter_id, target_kind, target_id, reason)
  values (me, create_report.target_kind, t, r)
  on conflict on constraint reports_reporter_id_target_kind_target_id_key do nothing
  returning id into new_id;
  if new_id is null then
    raise exception 'คุณรายงานเรื่องนี้ไว้แล้ว ผู้ดูแลกำลังตรวจสอบ' using errcode = '23505';
  end if;
  return new_id;
end;
$$;

-- closing a report records the decision; the content itself is removed through the normal delete
-- paths (which audit themselves), never as a side effect here
create function community.resolve_report(report uuid, status text, note text default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r community.reports;
begin
  if not community.is_staff() then raise exception 'เฉพาะผู้ดูแลระบบ' using errcode = '42501'; end if;
  if status is null or status not in ('RESOLVED', 'REJECTED') then
    raise exception 'status ต้องเป็น RESOLVED หรือ REJECTED' using errcode = 'P0001';
  end if;
  if char_length(note) > 1000 then raise exception 'หมายเหตุยาวได้ไม่เกิน 1000 ตัวอักษร' using errcode = 'P0001'; end if;
  select * into r from community.reports where id = report for update;
  if r.id is null then raise exception 'ไม่พบรายงานนี้' using errcode = 'P0002'; end if;
  if r.status <> 'OPEN' then
    raise exception 'รายงานนี้ถูกปิดไปแล้วโดย %', coalesce(
      (select display_name from community.profiles where user_id = r.resolved_by), 'ผู้ดูแลคนอื่น')
      using errcode = '23505';
  end if;
  update community.reports
  set status = resolve_report.status, resolved_by = auth.uid(), resolved_at = now()
  where id = report;
  perform community.audit(case when status = 'RESOLVED' then 'report.resolved' else 'report.rejected' end,
    r.target_kind, r.target_id,
    jsonb_build_object('report_id', r.id, 'reporter_core_user_id', r.reporter_id, 'note', note));
end;
$$;

-- ── members: roles and quotas ────────────────────────────────────────────
create function community.set_member_role(target uuid, role text, reason text default null) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  previous text;
begin
  if not community.is_staff() then raise exception 'เฉพาะผู้ดูแลระบบ' using errcode = '42501'; end if;
  if role is null or role not in ('GUEST', 'EDITOR', 'ADMIN') then
    raise exception 'layer2Role ต้องเป็น GUEST, EDITOR หรือ ADMIN' using errcode = 'P0001';
  end if;
  if char_length(reason) > 500 then raise exception 'เหตุผลยาวได้ไม่เกิน 500 ตัวอักษร' using errcode = 'P0001'; end if;
  select p.role into previous from community.profiles p where p.user_id = target for update;
  if previous is null then raise exception 'ไม่พบสมาชิกคนนี้' using errcode = 'P0002'; end if;
  if target = auth.uid() and role <> 'ADMIN'
     and (select count(*) from community.profiles where profiles.role = 'ADMIN') <= 1 then
    raise exception 'คุณเป็นผู้ดูแลคนสุดท้ายของระบบย่อยนี้ — ตั้งคนอื่นเป็น ADMIN ก่อนจึงลดสิทธิ์ตัวเองได้'
      using errcode = '42501';
  end if;
  update community.profiles set role = set_member_role.role, role_explicit = true where user_id = target;
  perform community.audit('member.role_change', 'MEMBER', target::text,
    jsonb_build_object('from', previous, 'to', role, 'reason', reason));
  return community.member_json(target);
end;
$$;

create function community.set_member_quota(target uuid, quota_bytes bigint, reason text default null) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  previous bigint;
  used bigint := community.used_bytes(target);
begin
  if not community.is_staff() then raise exception 'เฉพาะผู้ดูแลระบบ' using errcode = '42501'; end if;
  if quota_bytes is null or quota_bytes < 0 then
    raise exception 'storageQuotaBytes ต้องไม่ติดลบ' using errcode = 'P0001';
  end if;
  if quota_bytes > 5368709120 then
    raise exception 'โควตาสูงสุดที่ตั้งได้คือ 5368709120 ไบต์ (5 GB) — พื้นที่ของฟรีเทียร์มีจำกัด' using errcode = 'P0001';
  end if;
  if char_length(reason) > 500 then raise exception 'เหตุผลยาวได้ไม่เกิน 500 ตัวอักษร' using errcode = 'P0001'; end if;
  select storage_quota_bytes into previous from community.profiles where user_id = target for update;
  if previous is null then raise exception 'ไม่พบสมาชิกคนนี้' using errcode = 'P0002'; end if;
  -- lowering below current use is allowed: it only blocks new uploads
  update community.profiles set storage_quota_bytes = quota_bytes where user_id = target;
  perform community.audit('member.quota_change', 'MEMBER', target::text, jsonb_build_object(
    'from', previous::text, 'to', quota_bytes::text, 'used', used::text,
    'below_current_usage', quota_bytes < used, 'pre_provisioned', false, 'reason', reason));
  return community.member_json(target);
end;
$$;

create function community.member_json(target uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'coreUserId', p.user_id, 'layer2Role', p.role, 'layer2RoleExplicit', p.role_explicit,
    'storageUsedBytes', community.used_bytes(p.user_id)::text,
    'storageQuotaBytes', p.storage_quota_bytes::text,
    'createdAt', p.created_at, 'updatedAt', p.updated_at)
  from community.profiles p where p.user_id = target;
$$;

-- staff list: optional role filter and a name search; total rides along on every row
create function community.member_rows(q text default null, role text default null, skip int default 0, max_rows int default 20)
returns table (member jsonb, total bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not community.is_staff() then raise exception 'เฉพาะผู้ดูแลระบบ' using errcode = '42501'; end if;
  return query
    with matching as (
      select p.user_id, p.created_at from community.profiles p
      where (member_rows.role is null or p.role = member_rows.role)
        and (nullif(btrim(q), '') is null or p.display_name ilike '%' || btrim(q) || '%'
             or p.user_id::text ilike btrim(q) || '%')
    )
    select community.member_json(m.user_id), count(*) over ()
    from matching m order by m.created_at desc, m.user_id
    offset greatest(skip, 0) limit least(greatest(max_rows, 1), 100);
end;
$$;

-- what a member sees about themselves (storage meter)
create function community.my_member() returns jsonb
language sql stable security definer set search_path = ''
as $$ select community.member_json(auth.uid()); $$;

create function community.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not community.is_staff() then raise exception 'เฉพาะผู้ดูแลระบบ' using errcode = '42501'; end if;
  return jsonb_build_object(
    'subsystem', 'empire-community',
    'standardsVersion', '1.2.0',
    'memberCount', (select count(*) from community.profiles),
    'reelCount', (select count(*) from community.reels),
    'postCount', (select count(*) from community.posts),
    'messageCount', (select count(*) from community.messages where deleted_at is null),
    'channelCount', (select count(*) from community.channels),
    'openReportCount', (select count(*) from community.reports where status = 'OPEN'),
    'storageUsedBytes', (select coalesce(sum(a.size_bytes), 0) from community.assets a)::text,
    'activeVoiceSessionCount', (select count(*) from community.voice_sessions where ended_at is null),
    'defaultRoleMapping', jsonb_build_object('admin', 'ADMIN', 'staff', 'EDITOR', 'student', 'EDITOR'));
end;
$$;

-- ── row level security ───────────────────────────────────────────────────
alter table community.reports enable row level security;
create policy "reporters see their reports; staff see all" on community.reports
  for select to authenticated using ((select auth.uid()) = reporter_id or community.is_staff());
grant select on community.reports to authenticated;
grant all on community.reports to service_role;

revoke all on function
  community.create_report(text, text, text), community.resolve_report(uuid, text, text),
  community.set_member_role(uuid, text, text), community.set_member_quota(uuid, bigint, text),
  community.member_json(uuid), community.member_rows(text, text, int, int), community.my_member(),
  community.admin_overview()
from public;
grant execute on function
  community.create_report(text, text, text), community.resolve_report(uuid, text, text),
  community.set_member_role(uuid, text, text), community.set_member_quota(uuid, bigint, text),
  community.member_rows(text, text, int, int), community.my_member(), community.admin_overview()
to authenticated;
