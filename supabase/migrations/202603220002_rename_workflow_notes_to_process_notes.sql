alter table public.films
  add column if not exists process_notes text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'films'
      and column_name = 'workflow_notes'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'films'
      and column_name = 'process_notes'
  ) then
    alter table public.films rename column workflow_notes to process_notes;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'films'
      and column_name = 'workflow_notes'
  ) then
    update public.films
    set process_notes = coalesce(process_notes, workflow_notes)
    where workflow_notes is not null;

    alter table public.films drop column workflow_notes;
  end if;
end $$;
