# MomentumOS

A single-page habit tracking app built with React, Tailwind CSS, and Supabase. Create tracks, build daily rituals, and visualize your momentum over time.

## Features

- **Tracks** — Organize habits by life area with custom colors
- **Journeys** — Starter templates (Study Sprint, Morning Ritual, Career Growth) that clone into your tracks
- **Daily Ritual** — Sequential habit timer with countdown, progress ring, and completion logging
- **Momentum Score** — Daily score (0–100) based on track completion percentage and cross-track streak
- **Streak Tracker** — Per-track 30-day calendar heatmaps colored by track
- **Responsive** — Desktop sidebar, mobile bottom navigation

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Supabase (Auth, Postgres, RLS)
- **Deployment**: Vercel

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd MomentumOS
npm install
```

### 2. Supabase project

Create a project at [supabase.com](https://supabase.com) and run the SQL migration in the SQL Editor:

```bash
# The migration file is at:
supabase/migrations.sql
```

This creates 4 tables (`users`, `tracks`, `habits`, `completions`) with Row Level Security policies and a trigger to auto-create user profiles on signup.

### 3. Environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Set environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Vercel auto-detects the Vite framework — no build config changes needed
5. The included `vercel.json` handles SPA routing rewrites

### Pre-deploy checklist

- [ ] Run `supabase/migrations.sql` in your Supabase SQL Editor
- [ ] Verify RLS is enabled on all tables (users, tracks, habits, completions)
- [ ] Confirm environment variables are set in Vercel project settings
- [ ] Enable email auth in Supabase Auth settings

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
