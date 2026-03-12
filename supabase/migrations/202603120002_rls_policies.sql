alter table public.profiles enable row level security;
alter table public.films enable row level security;
alter table public.tags enable row level security;
alter table public.film_tags enable row level security;
alter table public.tools enable row level security;
alter table public.film_tools enable row level security;
alter table public.resources enable row level security;
alter table public.comments enable row level security;
alter table public.film_likes enable row level security;
alter table public.creator_follows enable row level security;
alter table public.reports enable row level security;

create policy "profiles are viewable when public or owner"
on public.profiles
for select
using (is_public = true or auth.uid() = id);

create policy "profiles can be inserted by owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles can be updated by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "films are viewable when public and published or owner"
on public.films
for select
using (
  (publish_status = 'published' and visibility = 'public')
  or auth.uid() = creator_id
);

create policy "films can be inserted by creator"
on public.films
for insert
with check (auth.uid() = creator_id);

create policy "films can be updated by creator"
on public.films
for update
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

create policy "films can be deleted by creator"
on public.films
for delete
using (auth.uid() = creator_id);

create policy "tags are publicly readable"
on public.tags
for select
using (true);

create policy "film tags are publicly readable for public films"
on public.film_tags
for select
using (
  exists (
    select 1
    from public.films
    where films.id = film_tags.film_id
      and (
        (films.publish_status = 'published' and films.visibility = 'public')
        or films.creator_id = auth.uid()
      )
  )
);

create policy "tools are publicly readable"
on public.tools
for select
using (true);

create policy "film tools are publicly readable for public films"
on public.film_tools
for select
using (
  exists (
    select 1
    from public.films
    where films.id = film_tools.film_id
      and (
        (films.publish_status = 'published' and films.visibility = 'public')
        or films.creator_id = auth.uid()
      )
  )
);

create policy "resources are viewable when public and published or owner"
on public.resources
for select
using (
  (publish_status = 'published' and visibility = 'public')
  or auth.uid() = created_by
);

create policy "resources can be inserted by creator"
on public.resources
for insert
with check (auth.uid() = created_by);

create policy "resources can be updated by creator"
on public.resources
for update
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy "resources can be deleted by creator"
on public.resources
for delete
using (auth.uid() = created_by);

create policy "comments are viewable on public films or by owner"
on public.comments
for select
using (
  (
    is_deleted = false
    and exists (
      select 1
      from public.films
      where films.id = comments.film_id
        and films.publish_status = 'published'
        and films.visibility = 'public'
    )
  )
  or auth.uid() = author_id
  or exists (
    select 1
    from public.films
    where films.id = comments.film_id
      and films.creator_id = auth.uid()
  )
);

create policy "comments can be inserted by author on accessible films"
on public.comments
for insert
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.films
    where films.id = comments.film_id
      and (
        (films.publish_status = 'published' and films.visibility = 'public')
        or films.creator_id = auth.uid()
      )
  )
);

create policy "comments can be updated by author"
on public.comments
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "comments can be deleted by author"
on public.comments
for delete
using (auth.uid() = author_id);

create policy "film likes are viewable for public films or by film owner"
on public.film_likes
for select
using (
  exists (
    select 1
    from public.films
    where films.id = film_likes.film_id
      and (
        (films.publish_status = 'published' and films.visibility = 'public')
        or films.creator_id = auth.uid()
      )
  )
);

create policy "film likes can be inserted by liker"
on public.film_likes
for insert
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.films
    where films.id = film_likes.film_id
      and (
        (films.publish_status = 'published' and films.visibility = 'public')
        or films.creator_id = auth.uid()
      )
  )
);

create policy "film likes can be deleted by liker"
on public.film_likes
for delete
using (auth.uid() = profile_id);

create policy "creator follows are publicly readable"
on public.creator_follows
for select
using (true);

create policy "creator follows can be inserted by follower"
on public.creator_follows
for insert
with check (auth.uid() = follower_id);

create policy "creator follows can be deleted by follower"
on public.creator_follows
for delete
using (auth.uid() = follower_id);

create policy "reports can be inserted by reporter"
on public.reports
for insert
with check (auth.uid() = reporter_id);
