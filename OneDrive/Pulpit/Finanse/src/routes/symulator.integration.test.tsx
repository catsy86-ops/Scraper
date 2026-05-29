import { describe, it, expect } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useUserSettings } from "@/hooks/useUserSettings";

/**
 * Integration test: input → useUserSettings.update() (Zod + coercePatch) →
 * derived simulation result. The result must always reflect a value that
 * passed Zod validation, never the raw user input.
 */
function Harness() {
  const { settings, update, errors } = useUserSettings(undefined);
  const projected = Math.round(settings.sim_income * (settings.auto_save_percent / 100));

  return (
    <div>
      <input
        aria-label="income"
        type="number"
        value={settings.sim_income}
        onChange={(e) => update({ sim_income: Number(e.target.value) })}
      />
      <input
        aria-label="percent"
        type="number"
        value={settings.auto_save_percent}
        onChange={(e) => update({ auto_save_percent: Number(e.target.value) })}
      />
      <p data-testid="income-value">{settings.sim_income}</p>
      <p data-testid="percent-value">{settings.auto_save_percent}</p>
      <p data-testid="result">{projected}</p>
      <p data-testid="income-error">{errors.sim_income ?? ""}</p>
    </div>
  );
}

async function setNumber(_user: ReturnType<typeof userEvent.setup>, el: HTMLElement, value: string) {
  // fireEvent.change emits a single onChange with the final value, mirroring
  // a paste/auto-fill rather than per-keystroke typing — perfect for testing
  // that the validated final value is what reaches the simulation.
  fireEvent.change(el, { target: { value } });
}

describe("integration: simulator form ↔ Zod validation", () => {
  it("aktualizuje wynik symulacji dopiero z wartością przepuszczoną przez Zod (z autokorektą)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const result = screen.getByTestId("result");
    const incomeValue = screen.getByTestId("income-value");
    const percentValue = screen.getByTestId("percent-value");

    // Defaults: sim_income=8650, auto_save_percent=10 → 865.
    expect(result.textContent).toBe("865");

    const income = screen.getByLabelText("income");
    const percent = screen.getByLabelText("percent");

    // 1. Wpisanie 100 (poniżej minimum 2000) — coercePatch przycina do 2000,
    //    więc result odzwierciedla skorygowaną wartość, nie surowe 100.
    await act(async () => { await setNumber(user, income, "100"); });
    expect(incomeValue.textContent).toBe("2000");
    expect(result.textContent).toBe(String(Math.round(2000 * 0.1)));

    // 2. 9999999 (powyżej max 25000) → przycięte do 25000.
    await act(async () => { await setNumber(user, income, "9999999"); });
    expect(incomeValue.textContent).toBe("25000");
    expect(result.textContent).toBe(String(Math.round(25000 * 0.1)));

    // 3. Procent 50 (max 40) → przycięty do 40, wynik się aktualizuje.
    await act(async () => { await setNumber(user, percent, "50"); });
    expect(percentValue.textContent).toBe("40");
    expect(result.textContent).toBe(String(Math.round(25000 * 0.4)));

    // 4. Pełni poprawna zmiana — wynik liczony z nowej wartości.
    await act(async () => { await setNumber(user, income, "10000"); });
    expect(incomeValue.textContent).toBe("10000");
    expect(result.textContent).toBe(String(Math.round(10000 * 0.4)));
  });

  it("nigdy nie ustawia wyniku z wartości NaN/Infinity (Zod odrzuca, coerce ratuje)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const income = screen.getByLabelText("income");
    const result = screen.getByTestId("result");
    const incomeValue = screen.getByTestId("income-value");

    // Pusty input → Number("") = NaN. coercePatch zamienia NaN na min (2000).
    await act(async () => { fireEvent.change(income, { target: { value: "" } }); });
    expect(incomeValue.textContent).toBe("2000");
    expect(Number(result.textContent)).toBeGreaterThan(0);
    expect(Number.isFinite(Number(result.textContent))).toBe(true);
  });

  it("cross-field: zobowiązania > wpływ są ograniczane do wpływu", async () => {
    function CrossFieldHarness() {
      const { settings, update } = useUserSettings(undefined);
      return (
        <div>
          <input
            aria-label="oblig"
            type="number"
            value={settings.sim_obligations}
            onChange={(e) => update({ sim_obligations: Number(e.target.value) })}
          />
          <p data-testid="oblig-value">{settings.sim_obligations}</p>
          <p data-testid="income-value">{settings.sim_income}</p>
        </div>
      );
    }

    const user = userEvent.setup();
    render(<CrossFieldHarness />);
    const oblig = screen.getByLabelText("oblig");
    const obligValue = screen.getByTestId("oblig-value");
    const incomeValue = screen.getByTestId("income-value");

    // Default sim_income = 8650.
    await act(async () => { await setNumber(user, oblig, "14000"); });
    // Zostały zbite do wysokości wpływu, więc walidacja Zod przechodzi.
    expect(obligValue.textContent).toBe(incomeValue.textContent);
    expect(Number(obligValue.textContent)).toBeLessThanOrEqual(Number(incomeValue.textContent));
  });
});
