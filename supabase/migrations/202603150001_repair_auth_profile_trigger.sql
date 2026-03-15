create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
