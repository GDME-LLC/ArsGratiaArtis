alter table public.profiles
  add column if not exists theatre_settings jsonb not null default jsonb_build_object(
    'stylePreset', 'obsidian',
    'heroImageUrl', null,
    'heroVideoUrl', null,
    'openingStatement', null,
    'featuredFilmId', null,
    'visibleSections', jsonb_build_array('about', 'featured_work', 'releases', 'links'),
    'sectionOrder', jsonb_build_array('about', 'featured_work', 'releases', 'links')
  );

alter table public.profiles
  drop constraint if exists profiles_theatre_settings_is_object;

alter table public.profiles
  add constraint profiles_theatre_settings_is_object
  check (jsonb_typeof(theatre_settings) = 'object');

update public.profiles
set theatre_settings = jsonb_build_object(
  'stylePreset', 'obsidian',
  'heroImageUrl', null,
  'heroVideoUrl', null,
  'openingStatement', null,
  'featuredFilmId', null,
  'visibleSections', jsonb_build_array('about', 'featured_work', 'releases', 'links'),
  'sectionOrder', jsonb_build_array('about', 'featured_work', 'releases', 'links')
)
where theatre_settings is null;

create or replace function public.upsert_own_profile(
  p_handle text,
  p_display_name text,
  p_bio text default null,
  p_avatar_url text default null,
  p_banner_url text default null,
  p_website_url text default null,
  p_is_creator boolean default false,
  p_theatre_settings jsonb default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_row public.profiles;
  next_theatre_settings jsonb := coalesce(
    p_theatre_settings,
    jsonb_build_object(
      'stylePreset', 'obsidian',
      'heroImageUrl', null,
      'heroVideoUrl', null,
      'openingStatement', null,
      'featuredFilmId', null,
      'visibleSections', jsonb_build_array('about', 'featured_work', 'releases', 'links'),
      'sectionOrder', jsonb_build_array('about', 'featured_work', 'releases', 'links')
    )
  );
begin
  if current_user_id is null then
    raise exception 'Unauthorized'
      using errcode = '42501';
  end if;

  update public.profiles
  set
    handle = p_handle,
    display_name = p_display_name,
    bio = p_bio,
    avatar_url = p_avatar_url,
    banner_url = p_banner_url,
    website_url = p_website_url,
    is_creator = coalesce(p_is_creator, false),
    theatre_settings = coalesce(next_theatre_settings, theatre_settings)
  where id = current_user_id
  returning * into profile_row;

  if found then
    return profile_row;
  end if;

  insert into public.profiles (
    id,
    handle,
    display_name,
    bio,
    avatar_url,
    banner_url,
    website_url,
    is_creator,
    theatre_settings
  )
  values (
    current_user_id,
    p_handle,
    p_display_name,
    p_bio,
    p_avatar_url,
    p_banner_url,
    p_website_url,
    coalesce(p_is_creator, false),
    next_theatre_settings
  )
  returning * into profile_row;

  return profile_row;
end;
$$;

revoke all on function public.upsert_own_profile(text, text, text, text, text, text, boolean, jsonb) from public;
grant execute on function public.upsert_own_profile(text, text, text, text, text, text, boolean, jsonb) to authenticated;