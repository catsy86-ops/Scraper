import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserSettings } from "@/hooks/useUserSettings";
import { validatePatch, FIELD_RANGES } from "@/lib/settings-schema";

/**
 * Range validation across every simulation field.
 *
 * Łączymy realną walidację Zod (validatePatch) z tymi samymi prymitywami
 * Field + ErrorSummary co w `symulator.field-validation.test.tsx`, żeby
 * sprawdzić, że dla każdego pola:
 *  - min i max przechodzą czysto (brak komunikatu, brak podświetleń),
 *  - min-1 / max+1 generuje komunikat z poprawnym tekstem oraz podświetla
 *    label / value / wrapper i renderuje element z role="alert".
 */

const FIELD_LABELS: Record<keyof typeof FIELD_RANGES, string> = {
  auto_save_percent: "Procent Auto-Sejfu",
  interest_pct: "Oprocentowanie konta",
  sim_income: "Średni miesięczny wpływ",
  sim_obligations: "Zobowiązania miesięczne",
  income_growth_pct: "Wzrost dochodu",
  obligations_growth_pct: "Wzrost zobowiązań",
  raise_month: "Miesiąc podwyżki",
  raise_amount: "Skokowa podwyżka",
};

const baseSettings: UserSettings = {
  auto_save_enabled: true,
  auto_save_percent: 10,
  enabled_challenges: [],
  roundup_enabled: true,
  roundup_rule: "nearest1",
  roundup_multiplier: 1,
  interest_pct: 5,
  sim_income: 25000, // wysoki wpływ, by sim_obligations.max=15000 mieściło się w cross-field
  sim_obligations: 0,
  advanced_mode: false,
  income_growth_pct: 5,
  obligations_growth_pct: 3,
  raise_month: 12,
  raise_amount: 0,
};

function Field({
  label,
  value,
  error,
  field,
  children,
}: {
  label: string;
  value: string;
  error?: string;
  field: keyof UserSettings;
  children: React.ReactNode;
}) {
  return (
    <div data-testid={`field-${field}`} data-invalid={error ? "true" : "false"}>
      <span
        data-testid={`label-${field}`}
        className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        data-testid={`value-${field}`}
        className={`font-display text-sm font-semibold ${error ? "text-destructive" : ""}`}
      >
        {value}
      </span>
      <div
        data-testid={`input-wrap-${field}`}
        className={error ? "border-destructive" : "border-border"}
      >
        {children}
      </div>
      {error && (
        <p role="alert" data-testid={`error-${field}`} className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function getError(field: keyof UserSettings, value: number): string | undefined {
  const r = validatePatch(baseSettings, { [field]: value } as Partial<UserSettings>);
  if (r.ok) return undefined;
  return r.errors.find((e) => e.field === field)?.message;
}

const numericFields = Object.keys(FIELD_RANGES) as (keyof typeof FIELD_RANGES)[];

describe("symulator – walidacja zakresów min/max per pole", () => {
  describe.each(numericFields)("pole: %s", (field) => {
    const range = FIELD_RANGES[field];
    const isInt = "int" in range && range.int;
    const step = isInt ? 1 : 0.0001;

    it("min: brak błędu, brak podświetleń, brak alertu", () => {
      const error = getError(field, range.min);
      expect(error).toBeUndefined();
      render(
        <Field field={field} label={FIELD_LABELS[field]} value={String(range.min)} error={error}>
          <input aria-label={field} />
        </Field>,
      );
      expect(screen.getByTestId(`field-${field}`)).toHaveAttribute("data-invalid", "false");
      expect(screen.getByTestId(`label-${field}`)).toHaveClass("text-muted-foreground");
      expect(screen.getByTestId(`label-${field}`)).not.toHaveClass("text-destructive");
      expect(screen.getByTestId(`value-${field}`)).not.toHaveClass("text-destructive");
      expect(screen.getByTestId(`input-wrap-${field}`)).toHaveClass("border-border");
      expect(screen.queryByTestId(`error-${field}`)).not.toBeInTheDocument();
    });

    it("max: brak błędu, brak podświetleń, brak alertu", () => {
      const error = getError(field, range.max);
      expect(error).toBeUndefined();
      render(
        <Field field={field} label={FIELD_LABELS[field]} value={String(range.max)} error={error}>
          <input aria-label={field} />
        </Field>,
      );
      expect(screen.getByTestId(`field-${field}`)).toHaveAttribute("data-invalid", "false");
      expect(screen.queryByTestId(`error-${field}`)).not.toBeInTheDocument();
    });

    it("min - 1: komunikat 'minimum to <min>' i pełne podświetlenie", () => {
      const value = range.min - step;
      const error = getError(field, value);
      expect(error).toBeDefined();
      expect(error).toMatch(new RegExp(`minimum to ${range.min}\\b`));

      render(
        <Field field={field} label={FIELD_LABELS[field]} value={String(value)} error={error}>
          <input aria-label={field} />
        </Field>,
      );

      expect(screen.getByTestId(`field-${field}`)).toHaveAttribute("data-invalid", "true");
      expect(screen.getByTestId(`label-${field}`)).toHaveClass("text-destructive");
      expect(screen.getByTestId(`value-${field}`)).toHaveClass("text-destructive");
      expect(screen.getByTestId(`input-wrap-${field}`)).toHaveClass("border-destructive");

      const alert = screen.getByTestId(`error-${field}`);
      expect(alert).toHaveAttribute("role", "alert");
      expect(alert).toHaveTextContent(error!);
    });

    it("max + 1: komunikat 'maksimum to <max>' i pełne podświetlenie", () => {
      const value = range.max + step;
      const error = getError(field, value);
      expect(error).toBeDefined();
      expect(error).toMatch(new RegExp(`maksimum to ${range.max}\\b`));

      render(
        <Field field={field} label={FIELD_LABELS[field]} value={String(value)} error={error}>
          <input aria-label={field} />
        </Field>,
      );

      expect(screen.getByTestId(`field-${field}`)).toHaveAttribute("data-invalid", "true");
      expect(screen.getByTestId(`label-${field}`)).toHaveClass("text-destructive");
      expect(screen.getByTestId(`input-wrap-${field}`)).toHaveClass("border-destructive");
      expect(screen.getByTestId(`error-${field}`)).toHaveAttribute("role", "alert");
    });
  });

  it("integer-only fields: ułamek wewnątrz zakresu generuje komunikat o liczbach całkowitych", () => {
    for (const field of ["auto_save_percent", "raise_month"] as const) {
      const range = FIELD_RANGES[field];
      const value = range.min + 0.5;
      const error = getError(field, value);
      expect(error).toBeDefined();
      expect(error).toMatch(/tylko liczby całkowite/);

      const { unmount } = render(
        <Field field={field} label={FIELD_LABELS[field]} value={String(value)} error={error}>
          <input aria-label={field} />
        </Field>,
      );
      expect(screen.getByTestId(`error-${field}`)).toHaveAttribute("role", "alert");
      expect(screen.getByTestId(`input-wrap-${field}`)).toHaveClass("border-destructive");
      unmount();
    }
  });

  it("cross-field: sim_obligations w zakresie, ale > sim_income → komunikat o przekroczeniu wpływu i podświetlenie zobowiązań", () => {
    // Niski wpływ, by zobowiązania w zakresie mogły go przekroczyć.
    const lowIncome: UserSettings = { ...baseSettings, sim_income: 3000, sim_obligations: 0 };
    const r = validatePatch(lowIncome, { sim_obligations: 10000 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const error = r.errors.find((e) => e.field === "sim_obligations")?.message;
    expect(error).toMatch(/nie mogą przekraczać miesięcznego wpływu/);

    render(
      <Field
        field="sim_obligations"
        label={FIELD_LABELS.sim_obligations}
        value="10000"
        error={error}
      >
        <input aria-label="sim_obligations" />
      </Field>,
    );

    expect(screen.getByTestId("field-sim_obligations")).toHaveAttribute("data-invalid", "true");
    expect(screen.getByTestId("label-sim_obligations")).toHaveClass("text-destructive");
    expect(screen.getByTestId("input-wrap-sim_obligations")).toHaveClass("border-destructive");
    expect(screen.getByTestId("error-sim_obligations")).toHaveAttribute("role", "alert");
  });
});
