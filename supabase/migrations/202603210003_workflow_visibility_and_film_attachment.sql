alter table public.workflows
  add column if not exists visibility_scope text not null default 'private',
  add column if not exists attached_film_id uuid references public.films (id) on delete set null;

alter table public.workflows
  drop constraint if exists workflows_visibility_scope_check;

alter table public.workflows
  add constraint workflows_visibility_scope_check check (
    visibility_scope in ('private', 'theatre', 'film_page', 'theatre_and_film')
  );

create index if not exists workflows_visibility_scope_idx on public.workflows (creator_id, visibility_scope, updated_at desc);
create index if not exists workflows_attached_film_id_idx on public.workflows (attached_film_id) where attached_film_id is not null;

update public.workflows
set visibility_scope = 'private'
where visibility_scope is null;

drop policy if exists "workflows viewable by owner" on public.workflows;
create policy "workflows viewable by owner or public visibility"
on public.workflows
for select
using (
  auth.uid() = creator_id
  or visibility_scope <> 'private'
);
