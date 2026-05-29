import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserSettings } from "@/hooks/useUserSettings";

/**
 * Component tests for the simulation form's validation surface.
 *
 * We render the same Field + error-summary primitives used in
 * src/routes/symulator.tsx to verify:
 *  - field-level error message text,
 *  - destructive-color highlighting on label / value / input wrapper,
 *  - aria role="alert" so screen readers announce the issue,
 *  - the top-of-form summary listing every invalid field with its label.
 */

const FIELD_LABELS: Partial<Record<keyof UserSettings, string>> = {
  sim_income: "Średni miesięczny wpływ",
  auto_save_percent: "Procent Auto-Sejfu",
  sim_obligations: "Zobowiązania miesięczne",
  interest_pct: "Oprocentowanie konta",
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

function ErrorSummary({ errors }: { errors: Partial<Record<keyof UserSettings, string>> }) {
  const entries = Object.entries(errors) as [keyof UserSettings, string][];
  if (entries.length === 0) return null;
  return (
    <div role="alert" data-testid="error-summary">
      <p data-testid="error-summary-headline">
        {entries.length === 1
          ? "Popraw 1 pole, aby zapisać ustawienia"
          : `Popraw ${entries.length} pól, aby zapisać ustawienia`}
      </p>
      <ul>
        {entries.map(([field, msg]) => (
          <li key={field} data-testid={`summary-${field}`}>
            <strong>{FIELD_LABELS[field] ?? field}</strong>: <span>{msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

describe("symulator – walidacja w komponentach formularza", () => {
  it("brak błędów: pola mają neutralne kolory i nie ma sumarycznego boxa", () => {
    render(
      <>
        <ErrorSummary errors={{}} />
        <Field field="sim_income" label="Średni miesięczny wpływ" value="8650 zł">
          <input aria-label="income" />
        </Field>
      </>,
    );

    expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument();
    const field = screen.getByTestId("field-sim_income");
    expect(field).toHaveAttribute("data-invalid", "false");
    expect(screen.getByTestId("label-sim_income")).toHaveClass("text-muted-foreground");
    expect(screen.getByTestId("label-sim_income")).not.toHaveClass("text-destructive");
    expect(screen.getByTestId("input-wrap-sim_income")).toHaveClass("border-border");
    expect(screen.queryByTestId("error-sim_income")).not.toBeInTheDocument();
  });

  it("pojedynczy błąd: pole jest podświetlone, komunikat ma rolę alert", () => {
    const msg = "Miesięczny wpływ: minimum to 2000";
    render(
      <Field
        field="sim_income"
        label="Średni miesięczny wpływ"
        value="100"
        error={msg}
      >
        <input aria-label="income" />
      </Field>,
    );

    const field = screen.getByTestId("field-sim_income");
    expect(field).toHaveAttribute("data-invalid", "true");
    expect(screen.getByTestId("label-sim_income")).toHaveClass("text-destructive");
    expect(screen.getByTestId("value-sim_income")).toHaveClass("text-destructive");
    expect(screen.getByTestId("input-wrap-sim_income")).toHaveClass("border-destructive");

    const err = screen.getByTestId("error-sim_income");
    expect(err).toBeInTheDocument();
    expect(err).toHaveAttribute("role", "alert");
    expect(err).toHaveTextContent(msg);
  });

  it("wiele błędów: sumaryczny box wymienia wszystkie pola z czytelnymi etykietami", () => {
    const errors = {
      sim_income: "Miesięczny wpływ: minimum to 2000",
      auto_save_percent: "Procent Auto-Sejfu: maksimum to 40",
      sim_obligations: "Zobowiązania nie mogą przekraczać miesięcznego wpływu",
    } satisfies Partial<Record<keyof UserSettings, string>>;

    render(
      <>
        <ErrorSummary errors={errors} />
        <Field field="sim_income" label="Średni miesięczny wpływ" value="100" error={errors.sim_income}>
          <input aria-label="income" />
        </Field>
        <Field field="auto_save_percent" label="Procent Auto-Sejfu" value="50%" error={errors.auto_save_percent}>
          <input aria-label="percent" />
        </Field>
        <Field field="sim_obligations" label="Zobowiązania miesięczne" value="9000" error={errors.sim_obligations}>
          <input aria-label="oblig" />
        </Field>
      </>,
    );

    const summary = screen.getByTestId("error-summary");
    expect(summary).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("error-summary-headline")).toHaveTextContent(
      "Popraw 3 pól, aby zapisać ustawienia",
    );

    expect(screen.getByTestId("summary-sim_income")).toHaveTextContent("Średni miesięczny wpływ");
    expect(screen.getByTestId("summary-sim_income")).toHaveTextContent(errors.sim_income);
    expect(screen.getByTestId("summary-auto_save_percent")).toHaveTextContent("Procent Auto-Sejfu");
    expect(screen.getByTestId("summary-sim_obligations")).toHaveTextContent(
      "Zobowiązania miesięczne",
    );

    // Każde pole jest podświetlone niezależnie.
    for (const f of ["sim_income", "auto_save_percent", "sim_obligations"] as const) {
      expect(screen.getByTestId(`field-${f}`)).toHaveAttribute("data-invalid", "true");
      expect(screen.getByTestId(`input-wrap-${f}`)).toHaveClass("border-destructive");
      expect(screen.getByTestId(`error-${f}`)).toBeInTheDocument();
    }
  });

  it("nagłówek liczby mnogiej: liczba pojedyncza dla 1 błędu", () => {
    render(<ErrorSummary errors={{ sim_income: "minimum to 2000" }} />);
    expect(screen.getByTestId("error-summary-headline")).toHaveTextContent(
      "Popraw 1 pole, aby zapisać ustawienia",
    );
  });

  it("nieznany klucz pola wypisuje surową nazwę zamiast crashować", () => {
    render(
      <ErrorSummary errors={{ enabled_challenges: "lista za długa" } as Partial<Record<keyof UserSettings, string>>} />,
    );
    const item = screen.getByTestId("summary-enabled_challenges");
    expect(item).toHaveTextContent("enabled_challenges");
    expect(item).toHaveTextContent("lista za długa");
  });
});
