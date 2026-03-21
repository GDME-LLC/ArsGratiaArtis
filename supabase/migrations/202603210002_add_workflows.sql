create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  goal text not null,
  constraints jsonb not null default '[]'::jsonb,
  current_tools jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  progress_count integer not null default 0,
  total_steps integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workflows_title_length check (char_length(trim(title)) between 1 and 120),
  constraint workflows_goal_check check (
    goal in (
      'first_short_film',
      'better_consistency',
      'cleaner_edit',
      'festival_ready_release',
      'social_teaser_campaign'
    )
  ),
  constraint workflows_constraints_is_array check (jsonb_typeof(constraints) = 'array'),
  constraint workflows_current_tools_is_array check (jsonb_typeof(current_tools) = 'array'),
  constraint workflows_steps_is_array check (jsonb_typeof(steps) = 'array'),
  constraint workflows_progress_nonnegative check (progress_count >= 0 and total_steps >= 0 and progress_count <= total_steps),
  constraint workflows_status_check check (status in ('active', 'archived'))
);

create index if not exists workflows_creator_id_idx on public.workflows (creator_id, updated_at desc);

alter table public.workflows enable row level security;

drop policy if exists "workflows viewable by owner" on public.workflows;
drop policy if exists "workflows insertable by owner" on public.workflows;
drop policy if exists "workflows updatable by owner" on public.workflows;
drop policy if exists "workflows deletable by owner" on public.workflows;

create policy "workflows viewable by owner"
on public.workflows
for select
using (auth.uid() = creator_id);

create policy "workflows insertable by owner"
on public.workflows
for insert
with check (auth.uid() = creator_id);

create policy "workflows updatable by owner"
on public.workflows
for update
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "workflows deletable by owner"
on public.workflows
for delete
using (auth.uid() = creator_id);

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute procedure public.set_updated_at();