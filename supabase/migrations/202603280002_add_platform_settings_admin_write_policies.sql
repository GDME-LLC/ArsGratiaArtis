alter table public.platform_settings enable row level security;

drop policy if exists "admins can insert platform settings" on public.platform_settings;
drop policy if exists "admins can update platform settings" on public.platform_settings;

create policy "admins can insert platform settings"
on public.platform_settings
for insert
with check (
  exists (
    select 1
    from public.admin_users admins
    where admins.profile_id = auth.uid()
  )
);

create policy "admins can update platform settings"
on public.platform_settings
for update
using (
  exists (
    select 1
    from public.admin_users admins
    where admins.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users admins
    where admins.profile_id = auth.uid()
  )
);
