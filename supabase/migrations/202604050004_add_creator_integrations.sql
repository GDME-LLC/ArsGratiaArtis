-- Add creator_integrations table for Phase 2 platform account connections
create table if not exists public.creator_integrations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  api_key text not null,
  is_active boolean not null default true,
  connected_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz,
  constraint creator_integrations_platform_check check (platform in ('runway', 'elevenlabs')),
  constraint creator_integrations_api_key_length check (char_length(trim(api_key)) between 8 and 512),
  unique (creator_id, platform)
);

create index if not exists creator_integrations_creator_idx
  on public.creator_integrations (creator_id, platform);

alter table public.creator_integrations enable row level security;

drop policy if exists "creator integrations are viewable by owner" on public.creator_integrations;
drop policy if exists "creator integrations are insertable by owner" on public.creator_integrations;
drop policy if exists "creator integrations are updatable by owner" on public.creator_integrations;
drop policy if exists "creator integrations are deletable by owner" on public.creator_integrations;

create policy "creator integrations are viewable by owner"
on public.creator_integrations
for select
using (auth.uid() = creator_id);

create policy "creator integrations are insertable by owner"
on public.creator_integrations
for insert
with check (auth.uid() = creator_id);

create policy "creator integrations are updatable by owner"
on public.creator_integrations
for update
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "creator integrations are deletable by owner"
on public.creator_integrations
for delete
using (auth.uid() = creator_id);

-- Extend workflow_assets with external platform metadata columns
alter table public.workflow_assets
  add column if not exists external_asset_id text,
  add column if not exists external_project_id text,
  add column if not exists source_metadata jsonb;

create index if not exists workflow_assets_external_idx
  on public.workflow_assets (creator_id, external_asset_id)
  where source_type in ('runway', 'elevenlabs');

-- Extend asset_type check to include 'import' (direct platform imports)
alter table public.workflow_assets
  drop constraint if exists workflow_assets_asset_type_check;

alter table public.workflow_assets
  add constraint workflow_assets_asset_type_check
  check (asset_type in ('link', 'upload', 'import'));

-- Extend url_or_file check to allow imports (url required, file_path optional)
alter table public.workflow_assets
  drop constraint if exists workflow_assets_url_or_file;

alter table public.workflow_assets
  add constraint workflow_assets_url_or_file
  check (
    (asset_type = 'link' and url is not null and trim(url) <> '') or
    (asset_type = 'upload' and file_path is not null and trim(file_path) <> '') or
    (asset_type = 'import' and url is not null and trim(url) <> '' and external_asset_id is not null)
  );
