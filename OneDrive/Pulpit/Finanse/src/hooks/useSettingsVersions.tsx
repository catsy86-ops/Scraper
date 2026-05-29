import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserSettings } from "./useUserSettings";

export type SettingsVersion = {
  id: string;
  created_at: string;
  label: string | null;
  snapshot: Partial<UserSettings>;
};

const VERSIONED_KEYS: (keyof UserSettings)[] = [
  "auto_save_enabled",
  "auto_save_percent",
  "enabled_challenges",
  "roundup_enabled",
  "roundup_rule",
  "roundup_multiplier",
  "interest_pct",
  "sim_income",
  "sim_obligations",
  "advanced_mode",
  "income_growth_pct",
  "obligations_growth_pct",
  "raise_month",
  "raise_amount",
];

export function useSettingsVersions(userId: string | undefined, refreshKey: number) {
  const [versions, setVersions] = useState<SettingsVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setVersions([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_settings_versions")
      .select("id, created_at, label, snapshot")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    setVersions((data ?? []) as SettingsVersion[]);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { versions, loading, reload: load };
}

export function pickRestorable(snapshot: Partial<UserSettings>): Partial<UserSettings> {
  const out: Partial<UserSettings> = {};
  for (const k of VERSIONED_KEYS) {
    if (snapshot[k] !== undefined) {
      // @ts-expect-error narrow by key
      out[k] = snapshot[k];
    }
  }
  return out;
}

export async function deleteVersion(id: string) {
  const { error } = await supabase.from("user_settings_versions").delete().eq("id", id);
  if (error) {
    console.error(error);
    toast.error("Nie udało się usunąć wersji");
    return false;
  }
  return true;
}
