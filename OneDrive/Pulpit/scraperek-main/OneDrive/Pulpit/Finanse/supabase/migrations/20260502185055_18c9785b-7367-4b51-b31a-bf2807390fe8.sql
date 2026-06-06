-- Version history for user_settings (simulator snapshots)
CREATE TABLE public.user_settings_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_settings_versions_user_created
  ON public.user_settings_versions (user_id, created_at DESC);

ALTER TABLE public.user_settings_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own setting versions"
ON public.user_settings_versions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own setting versions"
ON public.user_settings_versions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own setting versions"
ON public.user_settings_versions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Trigger: each meaningful UPDATE on user_settings creates a snapshot of the OLD row,
-- and trims history to the most recent 20 versions per user.
CREATE OR REPLACE FUNCTION public.snapshot_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_json JSONB;
  new_json JSONB;
BEGIN
  old_json := to_jsonb(OLD) - 'updated_at' - 'created_at' - 'user_id';
  new_json := to_jsonb(NEW) - 'updated_at' - 'created_at' - 'user_id';

  IF old_json IS DISTINCT FROM new_json THEN
    INSERT INTO public.user_settings_versions (user_id, snapshot)
    VALUES (OLD.user_id, old_json);

    DELETE FROM public.user_settings_versions
    WHERE user_id = OLD.user_id
      AND id NOT IN (
        SELECT id FROM public.user_settings_versions
        WHERE user_id = OLD.user_id
        ORDER BY created_at DESC
        LIMIT 20
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER user_settings_snapshot
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.snapshot_user_settings();