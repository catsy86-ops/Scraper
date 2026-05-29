
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS roundup_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS roundup_rule text NOT NULL DEFAULT 'nearest1',
  ADD COLUMN IF NOT EXISTS roundup_multiplier integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS interest_pct numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS sim_income numeric NOT NULL DEFAULT 8650,
  ADD COLUMN IF NOT EXISTS sim_obligations numeric NOT NULL DEFAULT 3200,
  ADD COLUMN IF NOT EXISTS advanced_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS income_growth_pct numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS obligations_growth_pct numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS raise_month integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS raise_amount numeric NOT NULL DEFAULT 0;
