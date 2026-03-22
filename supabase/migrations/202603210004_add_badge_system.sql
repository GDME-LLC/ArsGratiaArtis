create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  icon_name text,
  theme text not null default 'gold',
  is_active boolean not null default true,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint badges_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and lower(slug) = slug
  ),
  constraint badges_name_length check (char_length(trim(name)) between 1 and 80),
  constraint badges_theme_length check (char_length(trim(theme)) between 1 and 40),
  constraint badges_sort_order_nonnegative check (sort_order >= 0)
);

create unique index if not exists badges_slug_key on public.badges (lower(slug));
create index if not exists badges_active_sort_idx on public.badges (is_active, sort_order, created_at);

create table if not exists public.creator_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint creator_badges_display_order_nonnegative check (display_order >= 0),
  constraint creator_badges_profile_badge_unique unique (profile_id, badge_id)
);

create index if not exists creator_badges_profile_display_idx on public.creator_badges (profile_id, display_order, assigned_at);
create index if not exists creator_badges_badge_idx on public.creator_badges (badge_id);

create or replace function public.prevent_system_badge_delete()
returns trigger
language plpgsql
as $$
begin
  if old.is_system then
    raise exception 'System badges cannot be deleted.';
  end if;

  return old;
end;
$$;

drop trigger if exists badges_set_updated_at on public.badges;
create trigger badges_set_updated_at
  before update on public.badges
  for each row execute procedure public.set_updated_at();

drop trigger if exists creator_badges_set_updated_at on public.creator_badges;
create trigger creator_badges_set_updated_at
  before update on public.creator_badges
  for each row execute procedure public.set_updated_at();

drop trigger if exists badges_prevent_system_delete on public.badges;
create trigger badges_prevent_system_delete
  before delete on public.badges
  for each row execute procedure public.prevent_system_badge_delete();

insert into public.badges (
  slug,
  name,
  description,
  icon_name,
  theme,
  is_active,
  is_system,
  sort_order
)
values (
  'founding-creator',
  'Founding Creator',
  'One of the first 20 creators on ArsGratia.',
  'laurel',
  'gold',
  true,
  true,
  10
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  icon_name = excluded.icon_name,
  theme = excluded.theme,
  is_active = true,
  is_system = true,
  sort_order = excluded.sort_order;

insert into public.creator_badges (
  profile_id,
  badge_id,
  assigned_by,
  assigned_at,
  display_order
)
select
  p.id,
  b.id,
  null,
  coalesce(p.founding_creator_awarded_at, timezone('utc', now())),
  greatest(coalesce(p.founding_creator_number, 0), 0)
from public.profiles p
cross join public.badges b
where b.slug = 'founding-creator'
  and p.is_founding_creator = true
on conflict (profile_id, badge_id) do update
set
  assigned_at = excluded.assigned_at,
  display_order = excluded.display_order;

alter table public.badges enable row level security;
alter table public.creator_badges enable row level security;

drop policy if exists "active badges are publicly readable" on public.badges;
drop policy if exists "active or authenticated badges are readable" on public.badges;
drop policy if exists "public creator badges are readable" on public.creator_badges;
drop policy if exists "public or owned creator badges are readable" on public.creator_badges;

create policy "active or authenticated badges are readable"
on public.badges
for select
using (is_active = true or auth.role() = 'authenticated');

create policy "public or owned creator badges are readable"
on public.creator_badges
for select
using (
  profile_id = auth.uid()
  or (
    exists (
      select 1
      from public.badges b
      where b.id = badge_id
        and b.is_active = true
    )
    and exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.is_public = true
        and p.is_creator = true
    )
  )
);
