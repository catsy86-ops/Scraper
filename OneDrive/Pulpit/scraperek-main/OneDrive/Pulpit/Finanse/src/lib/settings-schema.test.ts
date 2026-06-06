import { describe, it, expect } from "vitest";
import {
  settingsSchema,
  validatePatch,
  coercePatch,
  ROUNDUP_RULES,
  ROUNDUP_MULTIPLIERS,
  FIELD_RANGES,
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

const messagesFor = (patch: Partial<UserSettings>) => {
  const r = validatePatch(base, patch);
  if (r.ok) return [];
  return r.errors.map((e) => `${String(e.field)}: ${e.message}`);
};

describe("settingsSchema – wartości poprawne", () => {
  it("akceptuje wartości domyślne", () => {
    expect(settingsSchema.safeParse(base).success).toBe(true);
  });

  it("akceptuje wartości na granicach zakresów", () => {
    const edge: UserSettings = {
      ...base,
      auto_save_percent: 1,
      interest_pct: 0,
      sim_income: 25000,
      sim_obligations: 0,
      income_growth_pct: 0,
      obligations_growth_pct: 15,
      raise_month: 1,
      raise_amount: 5000,
    };
    expect(settingsSchema.safeParse(edge).success).toBe(true);

    const edge2: UserSettings = {
      ...base,
      auto_save_percent: 40,
      interest_pct: 10,
      sim_income: 2000,
      sim_obligations: 2000,
      income_growth_pct: 20,
      obligations_growth_pct: 0,
      raise_month: 24,
      raise_amount: 0,
    };
    expect(settingsSchema.safeParse(edge2).success).toBe(true);
  });
});

describe("validatePatch – komunikaty błędów per pole", () => {
  it("auto_save_percent < min", () => {
    const errs = messagesFor({ auto_save_percent: 0 });
    expect(errs.join("|")).toMatch(/Procent Auto-Sejfu.*minimum to 1/);
  });
  it("auto_save_percent > max", () => {
    expect(messagesFor({ auto_save_percent: 41 }).join("|")).toMatch(
      /Procent Auto-Sejfu.*maksimum to 40/,
    );
  });
  it("auto_save_percent niecałkowite", () => {
    expect(messagesFor({ auto_save_percent: 10.5 }).join("|")).toMatch(
      /tylko liczby całkowite/,
    );
  });

  it("interest_pct poza zakresem", () => {
    expect(messagesFor({ interest_pct: -1 }).join("|")).toMatch(/Oprocentowanie.*minimum to 0/);
    expect(messagesFor({ interest_pct: 10.1 }).join("|")).toMatch(/Oprocentowanie.*maksimum to 10/);
  });

  it("sim_income poza zakresem", () => {
    expect(messagesFor({ sim_income: 1999 }).join("|")).toMatch(/Miesięczny wpływ.*minimum to 2000/);
    expect(messagesFor({ sim_income: 25001 }).join("|")).toMatch(/Miesięczny wpływ.*maksimum to 25000/);
  });

  it("sim_obligations poza zakresem i powyżej dochodu", () => {
    expect(messagesFor({ sim_obligations: -1 }).join("|")).toMatch(/Zobowiązania.*minimum to 0/);
    expect(messagesFor({ sim_obligations: 15001 }).join("|")).toMatch(/Zobowiązania.*maksimum to 15000/);
    // sim_obligations > sim_income
    const errs = messagesFor({ sim_obligations: 9000 });
    expect(errs.join("|")).toMatch(/nie mogą przekraczać miesięcznego wpływu/);
  });

  it("income_growth_pct poza zakresem", () => {
    expect(messagesFor({ income_growth_pct: -0.1 }).join("|")).toMatch(/Wzrost dochodu.*minimum to 0/);
    expect(messagesFor({ income_growth_pct: 21 }).join("|")).toMatch(/Wzrost dochodu.*maksimum to 20/);
  });

  it("obligations_growth_pct poza zakresem", () => {
    expect(messagesFor({ obligations_growth_pct: -1 }).join("|")).toMatch(/Wzrost zobowiązań.*minimum to 0/);
    expect(messagesFor({ obligations_growth_pct: 16 }).join("|")).toMatch(/Wzrost zobowiązań.*maksimum to 15/);
  });

  it("raise_month poza zakresem i niecałkowite", () => {
    expect(messagesFor({ raise_month: 0 }).join("|")).toMatch(/Miesiąc podwyżki.*minimum to 1/);
    expect(messagesFor({ raise_month: 25 }).join("|")).toMatch(/Miesiąc podwyżki.*maksimum to 24/);
    expect(messagesFor({ raise_month: 3.5 }).join("|")).toMatch(/tylko liczby całkowite/);
  });

  it("raise_amount poza zakresem", () => {
    expect(messagesFor({ raise_amount: -1 }).join("|")).toMatch(/Skokowa podwyżka.*minimum to 0/);
    expect(messagesFor({ raise_amount: 5001 }).join("|")).toMatch(/Skokowa podwyżka.*maksimum to 5000/);
  });

  it("roundup_rule poza enumem", () => {
    const errs = messagesFor({ roundup_rule: "nearest100" as never });
    expect(errs.join("|")).toMatch(/Round-Up: wybierz jedną z dostępnych reguł/);
  });

  it("roundup_multiplier poza dozwolonym zbiorem", () => {
    const errs = messagesFor({ roundup_multiplier: 3 });
    expect(errs.join("|")).toMatch(/dozwolone mnożniki to 1×, 2× lub 5×/);
  });

  it("nieskończoność i NaN są odrzucane", () => {
    expect(messagesFor({ sim_income: Infinity }).length).toBeGreaterThan(0);
    expect(messagesFor({ sim_income: NaN }).length).toBeGreaterThan(0);
  });

  it("filtruje błędy do pól z patcha", () => {
    // base ma sim_obligations < sim_income, więc patch tylko interest_pct
    // nie powinien zwrócić błędu dotyczącego sim_obligations
    const r = validatePatch(base, { interest_pct: 50 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.every((e) => e.field === "interest_pct")).toBe(true);
    }
  });
});

describe("coercePatch – autokorekta", () => {
  it("przycina wartości numeryczne do zakresu", () => {
    const { patch, corrections } = coercePatch(base, {
      auto_save_percent: 999,
      interest_pct: -5,
      sim_income: 100000,
      raise_month: 99,
      raise_amount: -10,
    });
    expect(patch.auto_save_percent).toBe(FIELD_RANGES.auto_save_percent.max);
    expect(patch.interest_pct).toBe(FIELD_RANGES.interest_pct.min);
    expect(patch.sim_income).toBe(FIELD_RANGES.sim_income.max);
    expect(patch.raise_month).toBe(FIELD_RANGES.raise_month.max);
    expect(patch.raise_amount).toBe(FIELD_RANGES.raise_amount.min);
    expect(corrections.length).toBeGreaterThanOrEqual(5);
  });

  it("zaokrągla auto_save_percent i raise_month do liczb całkowitych", () => {
    const { patch } = coercePatch(base, { auto_save_percent: 12.7, raise_month: 5.4 });
    expect(patch.auto_save_percent).toBe(13);
    expect(patch.raise_month).toBe(5);
  });

  it("snapuje roundup_rule do domyślnej, gdy nieprawidłowe", () => {
    const { patch, corrections } = coercePatch(base, { roundup_rule: "bogus" });
    expect(patch.roundup_rule).toBe("nearest1");
    expect(corrections.some((c) => c.field === "roundup_rule")).toBe(true);
  });

  it("zaokrągla roundup_multiplier do najbliższego dozwolonego", () => {
    expect(coercePatch(base, { roundup_multiplier: 3 }).patch.roundup_multiplier).toBe(2);
    expect(coercePatch(base, { roundup_multiplier: 4 }).patch.roundup_multiplier).toBe(5);
    expect(coercePatch(base, { roundup_multiplier: 100 }).patch.roundup_multiplier).toBe(5);
  });

  it("ogranicza zobowiązania do wysokości dochodu", () => {
    const { patch, corrections } = coercePatch(base, { sim_obligations: 14000 });
    expect(patch.sim_obligations).toBe(base.sim_income);
    expect(corrections.some((c) => c.field === "sim_obligations")).toBe(true);
  });

  it("nie modyfikuje pola, którego nie ma w patchu", () => {
    const { patch, corrections } = coercePatch(base, { interest_pct: 5 });
    expect("auto_save_percent" in patch).toBe(false);
    expect(corrections).toHaveLength(0);
  });

  it("po autokorekcie patch przechodzi walidację", () => {
    const { patch } = coercePatch(base, {
      auto_save_percent: 999,
      interest_pct: -1,
      sim_income: 100000,
      sim_obligations: 999999,
      roundup_rule: "bogus",
      roundup_multiplier: 7,
    });
    const r = validatePatch(base, patch);
    expect(r.ok).toBe(true);
  });
});

describe("stałe pomocnicze", () => {
  it("ROUNDUP_RULES i ROUNDUP_MULTIPLIERS są spójne", () => {
    expect(ROUNDUP_RULES).toContain("nearest1");
    expect(ROUNDUP_MULTIPLIERS).toEqual([1, 2, 5]);
  });
});
