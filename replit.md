# PetAlert Condo

A React/Vite frontend application for reporting and tracking lost pets within residential condominiums in Brazil.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, hosted on port 5000
- **Backend/Auth/DB**: Supabase (hosted, external) — handles authentication, PostgreSQL database, realtime subscriptions, and file storage
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State**: TanStack React Query

## Key Features

- User authentication (sign up / sign in / password reset) via Supabase Auth
- Lost pet alert creation with photo upload and map location picker
- Real-time alert feed with sightings and comments per condominium
- Syndic/admin dashboard with stats, charts, member management, and CSV export
- Public alert sharing page (no auth required)

## Environment Variables

Set in Replit shared environment:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key

## Development

Run with the "Start application" workflow (`npm run dev`), which starts Vite on port 5000.

## Database

Supabase project ID: `ufackkbhkghimpzlgxvr`

Schema migrations are in `supabase/migrations/`. Tables:
- `condos` — residential condominiums
- `profiles` — user profiles (linked to Supabase Auth)
- `alerts` — lost/found pet alerts
- `sightings` — pet sighting reports on alerts
- `comments` — comments on alerts
- `pets` — registered pets per user

## File Structure

```
src/
  App.tsx              — root router + providers
  contexts/AuthContext.tsx — auth state and Supabase auth wrapper
  integrations/supabase/ — Supabase client + TypeScript types
  lib/                 — data access functions (alerts, sightings, comments, storage, syndic)
  hooks/               — React hooks for data fetching
  components/          — UI components
  pages/               — route-level page components
supabase/migrations/   — SQL migration history
```
