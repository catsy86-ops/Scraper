import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import type { UserSettings } from "@/hooks/useUserSettings";

// Lokalny spy na upsert — nadpisuje globalny mock z src/test/setup.ts.
const upsertSpy = vi.fn(async () => ({ error: null }));
vi.mock("@/integrations/supabase/client", () => {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => ({ data: null, error: null }),
    upsert: (...args: unknown[]) => (upsertSpy as (...a: unknown[]) => unknown)(...args),
  };
  return {
    supabase: {
      from: () => builder,
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    },
  };
});

// Import po vi.mock.
import { useUserSettings } from "@/hooks/useUserSettings";

const FIELD_LABELS: Partial<Record<keyof UserSettings, string>> = {
  sim_income: "Średni miesięczny wpływ",
  auto_save_percent: "Procent Auto-Sejfu",
  sim_obligations: "Zobowiązania miesięczne",
  enabled_challenges: "Lista wyzwań",
};

/**
 * Harness odwzorowuje przycisk „Zapisz ustawienia”: stan formularza jest
 * lokalny, a `update()` (auto-zapis z debounce) wywołujemy dopiero po klik.
 * Jeśli walidacja zwróci błędy — renderujemy podsumowanie i NIE pozwalamy
 * persist się odpalić (update wczytuje błędy i wcześnie return).
 */
function SaveHarness({ initialPatch }: { initialPatch: Partial<UserSettings> }) {
  const { update, errors } = useUserSettings("u1");
  const [pending, setPending] = React.useState<Partial<UserSettings>>(initialPatch);
  const [submitted, setSubmitted] = React.useState(false);

  const onSave = () => {
    setSubmitted(true);
    update(pending);
  };

  const entries = Object.entries(errors).filter(([, v]) => v) as [keyof UserSettings, string][];
  const showSummary = submitted && entries.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setPending({ enabled_challenges: ["solo"] })}
        data-testid="set-valid"
      >
        ustaw poprawne
      </button>
      <button type="button" onClick={onSave} data-testid="save-btn">
        Zapisz ustawienia
      </button>
      {showSummary && (
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
      )}
    </div>
  );
}

const tooMany = Array.from({ length: 51 }, (_, i) => `c${i}`);

describe("symulator – przycisk „Zapisz ustawienia”", () => {
  beforeEach(() => {
    upsertSpy.mockClear();
    // shouldAdvanceTime pozwala waitFor / Promise scheduler dalej działać
    // mimo wtyczki fake timers; debounce manualnie przesuwamy advanceTimersByTime.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  async function flushInitialLoad() {
    // Hook ma async useEffect (load + setSynced + initialized=true);
    // bez tego pierwsze update() nie wystartuje debounce.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("przy błędach walidacji nie zapisuje (brak upsert) i pokazuje podsumowanie", async () => {
    render(<SaveHarness initialPatch={{ enabled_challenges: tooMany }} />);
    await flushInitialLoad();
    upsertSpy.mockClear();

    // Brak podsumowania zanim użytkownik kliknie "Zapisz".
    expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("save-btn"));

    // Upsert NIE odpalony, debounce 400 ms i tak nie powinien się uruchomić.
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(upsertSpy).not.toHaveBeenCalled();

    // Podsumowanie się pojawia z liczbą i etykietą błędnego pola.
    const summary = await screen.findByTestId("error-summary");
    expect(summary).toHaveAttribute("role", "alert");
    expect(screen.getByTestId("error-summary-headline")).toHaveTextContent(
      "Popraw 1 pole, aby zapisać ustawienia",
    );
    expect(screen.getByTestId("summary-enabled_challenges")).toHaveTextContent("Lista wyzwań");
  });

  it("po naprawie błędów kolejne kliknięcie zapisuje (upsert wywołany 1×) i podsumowanie znika", async () => {
    render(<SaveHarness initialPatch={{ enabled_challenges: tooMany }} />);
    await flushInitialLoad();
    upsertSpy.mockClear();

    // 1) Pierwsze kliknięcie z błędem.
    fireEvent.click(screen.getByTestId("save-btn"));
    await screen.findByTestId("error-summary");
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(upsertSpy).not.toHaveBeenCalled();

    // 2) Naprawa: ustaw poprawną wartość i zapisz.
    fireEvent.click(screen.getByTestId("set-valid"));
    fireEvent.click(screen.getByTestId("save-btn"));

    // Debounce — upsert dopiero po 400 ms.
    expect(upsertSpy).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => expect(upsertSpy).toHaveBeenCalledTimes(1));

    // Po sukcesie — podsumowanie znika (errors wyczyszczone dla zmienionego pola).
    await waitFor(() =>
      expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument(),
    );
  });

  it("dwa zapisy w krótkim odstępie z poprawnymi danymi → debounce zwija je do 1 upsertu", async () => {
    render(<SaveHarness initialPatch={{ enabled_challenges: ["a"] }} />);
    await flushInitialLoad();
    upsertSpy.mockClear();

    fireEvent.click(screen.getByTestId("save-btn"));
    await act(async () => { vi.advanceTimersByTime(100); });
    fireEvent.click(screen.getByTestId("save-btn"));
    await act(async () => { vi.advanceTimersByTime(500); });

    await waitFor(() => expect(upsertSpy).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument();
  });
});
