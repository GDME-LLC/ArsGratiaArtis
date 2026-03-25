alter table public.films
  add column if not exists process_summary text,
  add column if not exists process_tags text[] not null default '{}';

alter table public.films
  drop constraint if exists films_process_tags_length_check;

alter table public.films
  add constraint films_process_tags_length_check
  check (coalesce(array_length(process_tags, 1), 0) <= 8);

with seed(name, slug, category, description, website_url, is_featured) as (
  values
    ('Runway', 'runway', 'video', 'Motion generation, shot extension, and cinematic experiments.', 'https://runwayml.com', true),
    ('Luma Dream Machine', 'luma-dream-machine', 'video', 'Prompt and image-driven motion generation for film tests.', 'https://lumalabs.ai/dream-machine', true),
    ('Pika', 'pika', 'video', 'Fast motion experiments and stylized scene ideation.', 'https://pika.art', false),
    ('Kling', 'kling', 'video', 'Cinematic motion and proof-of-concept image-to-video tests.', 'https://klingai.com', false),
    ('Midjourney', 'midjourney', 'image', 'Look development, style frames, and visual atmosphere.', 'https://www.midjourney.com', true),
    ('Krea', 'krea', 'image', 'Rapid concept exploration and image ideation.', 'https://www.krea.ai', false),
    ('FLUX', 'flux', 'image', 'Flexible image generation and model experimentation.', 'https://blackforestlabs.ai', false),
    ('ElevenLabs', 'elevenlabs', 'audio', 'Narration, dialogue tests, and multilingual voice work.', 'https://elevenlabs.io', true),
    ('Suno', 'suno', 'audio', 'Music sketches and sonic pacing references.', 'https://suno.com', false),
    ('Adobe Podcast', 'adobe-podcast', 'audio', 'Voice cleanup and recording polish.', 'https://podcast.adobe.com', false),
    ('DaVinci Resolve', 'davinci-resolve', 'post', 'Editing, grading, sound, and finishing.', 'https://www.blackmagicdesign.com/products/davinciresolve', true),
    ('Adobe Premiere Pro', 'adobe-premiere-pro', 'post', 'Editorial assembly for trailers, shorts, and films.', 'https://www.adobe.com/products/premiere.html', false),
    ('Descript', 'descript', 'post', 'Transcript-driven editing and voice-led structure work.', 'https://www.descript.com', false)
)
insert into public.tools (name, slug, category, description, website_url, is_featured)
select s.name, s.slug, s.category, s.description, s.website_url, s.is_featured
from seed s
where not exists (
  select 1 from public.tools t where lower(t.slug) = lower(s.slug)
);

with seed(name, slug, category, description, website_url, is_featured) as (
  values
    ('Runway', 'runway', 'video', 'Motion generation, shot extension, and cinematic experiments.', 'https://runwayml.com', true),
    ('Luma Dream Machine', 'luma-dream-machine', 'video', 'Prompt and image-driven motion generation for film tests.', 'https://lumalabs.ai/dream-machine', true),
    ('Pika', 'pika', 'video', 'Fast motion experiments and stylized scene ideation.', 'https://pika.art', false),
    ('Kling', 'kling', 'video', 'Cinematic motion and proof-of-concept image-to-video tests.', 'https://klingai.com', false),
    ('Midjourney', 'midjourney', 'image', 'Look development, style frames, and visual atmosphere.', 'https://www.midjourney.com', true),
    ('Krea', 'krea', 'image', 'Rapid concept exploration and image ideation.', 'https://www.krea.ai', false),
    ('FLUX', 'flux', 'image', 'Flexible image generation and model experimentation.', 'https://blackforestlabs.ai', false),
    ('ElevenLabs', 'elevenlabs', 'audio', 'Narration, dialogue tests, and multilingual voice work.', 'https://elevenlabs.io', true),
    ('Suno', 'suno', 'audio', 'Music sketches and sonic pacing references.', 'https://suno.com', false),
    ('Adobe Podcast', 'adobe-podcast', 'audio', 'Voice cleanup and recording polish.', 'https://podcast.adobe.com', false),
    ('DaVinci Resolve', 'davinci-resolve', 'post', 'Editing, grading, sound, and finishing.', 'https://www.blackmagicdesign.com/products/davinciresolve', true),
    ('Adobe Premiere Pro', 'adobe-premiere-pro', 'post', 'Editorial assembly for trailers, shorts, and films.', 'https://www.adobe.com/products/premiere.html', false),
    ('Descript', 'descript', 'post', 'Transcript-driven editing and voice-led structure work.', 'https://www.descript.com', false)
)
update public.tools t
set
  name = s.name,
  category = s.category,
  description = s.description,
  website_url = s.website_url,
  is_featured = s.is_featured
from seed s
where lower(t.slug) = lower(s.slug);

drop policy if exists "film tools can be inserted by film creator" on public.film_tools;
drop policy if exists "film tools can be deleted by film creator" on public.film_tools;

create policy "film tools can be inserted by film creator"
on public.film_tools
for insert
with check (
  exists (
    select 1
    from public.films
    where films.id = film_tools.film_id
      and films.creator_id = auth.uid()
  )
);

create policy "film tools can be deleted by film creator"
on public.film_tools
for delete
using (
  exists (
    select 1
    from public.films
    where films.id = film_tools.film_id
      and films.creator_id = auth.uid()
  )
);
