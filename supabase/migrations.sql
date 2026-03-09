-- MomentumOS Database Schema
-- Run this in your Supabase SQL editor to set up all tables and RLS policies.

-- ============================================================
-- Enable UUID extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- Mirrors auth.users with additional profile data
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRACKS TABLE
-- Represents categories/areas of life the user wants to track
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tracks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6c63ff',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracks"
  ON public.tracks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks"
  ON public.tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON public.tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON public.tracks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tracks_user_id_idx ON public.tracks(user_id);

-- ============================================================
-- HABITS TABLE
-- Individual habits belonging to a track
-- ============================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id          UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 0,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- RLS via tracks join — only the track owner can access habits
CREATE POLICY "Users can view habits in their tracks"
  ON public.habits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = habits.track_id
        AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert habits into their tracks"
  ON public.habits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = habits.track_id
        AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update habits in their tracks"
  ON public.habits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = habits.track_id
        AND tracks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete habits in their tracks"
  ON public.habits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = habits.track_id
        AND tracks.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS habits_track_id_idx ON public.habits(track_id);

-- ============================================================
-- COMPLETIONS TABLE
-- Records each time a user completes a habit
-- ============================================================
CREATE TABLE IF NOT EXISTS public.completions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id      UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completions"
  ON public.completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
  ON public.completions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS completions_user_id_idx ON public.completions(user_id);
CREATE INDEX IF NOT EXISTS completions_habit_id_idx ON public.completions(habit_id);
CREATE INDEX IF NOT EXISTS completions_completed_at_idx ON public.completions(completed_at DESC);

-- ============================================================
-- USER SETTINGS TABLE
-- Per-user preferences: theme, dark mode, habit defaults
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  theme_color       TEXT NOT NULL DEFAULT '#6c63ff',
  dark_mode         BOOLEAN NOT NULL DEFAULT TRUE,
  default_duration  INTEGER NOT NULL DEFAULT 10,
  reminder_time     TEXT NOT NULL DEFAULT '09:00',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);
