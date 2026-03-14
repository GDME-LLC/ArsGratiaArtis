# SECURITY_SETUP

This is the minimum invite-stage safety stack for ArsGratia.

## 1. Environment variables

Copy `.env.example` to `.env.local` and set these values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`
- `OPENAI_MODERATION_MODEL` (optional, defaults to `omni-moderation-latest`)

## 2. Cloudflare Turnstile

Create a Turnstile site for your ArsGratia domain.

Use the site key as:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Use the secret key as:
- `TURNSTILE_SECRET_KEY`

Turnstile now protects:
- signup
- login
- Google auth start
- comments
- report submission
- upload initiation

## 3. Upstash Redis

Create a Redis database in Upstash and copy:
- REST URL -> `UPSTASH_REDIS_REST_URL`
- REST token -> `UPSTASH_REDIS_REST_TOKEN`

Rate limiting now applies to:
- auth endpoints
- comments
- reports
- upload initiation
- profile updates
- release save/update endpoints

If Upstash is missing, the app falls back to an in-memory limiter. That fallback is acceptable for local development, not for production.

## 4. OpenAI moderation

Add:
- `OPENAI_API_KEY`

Optional:
- `OPENAI_MODERATION_MODEL=omni-moderation-latest`

Text moderation now checks:
- comments
- profile display names and bios
- release titles, synopses, and descriptions
- report free text

If OpenAI moderation is not configured, the app still uses lightweight local heuristics for obvious spam/unsafe text, but that is only a partial fallback.

## 5. Supabase migration

Run the latest migration for film moderation status:

- `supabase/migrations/202603140004_add_film_moderation_status.sql`

This adds:
- `films.moderation_status`
- allowed values: `active`, `pending_review`, `flagged`, `removed`

## 6. Upload safety behavior

Video uploads now require:
- supported file type
- supported extension
- size under 2GB

Accepted formats:
- MP4
- MOV
- M4V
- WebM

Recommended export:
- MP4 (H.264)
- 1080p
- under 1GB when possible

## 7. Abuse and copyright inboxes

These addresses are now surfaced in the app and should be real monitored inboxes:
- `support@arsgratia.art`
- `privacy@arsgratia.art`
- `security@arsgratia.art`
- `abuse@arsgratia.art`
- `copyright@arsgratia.art`

If you want them configurable by env later, the next step is to move them out of constants and into runtime config.

