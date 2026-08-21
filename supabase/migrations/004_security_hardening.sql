-- Security hardening: only users explicitly marked as administrators may
-- access business data. Public writes are handled by validated server routes
-- with the service-role key, never directly with the browser anon key.

alter table public.profiles alter column role set default 'mitarbeiter';

create or replace function public.is_business_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_business_admin() from public;
grant execute on function public.is_business_admin() to authenticated;

drop policy if exists "auth_full_access" on public.profiles;
drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_admin_write" on public.profiles;

create policy "profiles_self_read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_business_admin());

create policy "profiles_admin_write" on public.profiles
  for all to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'kunden', 'deals', 'projekte', 'tasks', 'rechnungen', 'vertraege',
    'zeiteintraege', 'termine', 'outreach', 'ki_agenten', 'dokumente',
    'kontaktanfragen', 'recruiter_anfragen', 're_anfragen'
  ]
  loop
    execute format('drop policy if exists "auth_full_access" on public.%I', table_name);
    execute format('drop policy if exists "auth_read_write" on public.%I', table_name);
    execute format('drop policy if exists "auth_read" on public.%I', table_name);
    execute format('drop policy if exists "public_insert" on public.%I', table_name);
    execute format('drop policy if exists "admin_full_access" on public.%I', table_name);
    execute format(
      'create policy "admin_full_access" on public.%I for all to authenticated using (public.is_business_admin()) with check (public.is_business_admin())',
      table_name
    );
  end loop;
end $$;

drop policy if exists "Authenticated users can read website analytics" on public.website_events;
drop policy if exists "Authenticated users can delete website analytics" on public.website_events;
drop policy if exists "admin_full_access" on public.website_events;

create policy "admin_full_access" on public.website_events
  for all to authenticated
  using (public.is_business_admin())
  with check (public.is_business_admin());
