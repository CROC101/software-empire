-- Tarot daily reminder: the browsers that asked for a morning notification. The crocwork-tarot
-- Worker reads this table once a day with the service key and sends each one an empty push; the
-- service worker in the app shows the text. Rows only change through save_push / drop_push.

create table tarot.push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
comment on table tarot.push_subscriptions is 'Browsers subscribed to the daily reminder. Written by save_push/drop_push.';
alter table tarot.push_subscriptions enable row level security;
create policy "own subscriptions: read" on tarot.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
grant select on tarot.push_subscriptions to authenticated;
-- the daily sender (service key) lists every row and removes the ones a push service has dropped
grant select, delete on tarot.push_subscriptions to service_role;

-- subscribe this browser; on a shared device the browser moves to whoever subscribed last
create function tarot.save_push(push_endpoint text, push_p256dh text, push_auth text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in to get reminders' using errcode = '28000';
  end if;
  insert into tarot.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (push_endpoint, auth.uid(), push_p256dh, push_auth)
  on conflict on constraint push_subscriptions_pkey do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;

-- unsubscribe this browser (only your own)
create function tarot.drop_push(push_endpoint text) returns void
language sql security definer set search_path = ''
as $$
  delete from tarot.push_subscriptions s
  where s.endpoint = push_endpoint and s.user_id = (select auth.uid());
$$;

revoke execute on function tarot.save_push(text, text, text), tarot.drop_push(text) from public;
grant execute on function tarot.save_push(text, text, text), tarot.drop_push(text) to authenticated;
