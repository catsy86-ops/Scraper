import { describe, it, expect } from "vitest";
import {
  validatePatch,
  coercePatch,
  settingsSchema,
  FIELD_RANGES,
  ROUNDUP_MULTIPLIERS,
} from "./settings-schema";
import type { UserSettings } from "@/hooks/useUserSettings";

const base: UserSettings = {
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
};

type NumericField = keyof typeof FIELD_RANGES;

const NUMERIC_FIELDS: NumericField[] = [
  "auto_save_percent",
  "interest_pct",
  "sim_income",
  "sim_obligations",
  "income_growth_pct",
  "obligations_growth_pct",
  "raise_month",
  "raise_amount",
];

// Aby testy cross-field nie ingerowały — używamy bazy z minimalnymi
// zobowiązaniami, więc zmiana sim_income w górę nie wywoła reguły
// "obligations > income".
const safeBase: UserSettings = { ...base, sim_obligations: 0 };

describe("walidacja – skrajne wartości min/max dla pól numerycznych", () => {
  it.each(NUMERIC_FIELDS)("akceptuje dokładnie min i max dla %s", (field) => {
    const r = FIELD_RANGES[field];
    // Dla sim_obligations max=15000 > defaultowy sim_income=8650 — podbij wpływ.
    const localBase: UserSettings =
      field === "sim_obligations" ? { ...safeBase, sim_income: 25000 } : safeBase;
    const patchMin = { [field]: r.min } as Partial<UserSettings>;
    const patchMax = { [field]: r.max } as Partial<UserSettings>;
    expect(validatePatch(localBase, patchMin).ok).toBe(true);
    expect(validatePatch(localBase, patchMax).ok).toBe(true);
  });

  it.each(NUMERIC_FIELDS)("odrzuca min-1 i max+1 dla %s", (field) => {
    const r = FIELD_RANGES[field];
    const isInt = "int" in r && r.int;
    const step = isInt ? 1 : 0.0001;
    expect(validatePatch(safeBase, { [field]: r.min - step } as Partial<UserSettings>).ok).toBe(
      false,
    );
    expect(validatePatch(safeBase, { [field]: r.max + step } as Partial<UserSettings>).ok).toBe(
      false,
    );
  });
});

describe("walidacja – Infinity / -Infinity / NaN dla wszystkich pól numerycznych", () => {
  const bad = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN];

  it.each(NUMERIC_FIELDS)("%s: każde z [+Inf, -Inf, NaN] jest odrzucane", (field) => {
    for (const v of bad) {
      const r = validatePatch(safeBase, { [field]: v } as Partial<UserSettings>);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errors.some((e) => e.field === field)).toBe(true);
      }
    }
  });

  it.each([0, 1, 2])("roundup_multiplier odrzuca skrajne złe wartości (idx %i)", (i) => {
    const bads = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN];
    const r = validatePatch(safeBase, { roundup_multiplier: bads[i] });
    expect(r.ok).toBe(false);
  });
});

describe("walidacja – skrajne wartości JS Number", () => {
  it("MAX_SAFE_INTEGER i MIN_SAFE_INTEGER są odrzucane (poza zakresem)", () => {
    for (const field of NUMERIC_FIELDS) {
      expect(
        validatePatch(safeBase, { [field]: Number.MAX_SAFE_INTEGER } as Partial<UserSettings>).ok,
      ).toBe(false);
      expect(
        validatePatch(safeBase, { [field]: Number.MIN_SAFE_INTEGER } as Partial<UserSettings>).ok,
      ).toBe(false);
    }
  });

  it("Number.EPSILON jako wartość pola integer-only jest odrzucany (nie int)", () => {
    expect(validatePatch(safeBase, { auto_save_percent: Number.EPSILON }).ok).toBe(false);
    expect(validatePatch(safeBase, { raise_month: Number.EPSILON }).ok).toBe(false);
  });

  it("Number.MIN_VALUE (subnormal ~5e-324) odrzucany dla pól z min > 0", () => {
    expect(validatePatch(safeBase, { sim_income: Number.MIN_VALUE }).ok).toBe(false);
    expect(validatePatch(safeBase, { auto_save_percent: Number.MIN_VALUE }).ok).toBe(false);
    expect(validatePatch(safeBase, { raise_month: Number.MIN_VALUE }).ok).toBe(false);
  });

  it("liczba ujemna -0 jest akceptowana dla pól z min=0", () => {
    expect(validatePatch(safeBase, { interest_pct: -0 }).ok).toBe(true);
    expect(validatePatch(safeBase, { sim_obligations: -0 }).ok).toBe(true);
  });
});

describe("walidacja – nie-numeryczne typy w polach liczbowych", () => {
  const cases: Array<[string, unknown]> = [
    ["string liczbowy", "10"],
    ["string pusty", ""],
    ["null", null],
    ["undefined", undefined],
    ["boolean", true],
    ["object", {}],
    ["array", [10]],
  ];

  it.each(cases)("auto_save_percent odrzuca %s", (_label, value) => {
    const r = validatePatch(safeBase, { auto_save_percent: value as never });
    expect(r.ok).toBe(false);
  });

  it.each(cases)("sim_income odrzuca %s", (_label, value) => {
    const r = validatePatch(safeBase, { sim_income: value as never });
    expect(r.ok).toBe(false);
  });
});

describe("coercePatch – skrajne wartości i Infinity/NaN", () => {
  // Kontrakt clampNum: każda nieskończona wartość (±Infinity, NaN) trafia do min.
  // Tylko skończone liczby są właściwie obcinane do [min, max].
  // Baza z wysokim wpływem, by cross-field nie ingerowało w sim_obligations.
  const richBase: UserSettings = { ...safeBase, sim_income: 25000 };

  it.each(NUMERIC_FIELDS)("%s: +Infinity → min (non-finite)", (field) => {
    const r = FIELD_RANGES[field];
    const { patch } = coercePatch(richBase, { [field]: Number.POSITIVE_INFINITY } as Partial<
      UserSettings
    >);
    expect((patch as Record<string, unknown>)[field]).toBe(r.min);
  });

  it.each(NUMERIC_FIELDS)("%s: -Infinity → min (non-finite)", (field) => {
    const r = FIELD_RANGES[field];
    const { patch } = coercePatch(richBase, { [field]: Number.NEGATIVE_INFINITY } as Partial<
      UserSettings
    >);
    expect((patch as Record<string, unknown>)[field]).toBe(r.min);
  });

  it.each(NUMERIC_FIELDS)("%s: NaN → min (non-finite)", (field) => {
    const r = FIELD_RANGES[field];
    const { patch } = coercePatch(richBase, { [field]: Number.NaN } as Partial<UserSettings>);
    expect((patch as Record<string, unknown>)[field]).toBe(r.min);
  });

  it.each(NUMERIC_FIELDS)("%s: MAX_SAFE_INTEGER → max, MIN_SAFE_INTEGER → min", (field) => {
    const r = FIELD_RANGES[field];
    const upper = coercePatch(richBase, { [field]: Number.MAX_SAFE_INTEGER } as Partial<
      UserSettings
    >).patch;
    const lower = coercePatch(richBase, { [field]: Number.MIN_SAFE_INTEGER } as Partial<
      UserSettings
    >).patch;
    expect((upper as Record<string, unknown>)[field]).toBe(r.max);
    expect((lower as Record<string, unknown>)[field]).toBe(r.min);
  });

  it("po autokorekcie skrajnych wartości cały rekord przechodzi pełną walidację Zod", () => {
    const wild: Partial<UserSettings> = {
      auto_save_percent: Number.POSITIVE_INFINITY,
      interest_pct: Number.NEGATIVE_INFINITY,
      sim_income: Number.NaN,
      sim_obligations: Number.MAX_SAFE_INTEGER,
      income_growth_pct: -999999,
      obligations_growth_pct: 999999,
      raise_month: Number.NaN,
      raise_amount: Number.POSITIVE_INFINITY,
      roundup_rule: "garbage" as never,
      roundup_multiplier: Number.POSITIVE_INFINITY,
    };
    const { patch } = coercePatch(safeBase, wild);
    const merged = { ...safeBase, ...patch };
    const r = settingsSchema.safeParse(merged);
    expect(r.success).toBe(true);
  });

  it("roundup_multiplier: Infinity → fallback (initial reduce nie zmienia się przy NaN/Inf w abs-diff)", () => {
    const { patch } = coercePatch(safeBase, { roundup_multiplier: Number.POSITIVE_INFINITY });
    expect(ROUNDUP_MULTIPLIERS).toContain(patch.roundup_multiplier as number);
    // |m - Inf| = Inf dla każdego m, więc reduce nigdy nie wybiera nowego — zostaje initial=1
    expect(patch.roundup_multiplier).toBe(1);
  });

  it("roundup_multiplier: -Infinity → fallback 1 z tego samego powodu", () => {
    const { patch } = coercePatch(safeBase, { roundup_multiplier: Number.NEGATIVE_INFINITY });
    expect(patch.roundup_multiplier).toBe(1);
  });

  it("roundup_multiplier: NaN → fallback 1", () => {
    const { patch } = coercePatch(safeBase, { roundup_multiplier: Number.NaN });
    expect(patch.roundup_multiplier).toBe(1);
  });

  it("roundup_multiplier: skończone wartości → najbliższy dozwolony", () => {
    expect(coercePatch(safeBase, { roundup_multiplier: 1000 }).patch.roundup_multiplier).toBe(5);
    expect(coercePatch(safeBase, { roundup_multiplier: -1000 }).patch.roundup_multiplier).toBe(1);
    expect(coercePatch(safeBase, { roundup_multiplier: 3.4 }).patch.roundup_multiplier).toBe(2);
  });

  it("integer fields: ułamek dokładnie na granicy max zaokrąglany w dół do max", () => {
    const { patch } = coercePatch(safeBase, { auto_save_percent: 40.4 });
    expect(patch.auto_save_percent).toBe(40);
    const { patch: p2 } = coercePatch(safeBase, { auto_save_percent: 40.6 });
    expect(p2.auto_save_percent).toBe(40);
  });

  it("tryb patch: brak pola w łatce nie jest dotykany nawet w obecności innych skrajnych wartości", () => {
    const { patch } = coercePatch(safeBase, {
      sim_income: Number.POSITIVE_INFINITY,
    });
    expect("auto_save_percent" in patch).toBe(false);
    expect("raise_month" in patch).toBe(false);
    // Inf → non-finite → min
    expect(patch.sim_income).toBe(FIELD_RANGES.sim_income.min);
  });

  it("cross-field przy skrajnych wartościach: NaN/Inf trafiają do min, więc oblig (0) nie przekracza income (2000)", () => {
    const { patch, corrections } = coercePatch(safeBase, {
      sim_income: Number.NaN,
      sim_obligations: Number.POSITIVE_INFINITY,
    });
    expect(patch.sim_income).toBe(FIELD_RANGES.sim_income.min);
    expect(patch.sim_obligations).toBe(FIELD_RANGES.sim_obligations.min);
    // brak dodatkowej korekty cross-field, bo 0 ≤ 2000
    expect(corrections.some((c) => c.reason.includes("ograniczono"))).toBe(false);
  });

  it("cross-field aktywny: skończona, zbyt duża wartość zobowiązań po clamp dalej > income → docięte", () => {
    const lowIncome: UserSettings = { ...safeBase, sim_income: 3000 };
    const { patch } = coercePatch(lowIncome, { sim_obligations: 14000 });
    expect(patch.sim_obligations).toBe(3000);
  });
});

describe("validatePatch w trybie patch – izolacja błędów", () => {
  it("Infinity w jednym polu nie generuje błędów dla innych pól", () => {
    const r = validatePatch(safeBase, { sim_income: Number.POSITIVE_INFINITY });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.every((e) => e.field === "sim_income")).toBe(true);
    }
  });

  it("kilka skrajnych wartości jednocześnie zwraca po jednym błędzie na pole", () => {
    const r = validatePatch(safeBase, {
      sim_income: Number.NaN,
      auto_save_percent: Number.POSITIVE_INFINITY,
      interest_pct: Number.NEGATIVE_INFINITY,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const fields = new Set(r.errors.map((e) => e.field));
      expect(fields.has("sim_income")).toBe(true);
      expect(fields.has("auto_save_percent")).toBe(true);
      expect(fields.has("interest_pct")).toBe(true);
    }
  });
});
