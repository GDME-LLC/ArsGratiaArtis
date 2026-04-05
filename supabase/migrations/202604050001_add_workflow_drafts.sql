create table if not exists public.workflow_drafts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  concept text,
  creative_direction text,
  selected_tools jsonb not null default '[]'::jsonb,
  workflow_steps jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'draft',
  seeded_film_id uuid references public.films (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workflow_drafts_title_length check (char_length(trim(title)) between 1 and 120),
  constraint workflow_drafts_selected_tools_is_array check (jsonb_typeof(selected_tools) = 'array'),
  constraint workflow_drafts_workflow_steps_is_array check (jsonb_typeof(workflow_steps) = 'array'),
  constraint workflow_drafts_status_check check (status in ('draft', 'seeded', 'archived'))
);

create index if not exists workflow_drafts_creator_updated_idx
  on public.workflow_drafts (creator_id, updated_at desc);

create index if not exists workflow_drafts_creator_status_idx
  on public.workflow_drafts (creator_id, status, updated_at desc);

alter table public.workflow_drafts enable row level security;

drop policy if exists "workflow drafts are viewable by owner" on public.workflow_drafts;
drop policy if exists "workflow drafts are insertable by owner" on public.workflow_drafts;
drop policy if exists "workflow drafts are updatable by owner" on public.workflow_drafts;
drop policy if exists "workflow drafts are deletable by owner" on public.workflow_drafts;

create policy "workflow drafts are viewable by owner"
on public.workflow_drafts
for select
using (auth.uid() = creator_id);

create policy "workflow drafts are insertable by owner"
on public.workflow_drafts
for insert
with check (auth.uid() = creator_id);

create policy "workflow drafts are updatable by owner"
on public.workflow_drafts
for update
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "workflow drafts are deletable by owner"
on public.workflow_drafts
for delete
using (auth.uid() = creator_id);

drop trigger if exists workflow_drafts_set_updated_at on public.workflow_drafts;
create trigger workflow_drafts_set_updated_at
  before update on public.workflow_drafts
  for each row execute procedure public.set_updated_at();
