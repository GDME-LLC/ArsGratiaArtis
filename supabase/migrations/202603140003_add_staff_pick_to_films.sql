alter table public.films
add column if not exists staff_pick boolean not null default false;

update public.films
set staff_pick = true
where staff_pick = false
  and coalesce(is_featured, false) = true;

create index if not exists films_staff_pick_public_listing_idx
  on public.films (staff_pick, publish_status, visibility, created_at desc, published_at desc);
