# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run preview` — Preview production build locally

No test framework is configured.

## Environment Setup

Copy `.env.example` to `.env` and set:
- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anon/public key

Run `supabase/migrations.sql` in the Supabase SQL editor to create all tables, RLS policies, and the auto-profile trigger.

## Architecture

Single-page React app (Vite + Tailwind CSS v4 + Supabase). No separate backend — all data access goes directly through the Supabase JS client with Row Level Security.

### Routing & Auth Flow

`App.jsx` sets up BrowserRouter with three routes: `/login` (AuthPage), `/dashboard` (protected), and catch-all redirect to `/dashboard`. `ProtectedRoute` checks auth state and redirects unauthenticated users to `/login`. Auth state is managed via `AuthContext` which wraps the entire app and uses Supabase's `onAuthStateChange` listener to persist sessions.

### Dashboard Layout

`Dashboard.jsx` is the main shell with a sticky top navbar, responsive left sidebar (three nav items: Tracks, Journeys, Score), and a main content area that conditionally renders one of three panel components. When a ritual is active, the entire dashboard is replaced with a full-screen `DailyRitual` view.

### Key Data Flow

- **Tracks → Habits → Completions**: Tracks belong to a user, habits belong to a track, completions reference both a habit and a user.
- **Journeys**: Hardcoded templates in `JourneysPanel.jsx` (not in the database). "Add to My Tracks" clones a journey's habits into a new track via Supabase inserts.
- **Daily Ritual**: Launched from an expanded track's "Start" button. Runs habits sequentially with a countdown timer, writes a `completions` row on each "Done", shows summary at the end.

### Database Schema (4 tables, all with RLS)

- `users` — mirrors `auth.users`, auto-created via trigger on signup
- `tracks` — `user_id`, `name`, `color`; RLS scoped to owner
- `habits` — `track_id`, `name`, `duration_minutes`, `sort_order`; RLS checks track ownership via join
- `completions` — `habit_id`, `user_id`, `completed_at`; RLS scoped to owner

### Styling Conventions

Dark theme using inline Tailwind color values (not CSS variables or a custom config):
- Background: `#0f1117`, surfaces: `#1a1d27`, borders: `#2e3250`
- Primary accent: `#6c63ff`, success: `#43e97b`, text: `#e8eaf6`, muted: `#7b82b0`
- Font: Inter via Google Fonts CDN
- Tailwind v4 with `@tailwindcss/vite` plugin (no `tailwind.config.js` file)
