drop policy if exists "comments can be inserted by author on accessible films" on public.comments;

create policy "comments can be inserted by author on public published films"
on public.comments
for insert
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.films
    where films.id = comments.film_id
      and films.publish_status = 'published'
      and films.visibility = 'public'
  )
);
