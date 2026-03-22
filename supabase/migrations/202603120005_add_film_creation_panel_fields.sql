alter table public.films
add column if not exists prompt_text text,
add column if not exists process_notes text,
add column if not exists prompt_visibility text not null default 'private';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'films_prompt_visibility_check'
  ) then
    alter table public.films
    add constraint films_prompt_visibility_check
    check (prompt_visibility in ('public', 'followers', 'private'));
  end if;
end $$;

