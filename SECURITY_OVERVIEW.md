# SECURITY_OVERVIEW

## What is now protected

### Bot and spam protection
Cloudflare Turnstile is wired into:
- signup
- login
- Google auth start
- comments
- report submission
- upload initiation

Verification happens server-side and fails closed when configured.

### Rate limiting
Rate limiting is applied to:
- auth endpoints
- comments
- reports
- upload initiation
- profile updates
- release save/update endpoints

Primary production path:
- Upstash Redis REST

Fallback path:
- in-memory limiter for local/dev only

### Text moderation
Public-facing text is screened before save for:
- comments
- profile display names and bios
- release titles, synopses, and descriptions
- report free text

Primary moderation path:
- OpenAI moderation API

Fallback path:
- lightweight local heuristics for obvious spam and clearly unsafe patterns

### Upload safety
Upload initiation now checks:
- file size
- MIME type
- file extension
- suspicious/unsupported file formats

### Report abuse flow
The report page now submits into the database instead of acting as a clipboard placeholder.

Report categories:
- copyright issue
- abusive content
- spam
- impersonation
- other

### Basic hardening
Added headers:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy`

### Trust contacts
The app now exposes real-looking centralized inboxes for:
- support
- privacy
- security
- abuse
- copyright/takedown

## What is still manual

These areas are intentionally manual for the current invite-stage platform:
- media moderation review
- report triage and resolution
- staff review of flagged releases
- copyright and takedown handling
- account-level enforcement decisions

The app now has a film `moderation_status` foundation, but there is no enterprise moderation dashboard yet.

## What can wait until later

These are not required for this week’s invite-stage launch:
- real-time security analytics
- automated video or image moderation pipeline
- full admin moderation console
- appeal workflow
- advanced device fingerprinting
- geo-aware abuse detection
- full CSP rollout if it risks breaking embeds or third-party auth flows
- enterprise WAF rules beyond Turnstile + rate limiting

## Honest current position

ArsGratia now has a credible invite-stage baseline:
- bot checks
- rate limits
- text screening
- safer uploads
- a real abuse-report intake path
- clearer security and abuse contacts

What it does not yet claim:
- automated media moderation
- comprehensive trust-and-safety operations
- enterprise abuse prevention

## Manual moderation workflow
See [MODERATION_WORKFLOW.md](./MODERATION_WORKFLOW.md) for the current invite-stage review process.

