create or replace function public.upsert_own_profile(
  p_handle text,
  p_display_name text,
  p_bio text default null,
  p_avatar_url text default null,
  p_banner_url text default null,
  p_website_url text default null,
  p_is_creator boolean default false
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_row public.profiles;
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
    is_creator = coalesce(p_is_creator, false)
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
    is_creator
  )
  values (
    current_user_id,
    p_handle,
    p_display_name,
    p_bio,
    p_avatar_url,
    p_banner_url,
    p_website_url,
    coalesce(p_is_creator, false)
  )
  returning * into profile_row;

  return profile_row;
end;
$$;

revoke all on function public.upsert_own_profile(text, text, text, text, text, text, boolean) from public;
grant execute on function public.upsert_own_profile(text, text, text, text, text, text, boolean) to authenticated;
