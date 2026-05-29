import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  coercePatch,
  validatePatch,
  type SettingsValidationError,
} from "@/lib/settings-schema";

export type UserSettings = {
  auto_save_enabled: boolean;
  auto_save_percent: number;
  enabled_challenges: string[];
  // Symulator
  roundup_enabled: boolean;
  roundup_rule: string;
  roundup_multiplier: number;
  interest_pct: number;
  sim_income: number;
  sim_obligations: number;
  advanced_mode: boolean;
  income_growth_pct: number;
  obligations_growth_pct: number;
  raise_month: number;
  raise_amount: number;
  // Cel oszczędnościowy
  goal_name: string;
  goal_target: number;
  goal_current: number;
};

const DEFAULTS: UserSettings = {
  auto_save_enabled: true,
  auto_save_percent: 10,
  enabled_challenges: [],
  roundup_enabled: true,
  roundup_rule: "nearest1",
  roundup_multiplier: 1,
  interest_pct: 5,
  sim_income: 8650,
  sim_obligations: 3200,
  advanced_mode: false,
  income_growth_pct: 5,
  obligations_growth_pct: 3,
  raise_month: 12,
  raise_amount: 0,
  // Cel oszczędnościowy
  goal_name: "Wakacje 2026 · Japonia",
  goal_target: 25000,
  goal_current: 0,
};

const COLUMNS =
  "auto_save_enabled, auto_save_percent, enabled_challenges, roundup_enabled, roundup_rule, roundup_multiplier, interest_pct, sim_income, sim_obligations, advanced_mode, income_growth_pct, obligations_growth_pct, raise_month, raise_amount, goal_name, goal_target, goal_current";

export function useUserSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof UserSettings, string>>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);
  const greetedFor = useRef<string | null>(null);

  useEffect(() => {
    // Reset stanu przy zmianie użytkownika (logowanie / wylogowanie),
    // żeby nie wycieknięto wartości z poprzedniej sesji.
    initialized.current = false;
    setSynced(false);

    if (!userId) {
      setSettings(DEFAULTS);
      setSyncedAt(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select(COLUMNS)
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error(error);
        toast.error("Nie udało się załadować ustawień");
      } else {
        if (data) {
          setSettings({
            ...DEFAULTS,
            ...data,
            enabled_challenges: data.enabled_challenges ?? [],
          } as UserSettings);
        } else {
          setSettings(DEFAULTS);
        }
        setSynced(true);
        setSyncedAt(new Date());
        // Pokaż jednorazowy toast po zalogowaniu — nie powtarzaj
        // przy każdym remount-cie hooka dla tego samego użytkownika.
        if (greetedFor.current !== userId) {
          greetedFor.current = userId;
          toast.success(
            data ? "Ustawienia symulacji wczytane" : "Utworzono nowy zestaw ustawień",
            { description: "Zsynchronizowano z Twoim profilem." },
          );
        }
      }
      initialized.current = true;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (next: UserSettings) => {
      if (!userId) return;
      setSaving(true);
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          { user_id: userId, ...next },
          { onConflict: "user_id" },
        );
      setSaving(false);
      if (error) {
        console.error(error);
        toast.error("Nie udało się zapisać ustawień");
      }
    },
    [userId],
  );

  const update = useCallback(
    (patch: Partial<UserSettings>): { ok: boolean; errors?: SettingsValidationError[] } => {
      let outcome: { ok: boolean; errors?: SettingsValidationError[] } = { ok: true };

      setSettings((prev) => {
        // Najpierw autokorekta — zaokrągl do dozwolonego zakresu, snapuj enumy.
        const { patch: fixedPatch, corrections } = coercePatch(prev, patch);

        if (corrections.length > 0) {
          // Pokaż jeden zwięzły komunikat o korekcie.
          const first = corrections[0];
          const extra = corrections.length > 1 ? ` (+${corrections.length - 1})` : "";
          toast.message("Skorygowano wartość", {
            description: `${first.reason}${extra}`,
          });
        }

        const result = validatePatch(prev, fixedPatch);

        if (!result.ok) {
          outcome = { ok: false, errors: result.errors };
          setErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            for (const e of result.errors) nextErrors[e.field] = e.message;
            return nextErrors;
          });
          toast.error(result.errors[0]?.message ?? "Nieprawidłowa wartość");
          return prev;
        }

        // Sukces — wyczyść błędy dla pól ze zmienianych wartości.
        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          for (const k of Object.keys(fixedPatch) as (keyof UserSettings)[]) delete nextErrors[k];
          return nextErrors;
        });

        if (initialized.current && userId) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => persist(result.next), 400);
        }
        return result.next;
      });

      return outcome;
    },
    [persist, userId],
  );

  const clearError = useCallback((field: keyof UserSettings) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { settings, update, loading, saving, synced, syncedAt, errors, clearError };
}
