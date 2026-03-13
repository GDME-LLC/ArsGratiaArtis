alter table public.films
add column if not exists mux_asset_id text,
add column if not exists mux_playback_id text;
