create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  final_handle text;
  suffix integer := 0;
begin
  base_handle := lower(regexp_replace(split_part(coalesce(new.email, 'creator'), '@', 1), '[^a-z0-9_]+', '', 'g'));

  if length(base_handle) < 3 then
    base_handle := 'creator';
  end if;

  final_handle := left(base_handle, 24);

  while exists (
    select 1
    from public.profiles
    where handle = final_handle
  ) loop
    suffix := suffix + 1;
    final_handle := left(base_handle, greatest(3, 24 - length(suffix::text) - 1)) || '_' || suffix::text;
  end loop;

  insert into public.profiles (
    id,
    handle,
    display_name
  )
  values (
    new.id,
    final_handle,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'Creator'), '@', 1))
  );

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  display_name text not null,
  bio text,
  avatar_url text,
  banner_url text,
  website_url text,
  links jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_handle_format check (
    handle ~ '^[a-z0-9_]{3,32}$'
    and lower(handle) = handle
  ),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80),
  constraint profiles_links_is_array check (jsonb_typeof(links) = 'array')
);

create unique index if not exists profiles_handle_key on public.profiles (lower(handle));

create table if not exists public.films (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  slug text not null,
  synopsis text,
  description text,
  poster_url text,
  thumbnail_url text,
  duration_seconds integer,
  release_year integer,
  visibility text not null default 'public',
  publish_status text not null default 'draft',
  mux_asset_id text,
  mux_playback_id text,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint films_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and lower(slug) = slug
  ),
  constraint films_visibility_check check (visibility in ('public', 'unlisted', 'private')),
  constraint films_publish_status_check check (publish_status in ('draft', 'published', 'archived')),
  constraint films_duration_seconds_check check (duration_seconds is null or duration_seconds >= 0),
  constraint films_release_year_check check (
    release_year is null
    or release_year between 1888 and extract(year from timezone('utc', now()))::integer + 1
  )
);

create unique index if not exists films_slug_key on public.films (lower(slug));
create index if not exists films_creator_id_idx on public.films (creator_id);
create index if not exists films_public_listing_idx on public.films (publish_status, visibility, published_at desc, created_at desc);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint tags_name_length check (char_length(name) between 1 and 60),
  constraint tags_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and lower(slug) = slug
  )
);

create unique index if not exists tags_name_key on public.tags (lower(name));
create unique index if not exists tags_slug_key on public.tags (lower(slug));

create table if not exists public.film_tags (
  film_id uuid not null references public.films (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (film_id, tag_id)
);

create index if not exists film_tags_tag_id_idx on public.film_tags (tag_id);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text,
  description text,
  website_url text,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tools_name_length check (char_length(name) between 1 and 80),
  constraint tools_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and lower(slug) = slug
  )
);

create unique index if not exists tools_name_key on public.tools (lower(name));
create unique index if not exists tools_slug_key on public.tools (lower(slug));

create table if not exists public.film_tools (
  film_id uuid not null references public.films (id) on delete cascade,
  tool_id uuid not null references public.tools (id) on delete cascade,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (film_id, tool_id)
);

create index if not exists film_tools_tool_id_idx on public.film_tools (tool_id);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  url text not null,
  resource_type text not null default 'article',
  visibility text not null default 'public',
  publish_status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint resources_title_length check (char_length(title) between 1 and 140),
  constraint resources_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and lower(slug) = slug
  ),
  constraint resources_resource_type_check check (
    resource_type in ('article', 'video', 'tool', 'course', 'template', 'other')
  ),
  constraint resources_visibility_check check (visibility in ('public', 'private')),
  constraint resources_publish_status_check check (publish_status in ('draft', 'published', 'archived'))
);

create unique index if not exists resources_slug_key on public.resources (lower(slug));
create index if not exists resources_created_by_idx on public.resources (created_by);
create index if not exists resources_public_listing_idx on public.resources (publish_status, visibility, published_at desc, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null references public.films (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint comments_body_length check (char_length(trim(body)) between 1 and 5000)
);

create index if not exists comments_film_id_created_at_idx on public.comments (film_id, created_at desc);
create index if not exists comments_author_id_idx on public.comments (author_id);

create table if not exists public.film_likes (
  film_id uuid not null references public.films (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (film_id, profile_id)
);

create index if not exists film_likes_profile_id_idx on public.film_likes (profile_id);

create table if not exists public.creator_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, creator_id),
  constraint creator_follows_no_self_follow check (follower_id <> creator_id)
);

create index if not exists creator_follows_creator_id_idx on public.creator_follows (creator_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reports_target_type_check check (
    target_type in ('profile', 'film', 'comment', 'resource')
  ),
  constraint reports_reason_length check (char_length(trim(reason)) between 1 and 120),
  constraint reports_status_check check (status in ('open', 'reviewing', 'resolved', 'dismissed'))
);

create index if not exists reports_target_idx on public.reports (target_type, target_id);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists films_set_updated_at on public.films;
create trigger films_set_updated_at
  before update on public.films
  for each row execute procedure public.set_updated_at();

drop trigger if exists tools_set_updated_at on public.tools;
create trigger tools_set_updated_at
  before update on public.tools
  for each row execute procedure public.set_updated_at();

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
  before update on public.resources
  for each row execute procedure public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute procedure public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute procedure public.set_updated_at();
