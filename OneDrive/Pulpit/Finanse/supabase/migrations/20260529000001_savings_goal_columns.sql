-- Dodaje kolumny celu oszczędnościowego do user_settings
-- Cel był wcześniej przechowywany tylko w localStorage — teraz trafia do Supabase.

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS goal_name TEXT NOT NULL DEFAULT 'Mój cel oszczędnościowy',
  ADD COLUMN IF NOT EXISTS goal_target NUMERIC NOT NULL DEFAULT 10000 CHECK (goal_target > 0),
  ADD COLUMN IF NOT EXISTS goal_current NUMERIC NOT NULL DEFAULT 0 CHECK (goal_current >= 0);
