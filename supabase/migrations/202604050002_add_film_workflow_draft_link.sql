alter table public.films
  add column if not exists workflow_draft_id uuid references public.workflow_drafts (id) on delete set null;

create unique index if not exists films_workflow_draft_id_key
  on public.films (workflow_draft_id)
  where workflow_draft_id is not null;
