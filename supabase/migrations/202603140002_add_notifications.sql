create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  read boolean not null default false,
  constraint notifications_type_check check (
    type in ('like', 'comment', 'follow', 'staff_pick', 'featured')
  )
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_id_read_idx
  on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications are viewable by recipient"
on public.notifications
for select
using (auth.uid() = user_id);

create policy "notifications can be updated by recipient"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.create_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
begin
  select creator_id into recipient_id
  from public.films
  where id = new.film_id;

  if recipient_id is not null and recipient_id <> new.profile_id then
    insert into public.notifications (user_id, type, entity_id)
    values (recipient_id, 'like', new.film_id);
  end if;

  return new;
end;
$$;

create or replace function public.create_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
begin
  select creator_id into recipient_id
  from public.films
  where id = new.film_id;

  if recipient_id is not null and recipient_id <> new.author_id then
    insert into public.notifications (user_id, type, entity_id)
    values (recipient_id, 'comment', new.film_id);
  end if;

  return new;
end;
$$;

create or replace function public.create_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.creator_id <> new.follower_id then
    insert into public.notifications (user_id, type, entity_id)
    values (new.creator_id, 'follow', new.follower_id);
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_on_film_like on public.film_likes;
create trigger notifications_on_film_like
  after insert on public.film_likes
  for each row execute procedure public.create_like_notification();

drop trigger if exists notifications_on_comment on public.comments;
create trigger notifications_on_comment
  after insert on public.comments
  for each row execute procedure public.create_comment_notification();

drop trigger if exists notifications_on_creator_follow on public.creator_follows;
create trigger notifications_on_creator_follow
  after insert on public.creator_follows
  for each row execute procedure public.create_follow_notification();
