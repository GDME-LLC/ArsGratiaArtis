alter table public.films
add column if not exists moderation_status text not null default 'active';

alter table public.films
drop constraint if exists films_moderation_status_check;

alter table public.films
add constraint films_moderation_status_check check (
  moderation_status in ('active', 'pending_review', 'flagged', 'removed')
);

create index if not exists films_moderation_status_idx
  on public.films (moderation_status, publish_status, visibility, created_at desc, published_at desc);
