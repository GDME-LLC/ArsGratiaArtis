# MODERATION_WORKFLOW

This is the current manual moderation workflow for ArsGratia.

## Statuses

Films now support these moderation states:
- `active`
- `pending_review`
- `flagged`
- `removed`

Supporting fields:
- `moderation_status`
- `moderation_reason`
- `reviewed_at`
- `reviewed_by`

## What enters review

A film may enter `pending_review` when:
- it receives a report through the in-app report flow
- an operator sets the status manually in Supabase

The current app does not claim automatic video moderation.

## Public behavior

- `active`: visible on public browse surfaces and release pages
- `pending_review`: hidden from public browse surfaces and public release pages
- `flagged`: hidden from public by default
- `removed`: hidden from public

## Creator behavior

Creators can still see their own moderated releases through the dashboard.
If they open the release page directly, they see a status message such as:
- Under review
- Flagged for review
- Removed

## Manual review steps

Use Supabase table editing on `public.films`.

### Approve a film
Set:
- `moderation_status = 'active'`
- optionally clear `moderation_reason`
- set `reviewed_at` to the review timestamp
- set `reviewed_by` to the reviewing profile id

### Hold for review
Set:
- `moderation_status = 'pending_review'`
- `moderation_reason` to a short internal note
- `reviewed_at` and `reviewed_by` if someone already touched it

### Flag a film
Set:
- `moderation_status = 'flagged'`
- `moderation_reason` to the reason
- `reviewed_at`
- `reviewed_by`

### Remove a film from public view
Set:
- `moderation_status = 'removed'`
- `moderation_reason` to the reason
- `reviewed_at`
- `reviewed_by`

## Reports integration

Reports are stored in `public.reports`.
Current workflow:
- report is submitted
- film is moved to `pending_review`
- operator reviews in Supabase
- operator returns it to `active`, or moves it to `flagged` or `removed`

## What remains manual

Still manual in this stage:
- video/image content review
- copyright/takedown handling
- final enforcement decisions
- operator note-taking beyond the basic moderation fields

This is intentionally lean and operationally simple for invite-stage use.
