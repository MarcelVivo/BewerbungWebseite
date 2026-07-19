-- Privacy-first, first-party website conversion analytics.
-- No IP address, user agent, form content or persistent browser identifier is stored.

create table if not exists public.website_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_name text not null check (event_name in (
    'page_view', 'page_exit', 'journey_station_view', 'journey_navigation',
    'cta_click', 'form_open', 'form_start', 'form_step', 'form_submit',
    'form_success', 'form_error'
  )),
  visit_id uuid not null,
  sequence integer not null default 1 check (sequence > 0),
  page_path text not null,
  language text not null default 'de' check (language in ('de', 'en')),
  station text,
  form_id text check (form_id is null or form_id in ('consultation', 'project', 'ki')),
  cta_id text,
  step integer,
  source text,
  medium text,
  campaign text,
  referrer_host text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists website_events_created_at_idx on public.website_events (created_at desc);
create index if not exists website_events_event_name_idx on public.website_events (event_name, created_at desc);
create index if not exists website_events_visit_id_idx on public.website_events (visit_id, created_at);

alter table public.website_events enable row level security;

drop policy if exists "Authenticated users can read website analytics" on public.website_events;
create policy "Authenticated users can read website analytics"
  on public.website_events for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete website analytics" on public.website_events;
create policy "Authenticated users can delete website analytics"
  on public.website_events for delete
  to authenticated
  using (true);

create or replace function public.prune_old_website_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.website_events where created_at < now() - interval '180 days';
  return null;
end;
$$;

revoke all on function public.prune_old_website_events() from public;
grant execute on function public.prune_old_website_events() to service_role;

drop trigger if exists website_events_retention on public.website_events;
create trigger website_events_retention
after insert on public.website_events
for each statement execute function public.prune_old_website_events();
