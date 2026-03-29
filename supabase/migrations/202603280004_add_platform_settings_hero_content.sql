alter table public.platform_settings
  add column if not exists hero_content jsonb;

update public.platform_settings
set hero_content = jsonb_build_object(
  'motto', jsonb_build_object('text', coalesce(nullif(hero_motto, ''), 'ARS GRATIA ARTIS'), 'color', 'gold', 'size', 'md'),
  'submotto', jsonb_build_object('text', 'Art, for art''s sake', 'color', 'soft', 'size', 'md'),
  'title', jsonb_build_object('text', coalesce(nullif(hero_title, ''), 'Cinema belongs to creators again.'), 'color', 'ivory', 'size', 'md'),
  'description', jsonb_build_object('text', coalesce(nullif(hero_description, ''), 'ArsGratia is a home for AI filmmakers publishing authored work with releases, process, and presence attached.'), 'color', 'soft', 'size', 'md'),
  'panels', jsonb_build_object(
    'films', jsonb_build_object(
      'kicker', jsonb_build_object('text', 'Films', 'color', 'gold', 'size', 'md'),
      'title', jsonb_build_object('text', 'Release work with gravity', 'color', 'ivory', 'size', 'md'),
      'description', jsonb_build_object('text', 'Publish films inside a frame that feels deliberate, watchable, and worthy of the premiere.', 'color', 'soft', 'size', 'md')
    ),
    'creators', jsonb_build_object(
      'kicker', jsonb_build_object('text', 'Creators', 'color', 'gold', 'size', 'md'),
      'title', jsonb_build_object('text', 'Build a theatre around authorship', 'color', 'ivory', 'size', 'md'),
      'description', jsonb_build_object('text', 'Give each filmmaker a public presence that reads like a body of work instead of a profile stub.', 'color', 'soft', 'size', 'md')
    ),
    'resources', jsonb_build_object(
      'kicker', jsonb_build_object('text', 'Resources', 'color', 'gold', 'size', 'md'),
      'title', jsonb_build_object('text', 'Stay close to the wider field', 'color', 'ivory', 'size', 'md'),
      'description', jsonb_build_object('text', 'Keep the best tools, research, and communities nearby without letting them overwhelm the films themselves.', 'color', 'soft', 'size', 'md')
    )
  )
)
where hero_content is null;

alter table public.platform_settings
  alter column hero_content set not null,
  alter column hero_content set default '{}'::jsonb;

alter table public.platform_settings
  drop constraint if exists platform_settings_hero_content_is_object;

alter table public.platform_settings
  add constraint platform_settings_hero_content_is_object
  check (jsonb_typeof(hero_content) = 'object');
