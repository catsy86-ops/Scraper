import { z } from "zod";
import type { UserSettings } from "@/hooks/useUserSettings";

export const ROUNDUP_RULES = ["nearest1", "nearest2", "nearest5", "nearest10"] as const;
export const ROUNDUP_MULTIPLIERS = [1, 2, 5] as const;

const intInRange = (min: number, max: number, label: string) =>
  z
    .number({ invalid_type_error: `${label}: wpisz liczbę` })
    .finite(`${label}: wartość musi być skończona`)
    .int(`${label}: dozwolone tylko liczby całkowite`)
    .min(min, `${label}: minimum to ${min}`)
    .max(max, `${label}: maksimum to ${max}`);

const numInRange = (min: number, max: number, label: string) =>
  z
    .number({ invalid_type_error: `${label}: wpisz liczbę` })
    .finite(`${label}: wartość musi być skończona`)
    .min(min, `${label}: minimum to ${min}`)
    .max(max, `${label}: maksimum to ${max}`);

export const settingsSchema = z
  .object({
    auto_save_enabled: z.boolean(),
    auto_save_percent: intInRange(1, 40, "Procent Auto-Sejfu"),
    enabled_challenges: z.array(z.string().max(64)).max(50),

    roundup_enabled: z.boolean(),
    roundup_rule: z.enum(ROUNDUP_RULES, {
      errorMap: () => ({ message: "Round-Up: wybierz jedną z dostępnych reguł" }),
    }),
    roundup_multiplier: z
      .number()
      .refine((v) => (ROUNDUP_MULTIPLIERS as readonly number[]).includes(v), {
        message: "Round-Up: dozwolone mnożniki to 1×, 2× lub 5×",
      }),

    interest_pct: numInRange(0, 10, "Oprocentowanie"),
    sim_income: numInRange(2000, 25000, "Miesięczny wpływ"),
    sim_obligations: numInRange(0, 15000, "Zobowiązania"),

    advanced_mode: z.boolean(),
    income_growth_pct: numInRange(0, 20, "Wzrost dochodu"),
    obligations_growth_pct: numInRange(0, 15, "Wzrost zobowiązań"),
    raise_month: intInRange(1, 24, "Miesiąc podwyżki"),
    raise_amount: numInRange(0, 5000, "Skokowa podwyżka"),

    // Cel oszczędnościowy
    goal_name: z.string().min(1, "Podaj nazwę celu").max(120, "Nazwa celu jest za długa"),
    goal_target: numInRange(1, 10_000_000, "Cel oszczędnościowy"),
    goal_current: numInRange(0, 10_000_000, "Odłożona kwota"),
  })
  .superRefine((s, ctx) => {
    if (s.sim_obligations > s.sim_income) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sim_obligations"],
        message: "Zobowiązania nie mogą przekraczać miesięcznego wpływu",
      });
    }
    if (s.goal_current > s.goal_target) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["goal_current"],
        message: "Odłożona kwota nie może przekraczać celu",
      });
    }
  });

// Zakresy używane przez autokorektę. Trzymamy je w jednym miejscu,
// aby walidacja i clamp pozostały spójne.
export const FIELD_RANGES = {
  auto_save_percent: { min: 1, max: 40, int: true },
  interest_pct: { min: 0, max: 10 },
  sim_income: { min: 2000, max: 25000 },
  sim_obligations: { min: 0, max: 15000 },
  income_growth_pct: { min: 0, max: 20 },
  obligations_growth_pct: { min: 0, max: 15 },
  raise_month: { min: 1, max: 24, int: true },
  raise_amount: { min: 0, max: 5000 },
  goal_target: { min: 1, max: 10_000_000 },
  goal_current: { min: 0, max: 10_000_000 },
} as const;

const clampNum = (v: number, min: number, max: number, int = false) => {
  if (!Number.isFinite(v)) return min;
  let x = Math.min(max, Math.max(min, v));
  if (int) x = Math.round(x);
  return x;
};

const snapTo = <T,>(v: unknown, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly unknown[]).includes(v as unknown) ? (v as T) : fallback;

export type CoerceCorrection = {
  field: keyof UserSettings;
  from: unknown;
  to: unknown;
  reason: string;
};

/**
 * Zaokrągla wartości w łatce do dozwolonego zakresu/zbioru zamiast je
 * odrzucać. Zwraca poprawioną łatkę oraz listę zastosowanych korekt.
 */
export function coercePatch(
  current: UserSettings,
  patch: Partial<UserSettings>,
): { patch: Partial<UserSettings>; corrections: CoerceCorrection[] } {
  const out: Partial<UserSettings> = { ...patch };
  const corrections: CoerceCorrection[] = [];

  const fixNumber = (key: keyof typeof FIELD_RANGES, label: string) => {
    if (!(key in out)) return;
    const raw = out[key as keyof UserSettings] as unknown;
    const r = FIELD_RANGES[key];
    const num = typeof raw === "number" ? raw : Number(raw);
    const fixed = clampNum(num, r.min, r.max, "int" in r ? r.int : false);
    if (fixed !== raw) {
      corrections.push({
        field: key as keyof UserSettings,
        from: raw,
        to: fixed,
        reason: `${label}: dopasowano do zakresu ${r.min}–${r.max}`,
      });
      (out as Record<string, unknown>)[key] = fixed;
    }
  };

  fixNumber("auto_save_percent", "Procent Auto-Sejfu");
  fixNumber("interest_pct", "Oprocentowanie");
  fixNumber("sim_income", "Miesięczny wpływ");
  fixNumber("sim_obligations", "Zobowiązania");
  fixNumber("income_growth_pct", "Wzrost dochodu");
  fixNumber("obligations_growth_pct", "Wzrost zobowiązań");
  fixNumber("raise_month", "Miesiąc podwyżki");
  fixNumber("raise_amount", "Skokowa podwyżka");
  fixNumber("goal_target", "Cel oszczędnościowy");
  fixNumber("goal_current", "Odłożona kwota");

  if ("roundup_rule" in out) {
    const snapped = snapTo(out.roundup_rule, ROUNDUP_RULES, "nearest1");
    if (snapped !== out.roundup_rule) {
      corrections.push({
        field: "roundup_rule",
        from: out.roundup_rule,
        to: snapped,
        reason: "Round-Up: wybrano domyślną regułę",
      });
      out.roundup_rule = snapped;
    }
  }

  if ("roundup_multiplier" in out) {
    const v = Number(out.roundup_multiplier);
    // Wybierz najbliższy dozwolony mnożnik.
    const nearest = ROUNDUP_MULTIPLIERS.reduce((best, m) =>
      Math.abs(m - v) < Math.abs(best - v) ? m : best,
    1 as number);
    if (nearest !== out.roundup_multiplier) {
      corrections.push({
        field: "roundup_multiplier",
        from: out.roundup_multiplier,
        to: nearest,
        reason: `Round-Up: zaokrąglono mnożnik do ×${nearest}`,
      });
      out.roundup_multiplier = nearest;
    }
  }

  // Spójność dochód/zobowiązania — preferujemy zbicie zobowiązań do dochodu.
  const nextIncome = (out.sim_income ?? current.sim_income) as number;
  const nextOblig = (out.sim_obligations ?? current.sim_obligations) as number;
  if (nextOblig > nextIncome) {
    corrections.push({
      field: "sim_obligations",
      from: nextOblig,
      to: nextIncome,
      reason: "Zobowiązania ograniczono do wysokości wpływu",
    });
    out.sim_obligations = nextIncome;
  }

  return { patch: out, corrections };
}

export type SettingsValidationError = {
  field: keyof UserSettings;
  message: string;
};

export function validatePatch(
  current: UserSettings,
  patch: Partial<UserSettings>,
): { ok: true; next: UserSettings } | { ok: false; errors: SettingsValidationError[] } {
  const next = { ...current, ...patch };
  const result = settingsSchema.safeParse(next);
  if (result.success) return { ok: true, next: result.data as UserSettings };

  const patchKeys = new Set(Object.keys(patch));
  const all = result.error.issues.map((i) => ({
    field: (i.path[0] as keyof UserSettings) ?? ("auto_save_percent" as const),
    message: i.message,
  }));
  // Pokazuj wyłącznie błędy dotyczące pól zmienianych w tym wywołaniu,
  // żeby nie zalewać użytkownika historycznymi problemami.
  const relevant = all.filter((e) => patchKeys.has(e.field as string));
  return { ok: false, errors: relevant.length > 0 ? relevant : all };
}
