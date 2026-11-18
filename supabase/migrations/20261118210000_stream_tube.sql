-- Stream Tube (phase 1): the social layer around YouTube videos. Videos, channels and live streams
-- stay on YouTube and play through the official player, so there is no videos/channels/livestreams
-- table here: everything is keyed by the YouTube video id or channel id. Watch parties reuse
-- stream.rooms (see 20261118120000_stream.sql).
--
-- Who sees what: subscriptions, likes and votes are private to each user; comments, skip segments,
-- counters and notes marked shared are public (anon too); writing needs a sign-in. Admins
-- (cms.admins) pin and heart comments, read reports and remove anything.

-- a YouTube channel id: "UC" + 22 characters of [A-Za-z0-9_-]
create domain stream.channel_id as text check (value ~ '^UC[A-Za-z0-9_-]{22}$');

/** Rejects a write when the caller already made `TG_ARGV[0]` rows in this table within `TG_ARGV[1]`. */
-- definer: it must count rows the caller cannot read (a reporter never sees comment_reports)
create function stream.rate_limit() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  made int;
begin
  execute format(
    'select count(*) from stream.%I where user_id = $1 and created_at > now() - $2::interval',
    tg_table_name
  ) into made using new.user_id, tg_argv[1];
  if made >= tg_argv[0]::int then
    raise exception 'too many % in %: slow down', tg_table_name, tg_argv[1]
      using errcode = 'program_limit_exceeded';
  end if;
  return new;
end;
$$;

-- ── subscriptions: the YouTube channels a user follows (a chronological feed reads their RSS) ──
create table stream.subscriptions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  channel_id stream.channel_id not null,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);
comment on table stream.subscriptions is 'YouTube channels each user follows. Private to the user.';
alter table stream.subscriptions enable row level security;
create policy "own subscriptions: read" on stream.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own subscriptions: follow" on stream.subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own subscriptions: unfollow" on stream.subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on stream.subscriptions to authenticated;

-- ── video_stats: counters kept by triggers; nobody writes them through the API ──
create table stream.video_stats (
  youtube_id stream.youtube_id primary key,
  likes int not null default 0 check (likes >= 0),
  dislikes int not null default 0 check (dislikes >= 0),
  comments int not null default 0 check (comments >= 0)
);
comment on table stream.video_stats is 'Likes, dislikes and comments per video on crocwork (not YouTube''s numbers).';
alter table stream.video_stats enable row level security;
create policy "everyone reads the counters" on stream.video_stats
  for select to anon, authenticated using (true);
grant select on stream.video_stats to anon, authenticated;

-- ── video_engagement: one like (1) or dislike (-1) per user per video ──
create table stream.video_engagement (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  youtube_id stream.youtube_id not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, youtube_id)
);
comment on table stream.video_engagement is 'Each user''s like or dislike. Private; only the totals in video_stats are public.';
alter table stream.video_engagement enable row level security;
create policy "own engagement: read" on stream.video_engagement
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own engagement: rate" on stream.video_engagement
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own engagement: change" on stream.video_engagement
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own engagement: clear" on stream.video_engagement
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on stream.video_engagement to authenticated;
grant update (value) on stream.video_engagement to authenticated;

/** Keeps video_stats.likes / dislikes in step with video_engagement. */
create function stream.count_engagement() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update stream.video_stats
      set likes = likes - (old.value = 1)::int, dislikes = dislikes - (old.value = -1)::int
      where youtube_id = old.youtube_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    insert into stream.video_stats as s (youtube_id, likes, dislikes)
      values (new.youtube_id, (new.value = 1)::int, (new.value = -1)::int)
      on conflict (youtube_id) do update
        set likes = s.likes + excluded.likes, dislikes = s.dislikes + excluded.dislikes;
  end if;
  return null;
end;
$$;
create trigger count_engagement after insert or update or delete on stream.video_engagement
  for each row execute function stream.count_engagement();

-- ── comments: top-level comments and one level of replies ──
create table stream.comments (
  id uuid primary key default gen_random_uuid(),
  youtube_id stream.youtube_id not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id uuid references stream.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  pinned boolean not null default false,
  hearted boolean not null default false,
  replies int not null default 0 check (replies >= 0),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  check (not pinned or parent_id is null)
);
comment on table stream.comments is 'Comments on a video. Body is plain text or Markdown; the app renders it through DOMPurify.';
create index comments_by_video on stream.comments (youtube_id, created_at desc) where parent_id is null;
create index comments_by_parent on stream.comments (parent_id, created_at) where parent_id is not null;
create index comments_by_user on stream.comments (user_id, created_at);
-- one pinned comment per video
create unique index comments_one_pin on stream.comments (youtube_id) where pinned;
alter table stream.comments enable row level security;
create policy "everyone reads comments" on stream.comments
  for select to anon, authenticated using (true);
create policy "signed-in users comment" on stream.comments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "authors and admins edit comments" on stream.comments
  for update to authenticated
  using (user_id = (select auth.uid()) or (select cms.is_admin()))
  with check (user_id = (select auth.uid()) or (select cms.is_admin()));
create policy "authors and admins remove comments" on stream.comments
  for delete to authenticated using (user_id = (select auth.uid()) or (select cms.is_admin()));
grant select on stream.comments to anon, authenticated;
grant insert (id, youtube_id, parent_id, body), delete on stream.comments to authenticated;
grant update (body, pinned, hearted) on stream.comments to authenticated;

/** A reply answers a top-level comment on the same video. */
create function stream.check_reply() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from stream.comments p
    where p.id = new.parent_id and p.parent_id is null and p.youtube_id = new.youtube_id
  ) then
    raise exception 'a reply answers a top-level comment on the same video' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger check_reply before insert on stream.comments
  for each row execute function stream.check_reply();
create trigger rate_limit before insert on stream.comments
  for each row execute function stream.rate_limit('10', '1 minute');

/** Only the author changes the words; only an admin pins or hearts. */
create function stream.guard_comment() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.body is distinct from old.body then
    if old.user_id is distinct from (select auth.uid()) then
      raise exception 'only the author edits a comment' using errcode = 'insufficient_privilege';
    end if;
    new.edited_at := now();
  end if;
  if (new.pinned, new.hearted) is distinct from (old.pinned, old.hearted) and not (select cms.is_admin()) then
    raise exception 'only admins pin or heart comments' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
create trigger guard_comment before update on stream.comments
  for each row execute function stream.guard_comment();

/** Keeps comments.replies and video_stats.comments in step. */
create function stream.count_comment() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  c stream.comments := case when tg_op = 'DELETE' then old else new end;
  d int := case when tg_op = 'DELETE' then -1 else 1 end;
begin
  if c.parent_id is not null then
    update stream.comments set replies = replies + d where id = c.parent_id;
  end if;
  insert into stream.video_stats as s (youtube_id, comments) values (c.youtube_id, greatest(d, 0))
    on conflict (youtube_id) do update set comments = s.comments + d;
  return null;
end;
$$;
create trigger count_comment after insert or delete on stream.comments
  for each row execute function stream.count_comment();

-- ── comment_reports: signed-in users flag a comment; only admins read the flags ──
create table stream.comment_reports (
  comment_id uuid not null references stream.comments (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'other')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
comment on table stream.comment_reports is 'Reports on comments. Reporters write; admins read and clear.';
create index comment_reports_by_user on stream.comment_reports (user_id, created_at);
alter table stream.comment_reports enable row level security;
create policy "signed-in users report comments" on stream.comment_reports
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "admins read reports" on stream.comment_reports
  for select to authenticated using ((select cms.is_admin()));
create policy "admins clear reports" on stream.comment_reports
  for delete to authenticated using ((select cms.is_admin()));
grant select, insert, delete on stream.comment_reports to authenticated;
create trigger rate_limit before insert on stream.comment_reports
  for each row execute function stream.rate_limit('20', '1 hour');

-- ── video_segments: crowd-sourced parts to skip (or jump to) ──
create table stream.video_segments (
  id uuid primary key default gen_random_uuid(),
  youtube_id stream.youtube_id not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('intro', 'sponsor', 'intermission', 'highlight')),
  start_s real not null check (start_s >= 0),
  end_s real not null check (end_s > start_s and end_s < 1e6),
  score int not null default 0,
  created_at timestamptz not null default now()
);
comment on table stream.video_segments is 'Skip segments people mark on a video; score = sum of votes.';
create index video_segments_by_video on stream.video_segments (youtube_id, start_s);
create index video_segments_by_user on stream.video_segments (user_id, created_at);
alter table stream.video_segments enable row level security;
create policy "everyone reads segments" on stream.video_segments
  for select to anon, authenticated using (true);
create policy "signed-in users mark segments" on stream.video_segments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "authors and admins remove segments" on stream.video_segments
  for delete to authenticated using (user_id = (select auth.uid()) or (select cms.is_admin()));
grant select on stream.video_segments to anon, authenticated;
grant insert (id, youtube_id, category, start_s, end_s), delete on stream.video_segments to authenticated;
create trigger rate_limit before insert on stream.video_segments
  for each row execute function stream.rate_limit('30', '1 hour');

-- ── segment_votes: one up (1) or down (-1) per user per segment ──
create table stream.segment_votes (
  segment_id uuid not null references stream.video_segments (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  primary key (segment_id, user_id)
);
comment on table stream.segment_votes is 'Votes on skip segments. Private; the total is video_segments.score.';
create index segment_votes_by_user on stream.segment_votes (user_id);
alter table stream.segment_votes enable row level security;
create policy "own votes: read" on stream.segment_votes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own votes: cast" on stream.segment_votes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own votes: change" on stream.segment_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own votes: take back" on stream.segment_votes
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on stream.segment_votes to authenticated;
grant update (value) on stream.segment_votes to authenticated;

/** Keeps video_segments.score = sum of its votes. */
create function stream.count_vote() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update stream.video_segments
    set score = score
      + case when tg_op = 'DELETE' then 0 else new.value end
      - case when tg_op = 'INSERT' then 0 else old.value end
    where id = case when tg_op = 'DELETE' then old.segment_id else new.segment_id end;
  return null;
end;
$$;
create trigger count_vote after insert or update or delete on stream.segment_votes
  for each row execute function stream.count_vote();

-- ── timestamp_notes: notes pinned to a moment in a video; private unless shared ──
create table stream.timestamp_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  youtube_id stream.youtube_id not null,
  at_s real not null check (at_s >= 0 and at_s < 1e6),
  body text not null check (char_length(body) between 1 and 5000),
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  -- shortcut: 'simple' splits on spaces, so Thai matches whole runs only; add pg_trgm if Thai search matters
  search tsvector generated always as (to_tsvector('simple', body)) stored
);
comment on table stream.timestamp_notes is 'Markdown notes at a time in a video. Shared notes form a public study guide.';
create index timestamp_notes_own on stream.timestamp_notes (user_id, youtube_id, at_s);
create index timestamp_notes_shared on stream.timestamp_notes (youtube_id, at_s) where shared;
create index timestamp_notes_search on stream.timestamp_notes using gin (search) where shared;
alter table stream.timestamp_notes enable row level security;
create policy "everyone reads shared notes" on stream.timestamp_notes
  for select to anon, authenticated using (shared);
create policy "own notes: read" on stream.timestamp_notes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own notes: write" on stream.timestamp_notes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own notes: edit" on stream.timestamp_notes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "own notes: remove" on stream.timestamp_notes
  for delete to authenticated using (user_id = (select auth.uid()));
grant select on stream.timestamp_notes to anon, authenticated;
grant insert (youtube_id, at_s, body, shared), delete on stream.timestamp_notes to authenticated;
grant update (at_s, body, shared) on stream.timestamp_notes to authenticated;
create trigger rate_limit before insert on stream.timestamp_notes
  for each row execute function stream.rate_limit('60', '1 hour');

revoke execute on function stream.rate_limit(), stream.count_engagement(), stream.check_reply(),
  stream.guard_comment(), stream.count_comment(), stream.count_vote() from public, anon, authenticated;
