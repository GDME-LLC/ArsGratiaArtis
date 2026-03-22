create table if not exists public.admin_users (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_users_created_at_idx on public.admin_users (created_at desc);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute procedure public.set_updated_at();

alter table public.admin_users enable row level security;

drop policy if exists "owners and admins can read admin users" on public.admin_users;

create policy "owners and admins can read admin users"
on public.admin_users
for select
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.admin_users admins
    where admins.profile_id = auth.uid()
  )
);
