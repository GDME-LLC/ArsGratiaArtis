create table if not exists public.platform_settings (
  id boolean primary key default true check (id = true),
  homepage_spotlight_film_id uuid references public.films (id) on delete set null,
  homepage_spotlight_label text,
  hero_motto text not null default 'ARS GRATIA ARTIS',
  hero_title text not null default 'Cinema belongs to creators again.',
  hero_description text not null default 'ArsGratia is a home for AI filmmakers publishing authored work with releases, process, and presence attached.',
  beyond_cinema_categories jsonb not null default jsonb_build_array('animation', 'experimental', 'commercial', 'news', 'short'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.platform_settings
  drop constraint if exists platform_settings_beyond_cinema_categories_is_array;

alter table public.platform_settings
  add constraint platform_settings_beyond_cinema_categories_is_array
  check (jsonb_typeof(beyond_cinema_categories) = 'array');

create index if not exists platform_settings_homepage_spotlight_film_id_idx
  on public.platform_settings (homepage_spotlight_film_id);

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute procedure public.set_updated_at();

insert into public.platform_settings (
  id,
  homepage_spotlight_film_id,
  homepage_spotlight_label,
  hero_motto,
  hero_title,
  hero_description,
  beyond_cinema_categories
)
values (
  true,
  null,
  null,
  'ARS GRATIA ARTIS',
  'Cinema belongs to creators again.',
  'ArsGratia is a home for AI filmmakers publishing authored work with releases, process, and presence attached.',
  jsonb_build_array('animation', 'experimental', 'commercial', 'news', 'short')
)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "public can read platform settings" on public.platform_settings;
create policy "public can read platform settings"
on public.platform_settings
for select
using (true);
