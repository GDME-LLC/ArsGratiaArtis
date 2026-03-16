alter table public.profiles
add column if not exists is_founding_creator boolean not null default false,
add column if not exists founding_creator_number integer,
add column if not exists founding_creator_awarded_at timestamptz,
add column if not exists founding_creator_featured boolean not null default true,
add column if not exists founding_creator_notes text,
add column if not exists founding_creator_invited_at timestamptz,
add column if not exists founding_creator_accepted_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_founding_creator_number_range_check;

  alter table public.profiles
    add constraint profiles_founding_creator_number_range_check
      check (
          founding_creator_number is null
              or founding_creator_number between 1 and 20
                );

                alter table public.profiles
                  drop constraint if exists profiles_founding_creator_state_check;

                  alter table public.profiles
                    add constraint profiles_founding_creator_state_check
                      check (
                          (is_founding_creator = false and founding_creator_number is null)
                              or (is_founding_creator = true and founding_creator_number is not null)
                                );

                                create unique index if not exists profiles_founding_creator_number_key
                                  on public.profiles (founding_creator_number)
                                    where founding_creator_number is not null;

                                    create index if not exists profiles_founding_creator_active_idx
                                      on public.profiles (is_founding_creator, founding_creator_featured, founding_creator_number);

                                      create or replace function public.enforce_founding_creator_limit()
                                      returns trigger
                                      language plpgsql
                                      as $$
                                      declare
                                        active_founder_count integer;
                                        begin
                                          if new.is_founding_creator then
                                              if new.founding_creator_number is null then
                                                    raise exception 'Founding creators must have a founder number.';
                                                        end if;

                                                            select count(*)
                                                                into active_founder_count
                                                                    from public.profiles
                                                                        where is_founding_creator = true
                                                                              and id <> new.id;

                                                                                  if active_founder_count >= 20 then
                                                                                        raise exception 'All 20 founding creator slots are already assigned.';
                                                                                            end if;

                                                                                                if new.founding_creator_awarded_at is null then
                                                                                                      new.founding_creator_awarded_at = timezone('utc', now());
                                                                                                          end if;

                                                                                                              if new.founding_creator_accepted_at is null then
                                                                                                                    new.founding_creator_accepted_at = coalesce(new.founding_creator_invited_at, timezone('utc', now()));
                                                                                                                        end if;
                                                                                                                          end if;

                                                                                                                            return new;
                                                                                                                            end;
                                                                                                                            $$;

                                                                                                                            drop trigger if exists profiles_enforce_founding_creator_limit on public.profiles;
                                                                                                                            create trigger profiles_enforce_founding_creator_limit
                                                                                                                              before insert or update on public.profiles
                                                                                                                                for each row execute procedure public.enforce_founding_creator_limit();
                                                                                                                                