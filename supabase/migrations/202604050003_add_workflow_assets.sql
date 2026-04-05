create table if not exists public.workflow_assets (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.workflow_drafts (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  asset_type text not null default 'link',
  source_type text not null default 'generic',
  url text,
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  stage text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint workflow_assets_label_length check (char_length(trim(label)) between 1 and 120),
  constraint workflow_assets_asset_type_check check (asset_type in ('link', 'upload')),
  constraint workflow_assets_source_type_check check (source_type in ('runway', 'elevenlabs', 'generic')),
  constraint workflow_assets_url_or_file check (
    (asset_type = 'link' and url is not null and trim(url) <> '') or
    (asset_type = 'upload' and file_path is not null and trim(file_path) <> '')
  )
);

create index if not exists workflow_assets_draft_idx
  on public.workflow_assets (draft_id, sort_order, created_at);

create index if not exists workflow_assets_creator_idx
  on public.workflow_assets (creator_id, created_at desc);

alter table public.workflow_assets enable row level security;

drop policy if exists "workflow assets are viewable by owner" on public.workflow_assets;
drop policy if exists "workflow assets are insertable by owner" on public.workflow_assets;
drop policy if exists "workflow assets are deletable by owner" on public.workflow_assets;

create policy "workflow assets are viewable by owner"
on public.workflow_assets
for select
using (auth.uid() = creator_id);

create policy "workflow assets are insertable by owner"
on public.workflow_assets
for insert
with check (auth.uid() = creator_id);

create policy "workflow assets are deletable by owner"
on public.workflow_assets
for delete
using (auth.uid() = creator_id);
