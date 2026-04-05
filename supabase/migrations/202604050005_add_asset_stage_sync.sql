-- Phase 3: Asset stage sync and film carry-through

-- Add linked_film_id to workflow_assets so assets are tracked when a draft is seeded into a film
alter table public.workflow_assets
  add column if not exists linked_film_id uuid references public.films (id) on delete set null;

create index if not exists workflow_assets_film_idx
  on public.workflow_assets (linked_film_id, stage, sort_order)
  where linked_film_id is not null;

-- Track last platform sync time per integration
alter table public.creator_integrations
  add column if not exists last_synced_at timestamptz;
