alter table public.profiles
add column if not exists is_creator boolean not null default false;
