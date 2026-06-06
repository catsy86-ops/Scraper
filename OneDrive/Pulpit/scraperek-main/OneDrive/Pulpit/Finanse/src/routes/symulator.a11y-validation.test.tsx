import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRef, useState } from "react";
import type { UserSettings } from "@/hooks/useUserSettings";
import { validatePatch } from "@/lib/settings-schema";

/**
 * A11y tests for the simulation form's validation surface.
 *
 * Verifies:
 *  - each input exposes aria-invalid + aria-describedby pointing at its
 *    error message element (so screen readers announce the issue),
 *  - the error <p> has matching id and role="alert",
 *  - after running validation, focus moves to the first invalid field
 *    (in DOM order) so keyboard users land on what to fix,
 *  - when no errors exist, aria-invalid is false and aria-describedby is absent,
 *  - the summary box has role="alert" and aria-live="assertive".
 */

const FIELD_ORDER: (keyof UserSettings)[] = [
  "sim_income",
  "sim_obligations",
  "auto_save_percent",
  "interest_pct",
];

const LABELS: Record<string, string> = {
  sim_income: "Średni miesięczny wpływ",
  sim_obligations: "Zobowiązania miesięczne",
  auto_save_percent: "Procent Auto-Sejfu",
  interest_pct: "Oprocentowanie konta",
};

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

function SimulatorForm({ initial }: { initial: Partial<UserSettings> }) {
  const [values, setValues] = useState<UserSettings>({ ...base, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof UserSettings, string>>>({});
  const refs = useRef<Partial<Record<keyof UserSettings, HTMLInputElement | null>>>({});

  const runValidation = () => {
    const patch: Partial<UserSettings> = {};
    for (const f of FIELD_ORDER) (patch as Record<string, unknown>)[f] = values[f];
    const r = validatePatch(base, patch);
    const next: Partial<Record<keyof UserSettings, string>> = {};
    if (!r.ok) for (const e of r.errors) next[e.field as keyof UserSettings] = e.message;
    setErrors(next);
    // focus first invalid field in DOM order
    for (const f of FIELD_ORDER) {
      if (next[f]) {
        refs.current[f]?.focus();
        break;
      }
    }
  };

  const entries = Object.entries(errors) as [keyof UserSettings, string][];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        runValidation();
      }}
    >
      {entries.length > 0 && (
        <div role="alert" aria-live="assertive" data-testid="error-summary">
          Popraw {entries.length} {entries.length === 1 ? "pole" : "pól"}
        </div>
      )}
      {FIELD_ORDER.map((f) => {
        const err = errors[f];
        const errId = `${f}-error`;
        return (
          <div key={f}>
            <label htmlFor={f}>{LABELS[f]}</label>
            <input
              id={f}
              ref={(el) => {
                refs.current[f] = el;
              }}
              type="number"
              value={String(values[f] ?? "")}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f]: Number(e.target.value) }))
              }
              aria-invalid={err ? "true" : "false"}
              aria-describedby={err ? errId : undefined}
              data-testid={`input-${f}`}
            />
            {err && (
              <p id={errId} role="alert" data-testid={`error-${f}`}>
                {err}
              </p>
            )}
          </div>
        );
      })}
      <button type="submit">Zapisz</button>
    </form>
  );
}

describe("symulator – dostępność walidacji", () => {
  it("bez błędów: aria-invalid=false i brak aria-describedby", () => {
    render(<SimulatorForm initial={{}} />);
    for (const f of FIELD_ORDER) {
      const input = screen.getByTestId(`input-${f}`);
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(input).not.toHaveAttribute("aria-describedby");
    }
    expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument();
  });

  it("po walidacji: aria-describedby wskazuje na element komunikatu z role='alert'", () => {
    render(<SimulatorForm initial={{ sim_income: 100 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    const input = screen.getByTestId("input-sim_income");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBe("sim_income-error");

    const errEl = document.getElementById(describedBy!);
    expect(errEl).not.toBeNull();
    expect(errEl).toHaveAttribute("role", "alert");
    expect(errEl).toBe(screen.getByTestId("error-sim_income"));
    expect(errEl!.textContent).toMatch(/minimum to 2000/);
  });

  it("fokus przenosi się na pierwsze błędne pole w kolejności DOM", () => {
    // sim_income jest pierwszy w FIELD_ORDER, ale jest poprawny;
    // sim_obligations jest drugi i błędny → powinien dostać fokus.
    render(
      <SimulatorForm
        initial={{ sim_obligations: -50, auto_save_percent: 999 }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    const oblig = screen.getByTestId("input-sim_obligations");
    const pct = screen.getByTestId("input-auto_save_percent");
    expect(document.activeElement).toBe(oblig);
    expect(document.activeElement).not.toBe(pct);

    // Oba pola raportują błąd przez aria.
    expect(oblig).toHaveAttribute("aria-invalid", "true");
    expect(pct).toHaveAttribute("aria-invalid", "true");
    expect(oblig.getAttribute("aria-describedby")).toBe("sim_obligations-error");
    expect(pct.getAttribute("aria-describedby")).toBe("auto_save_percent-error");
  });

  it("podsumowanie ma role='alert' i aria-live='assertive'", () => {
    render(<SimulatorForm initial={{ sim_income: 1, auto_save_percent: 999 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    const summary = screen.getByTestId("error-summary");
    expect(summary).toHaveAttribute("role", "alert");
    expect(summary).toHaveAttribute("aria-live", "assertive");
  });

  it("po naprawieniu pola aria-invalid wraca do false i aria-describedby znika", () => {
    render(<SimulatorForm initial={{ sim_income: 100 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    const input = screen.getByTestId("input-sim_income") as HTMLInputElement;
    expect(input).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(input, { target: { value: "8000" } });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByTestId("error-sim_income")).not.toBeInTheDocument();
  });
});
