create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  poster_url text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint series_title_length check (char_length(title) between 1 and 160),
  constraint series_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and lower(slug) = slug
  )
);

create unique index if not exists series_slug_key on public.series (lower(slug));
create index if not exists series_creator_id_idx on public.series (creator_id);

alter table public.films
add column if not exists series_id uuid references public.series (id) on delete set null,
add column if not exists season_number integer,
add column if not exists episode_number integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'films_season_number_check'
  ) then
    alter table public.films
    add constraint films_season_number_check
    check (season_number is null or season_number > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'films_episode_number_check'
  ) then
    alter table public.films
    add constraint films_episode_number_check
    check (episode_number is null or episode_number > 0);
  end if;
end $$;

create index if not exists films_series_episode_idx
on public.films (series_id, season_number, episode_number, published_at desc);

alter table public.series enable row level security;

create policy "series are publicly readable"
on public.series
for select
using (true);

create policy "series can be inserted by creator"
on public.series
for insert
with check (auth.uid() = creator_id);

create policy "series can be updated by creator"
on public.series
for update
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "series can be deleted by creator"
on public.series
for delete
using (auth.uid() = creator_id);
