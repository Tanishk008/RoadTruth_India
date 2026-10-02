-- Road Truth India: shared citizen reports, "me too" votes and accountability stats.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
--
-- Privacy model
--   reports          public, no personal data. user_id is hidden by column grants.
--   report_contacts  reporter name/email/phone. Nobody can read it through the API; staff use the dashboard.
--   report_votes     one "me too" per signed-in citizen per report. Totals are kept on reports.vote_count.
-- Writes go through submit_report(), which validates input and stamps the owner and status server-side.

create type public.report_status as enum ('Received', 'Under Review', 'Forwarded', 'Resolved');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^RTR-\d{4}-[A-Z0-9]{6}$'),
  user_id uuid references auth.users on delete set null,
  issue_type text not null check (issue_type in ('pothole', 'road-damage', 'waterlogging', 'debris', 'signage', 'barrier', 'lighting', 'toll', 'construction-delay', 'other')),
  expressway_id text not null check (char_length(expressway_id) between 1 and 64),
  location text not null check (char_length(location) between 3 and 300),
  -- India's bounding box, generously.
  latitude double precision check (latitude between 6 and 38),
  longitude double precision check (longitude between 68 and 98),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  description text not null check (char_length(description) between 20 and 2000),
  photos text[] not null default '{}' check (cardinality(photos) <= 3),
  detection jsonb,
  status public.report_status not null default 'Received',
  vote_count integer not null default 0,
  -- When the citizen captured it; earlier than created_at for reports sent from the offline outbox.
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  status_updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  check ((latitude is null) = (longitude is null))
);

create index reports_expressway_idx on public.reports (expressway_id);
create index reports_open_location_idx on public.reports (latitude, longitude) where status <> 'Resolved';
create index reports_user_idx on public.reports (user_id);

create table public.report_contacts (
  report_id uuid primary key references public.reports on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 20)
);

create table public.report_votes (
  report_id uuid not null references public.reports on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

-- Row level security ---------------------------------------------------------

alter table public.reports enable row level security;
alter table public.report_contacts enable row level security;
alter table public.report_votes enable row level security;

create policy "Reports are public" on public.reports for select using (true);
-- Every column except user_id, so reports can't be linked to each other by author.
revoke select on public.reports from anon, authenticated;
grant select (id, reference, issue_type, expressway_id, location, latitude, longitude, severity, description, photos, detection,
  status, vote_count, captured_at, created_at, status_updated_at, resolved_at) on public.reports to anon, authenticated;
revoke insert, update, delete on public.reports from anon, authenticated;

-- No policies on report_contacts: no API access at all.
revoke all on public.report_contacts from anon, authenticated;

create policy "See your own votes" on public.report_votes for select to authenticated using (user_id = auth.uid());
create policy "Vote as yourself" on public.report_votes for insert to authenticated with check (user_id = auth.uid());
create policy "Withdraw your vote" on public.report_votes for delete to authenticated using (user_id = auth.uid());
revoke update on public.report_votes from anon, authenticated;

-- Triggers ---------------------------------------------------------------------

create function public.sync_vote_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rid uuid;
begin
  if tg_op = 'DELETE' then
    rid := old.report_id;
  else
    rid := new.report_id;
  end if;
  update public.reports set vote_count = (select count(*) from public.report_votes v where v.report_id = rid) where id = rid;
  return null;
end $$;

create trigger report_votes_count after insert or delete on public.report_votes
for each row execute function public.sync_vote_count();

create function public.stamp_status_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.status_updated_at := now();
    new.resolved_at := case when new.status = 'Resolved' then now() else null end;
  end if;
  return new;
end $$;

create trigger reports_status_change before update on public.reports
for each row execute function public.stamp_status_change();

-- Functions (RPC) ----------------------------------------------------------------

/** Atomically stores a report and its private contact details. Safe to retry: an existing reference is returned as-is. */
create function public.submit_report(payload jsonb) returns public.reports
language plpgsql security definer set search_path = '' as $$
declare
  result public.reports;
begin
  select * into result from public.reports where reference = payload->>'reference';
  if found then
    result.user_id := null; -- never reveal who filed a report
    return result;
  end if;

  -- Photos must be this report's own uploads in our bucket, never arbitrary links.
  if exists (
    select 1 from jsonb_array_elements_text(coalesce(payload->'photos', '[]'::jsonb)) as p(url)
    where position('/storage/v1/object/public/report-photos/' || (payload->>'reference') || '/' in p.url) = 0
  ) then
    raise exception 'Invalid photo URL' using errcode = '22023';
  end if;

  insert into public.reports (reference, user_id, issue_type, expressway_id, location, latitude, longitude, severity,
                              description, photos, detection, captured_at)
  values (
    payload->>'reference',
    auth.uid(),
    payload->>'issueType',
    payload->>'expresswayId',
    trim(payload->>'location'),
    (payload->>'latitude')::double precision,
    (payload->>'longitude')::double precision,
    payload->>'severity',
    trim(payload->>'description'),
    coalesce(array(select jsonb_array_elements_text(payload->'photos')), '{}'),
    payload->'detection',
    -- Trust the device clock only within the last 30 days.
    least(now(), greatest(now() - interval '30 days', coalesce((payload->>'capturedAt')::timestamptz, now())))
  )
  returning * into result;

  insert into public.report_contacts (report_id, name, email, phone)
  values (result.id, trim(payload->>'name'), lower(trim(payload->>'email')), nullif(trim(payload->>'phone'), ''));

  result.user_id := null;
  return result;
end $$;

grant execute on function public.submit_report(jsonb) to anon, authenticated;

/** Reports filed by the signed-in citizen from any device. */
create function public.my_reports() returns setof public.reports
language sql stable security definer set search_path = '' as $$
  select * from public.reports where user_id = auth.uid() order by created_at desc
$$;

-- Postgres grants EXECUTE to PUBLIC by default; only signed-in citizens need this one.
revoke execute on function public.my_reports() from public, anon;
grant execute on function public.my_reports() to authenticated;

/** Aggregate accountability figures for a set of corridors. Only counts, never individual rows. */
create function public.corridor_report_stats(expressway_ids text[])
returns table (expressway_id text, total bigint, open bigint, resolved bigint, median_fix_days double precision, resolved_within_30_days bigint)
language sql stable security definer set search_path = '' as $$
  select r.expressway_id,
         count(*),
         count(*) filter (where r.status <> 'Resolved'),
         count(*) filter (where r.status = 'Resolved'),
         percentile_cont(0.5) within group (order by (extract(epoch from r.resolved_at - r.created_at) / 86400)::double precision)
           filter (where r.resolved_at is not null),
         count(*) filter (where r.resolved_at is not null and r.resolved_at - r.created_at <= interval '30 days')
    from public.reports r
   where r.expressway_id = any(expressway_ids)
   group by r.expressway_id
$$;

grant execute on function public.corridor_report_stats(text[]) to anon, authenticated;

-- Contact form ---------------------------------------------------------------------

create table public.contact_messages (
  id text primary key check (id ~ '^MSG-\d{4}-[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 3 and 254),
  category text not null check (category in ('data-correction', 'feedback', 'partnership', 'other')),
  subject text not null check (char_length(subject) between 3 and 200),
  message text not null check (char_length(message) between 20 and 3000),
  user_id uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
-- Write-only from the site; staff read them in the dashboard.
create policy "Send a message" on public.contact_messages for insert to anon, authenticated
with check (user_id is null or user_id = auth.uid());
revoke select, update, delete on public.contact_messages from anon, authenticated;

-- Photo storage --------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

-- Uploads only, into a folder named after a report reference; no overwrites or deletes from the API.
create policy "Upload report photos" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] ~ '^RTR-\d{4}-[A-Z0-9]{6}$');
