alter table public.films
add column if not exists category text not null default 'film';

update public.films
set category = 'film'
where category is null;

alter table public.films
drop constraint if exists films_category_check;

alter table public.films
add constraint films_category_check check (
  category in ('film', 'series', 'animation', 'experimental', 'commercial', 'educational', 'news', 'short')
);

create index if not exists films_category_public_listing_idx
  on public.films (category, publish_status, visibility, published_at desc, created_at desc);
