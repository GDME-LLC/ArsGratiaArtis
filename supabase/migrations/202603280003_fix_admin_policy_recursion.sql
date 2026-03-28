create or replace function public.is_admin_user(candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where profile_id = candidate
  );
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to anon, authenticated, service_role;

drop policy if exists "owners and admins can read admin users" on public.admin_users;
create policy "owners and admins can read admin users"
on public.admin_users
for select
using (
  profile_id = auth.uid()
  or public.is_admin_user(auth.uid())
);

drop policy if exists "admins can insert platform settings" on public.platform_settings;
drop policy if exists "admins can update platform settings" on public.platform_settings;

create policy "admins can insert platform settings"
on public.platform_settings
for insert
with check (public.is_admin_user(auth.uid()));

create policy "admins can update platform settings"
on public.platform_settings
for update
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));
