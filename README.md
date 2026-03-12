# ArsGratia

ArsGratia is a creator-first AI cinema platform for publishing films, building creator profiles, and connecting finished work to filmmaking tools and resources. The current project is a lean Next.js v1 scaffold with a dark cinematic UI and Supabase auth wiring.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component conventions
- Supabase Auth SSR helpers

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with the required variables below.
3. In Supabase Auth settings, set:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
4. Start the app:
   ```bash
   npm run dev
   ```

## Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Run Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current Implemented Scope

- App Router project structure for marketing, auth, app, and API routes
- Cinematic global shell with header, footer, and homepage hero
- Placeholder pages for manifesto, feed, resources, dashboard, and upload
- Supabase browser/server auth helpers
- Login and signup pages with email/password auth
- Google OAuth trigger wired through Supabase
- Auth callback route for session exchange

## Next Milestone

Protect authenticated routes, connect dashboard state to the active user session, and begin the first real creator workflow: uploading and publishing a film.
