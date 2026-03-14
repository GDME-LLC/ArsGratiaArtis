alter table public.films
add column if not exists moderation_reason text,
add column if not exists reviewed_at timestamptz,
add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

drop policy if exists "films are viewable when public and published or owner" on public.films;

create policy "films are viewable when public and published or owner"
on public.films
for select
using (
  (
    publish_status = 'published'
    and visibility = 'public'
    and moderation_status = 'active'
  )
  or auth.uid() = creator_id
);
