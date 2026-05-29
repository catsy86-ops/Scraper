import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap, TrendingUp, Calendar, Sparkles, Wallet, Cloud, Loader2, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AppNav } from "@/components/fiszu/AppNav";
import { recentTransactions, formatPLN } from "@/lib/finance-data";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings, type UserSettings } from "@/hooks/useUserSettings";
import { VersionHistory } from "@/components/fiszu/VersionHistory";

export const Route = createFileRoute("/symulator")({
  head: () => ({
    meta: [
      { title: "Symulator oszczędności — FISZU" },
      { name: "description", content: "Sprawdź, ile zaoszczędzisz w miesiąc i rok dzięki Auto-Sejfowi i zaokrąglaniu transakcji." },
      { property: "og:title", content: "Symulator oszczędności — FISZU" },
      { property: "og:description", content: "Interaktywna prognoza miesięczna i roczna." },
    ],
  }),
  component: SimulatorPage,
});

type RoundupRule = "nearest1" | "nearest2" | "nearest5" | "nearest10";

const RULE_LABELS: Record<RoundupRule, string> = {
  nearest1: "Do 1 zł",
  nearest2: "Do 2 zł",
  nearest5: "Do 5 zł",
  nearest10: "Do 10 zł",
};
const RULE_STEP: Record<RoundupRule, number> = {
  nearest1: 1, nearest2: 2, nearest5: 5, nearest10: 10,
};

const FIELD_LABELS: Partial<Record<keyof UserSettings, string>> = {
  sim_income: "Średni miesięczny wpływ",
  auto_save_percent: "Procent Auto-Sejfu",
  sim_obligations: "Zobowiązania miesięczne",
  income_growth_pct: "Roczny wzrost dochodu",
  obligations_growth_pct: "Roczny wzrost zobowiązań",
  raise_amount: "Skokowa podwyżka",
  raise_month: "Miesiąc podwyżki",
  interest_pct: "Oprocentowanie konta",
  roundup_rule: "Reguła Round-Up",
  roundup_multiplier: "Mnożnik Round-Up",
};

function SimulatorPage() {
  const { user } = useAuth();
  const { settings, update, loading, saving, synced, syncedAt, errors } = useUserSettings(user?.id);
  const [versionsRefresh, setVersionsRefresh] = useState(0);
  const [showLoaded, setShowLoaded] = useState(false);
  const [validationMode, setValidationMode] = useState<"onChange" | "onBlur">("onChange");
  const [touched, setTouched] = useState<Set<keyof UserSettings>>(new Set());
  const markTouched = (field: keyof UserSettings) =>
    setTouched((prev) => (prev.has(field) ? prev : new Set(prev).add(field)));
  const errFor = (field: keyof UserSettings) =>
    validationMode === "onChange" || touched.has(field) ? errors[field] : undefined;

  // Pokaż przez chwilę zielony pasek potwierdzenia po pierwszej synchronizacji.
  useEffect(() => {
    if (user && synced && !loading) {
      setShowLoaded(true);
      const t = setTimeout(() => setShowLoaded(false), 3500);
      return () => clearTimeout(t);
    }
  }, [user, synced, loading]);

  const handleRestore = async (patch: Partial<UserSettings>) => {
    update(patch);
    // Trigger zapisuje stary snapshot przy UPDATE; po debounce + zapisie odświeżamy listę.
    setTimeout(() => setVersionsRefresh((n) => n + 1), 900);
  };
  const income = settings.sim_income;
  const obligations = settings.sim_obligations;
  const advancedMode = settings.advanced_mode;
  const incomeGrowthPct = settings.income_growth_pct;
  const obligationsGrowthPct = settings.obligations_growth_pct;
  const raiseMonth = settings.raise_month;
  const raiseAmount = settings.raise_amount;
  const autoPct = settings.auto_save_percent;
  const autoEnabled = settings.auto_save_enabled;
  const rule = (settings.roundup_rule as RoundupRule) ?? "nearest1";
  const multiplier = settings.roundup_multiplier;
  const roundupEnabled = settings.roundup_enabled;
  const interestPct = settings.interest_pct;

  const setIncome = (v: number) => update({ sim_income: v });
  const setObligations = (v: number) => update({ sim_obligations: v });
  const setAdvancedMode = (v: boolean) => update({ advanced_mode: v });
  const setIncomeGrowthPct = (v: number) => update({ income_growth_pct: v });
  const setObligationsGrowthPct = (v: number) => update({ obligations_growth_pct: v });
  const setRaiseMonth = (v: number) => update({ raise_month: v });
  const setRaiseAmount = (v: number) => update({ raise_amount: v });
  const setAutoPct = (v: number) => update({ auto_save_percent: v });
  const setAutoEnabled = (v: boolean) => update({ auto_save_enabled: v });
  const setRule = (v: RoundupRule) => update({ roundup_rule: v });
  const setMultiplier = (v: number) => update({ roundup_multiplier: v });
  const setRoundupEnabled = (v: boolean) => update({ roundup_enabled: v });
  const setInterestPct = (v: number) => update({ interest_pct: v });


  const expenses = useMemo(() => recentTransactions.filter((t) => t.amount < 0), []);

  // Realne obliczenia: sumujemy zaokrąglenia ze wszystkich zapisanych transakcji
  // i normalizujemy do miesiąca na podstawie faktycznego zakresu dat.
  const roundupStats = useMemo(() => {
    const step = RULE_STEP[rule];
    let total = 0;
    const ups: number[] = [];
    for (const t of expenses) {
      const abs = Math.abs(t.amount);
      const up = +(Math.ceil(abs / step) * step - abs).toFixed(2);
      ups.push(up);
      total += up;
    }
    const dates = expenses.map((t) => new Date(t.date).getTime());
    const minD = Math.min(...dates);
    const maxD = Math.max(...dates);
    const spanDays = Math.max(1, (maxD - minD) / (1000 * 60 * 60 * 24) + 1);
    const monthlyFactor = 30 / spanDays;
    const avgPerTx = ups.length ? total / ups.length : 0;
    return {
      totalInSample: total,
      avgPerTx,
      monthlyBase: total * monthlyFactor,
      txCount: ups.length,
      spanDays: Math.round(spanDays),
    };
  }, [rule, expenses]);

  const roundupMonthly = roundupEnabled ? roundupStats.monthlyBase * multiplier : 0;
  const disposable = Math.max(0, income - obligations);
  const autoBase = advancedMode ? disposable : income;
  const autoMonthly = autoEnabled ? (autoBase * autoPct) / 100 : 0;
  const totalMonthly = roundupMonthly + autoMonthly;
  const totalYearly = totalMonthly * 12;

  // Projekcja 24 miesięcy z procentem składanym + dynamicznym dochodem/zobowiązaniami
  const projection = useMemo(() => {
    const monthlyRate = interestPct / 100 / 12;
    const incMonthlyGrowth = advancedMode ? Math.pow(1 + incomeGrowthPct / 100, 1 / 12) - 1 : 0;
    const oblMonthlyGrowth = advancedMode ? Math.pow(1 + obligationsGrowthPct / 100, 1 / 12) - 1 : 0;
    const data: { month: string; saldo: number; bezOdsetek: number; wklad: number }[] = [];
    let balance = 0;
    let plain = 0;
    let inc = income;
    let obl = obligations;
    for (let i = 1; i <= 24; i++) {
      if (advancedMode && i === raiseMonth && raiseAmount > 0) inc += raiseAmount;
      const disp = advancedMode ? Math.max(0, inc - obl) : inc;
      const auto = autoEnabled ? (disp * autoPct) / 100 : 0;
      const contribution = roundupMonthly + auto;
      balance = (balance + contribution) * (1 + monthlyRate);
      plain += contribution;
      data.push({
        month: `M${i}`,
        saldo: +balance.toFixed(0),
        bezOdsetek: +plain.toFixed(0),
        wklad: +contribution.toFixed(0),
      });
      inc *= 1 + incMonthlyGrowth;
      obl *= 1 + oblMonthlyGrowth;
    }
    return data;
  }, [income, obligations, advancedMode, incomeGrowthPct, obligationsGrowthPct, raiseMonth, raiseAmount, autoEnabled, autoPct, roundupMonthly, interestPct]);

  const fiveYear = useMemo(() => {
    const monthlyRate = interestPct / 100 / 12;
    const incMonthlyGrowth = advancedMode ? Math.pow(1 + incomeGrowthPct / 100, 1 / 12) - 1 : 0;
    const oblMonthlyGrowth = advancedMode ? Math.pow(1 + obligationsGrowthPct / 100, 1 / 12) - 1 : 0;
    let b = 0;
    let inc = income;
    let obl = obligations;
    for (let i = 1; i <= 60; i++) {
      if (advancedMode && i === raiseMonth && raiseAmount > 0) inc += raiseAmount;
      const disp = advancedMode ? Math.max(0, inc - obl) : inc;
      const auto = autoEnabled ? (disp * autoPct) / 100 : 0;
      b = (b + roundupMonthly + auto) * (1 + monthlyRate);
      inc *= 1 + incMonthlyGrowth;
      obl *= 1 + oblMonthlyGrowth;
    }
    return b;
  }, [income, obligations, advancedMode, incomeGrowthPct, obligationsGrowthPct, raiseMonth, raiseAmount, autoEnabled, autoPct, roundupMonthly, interestPct]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-orb bg-orb-1" aria-hidden />
      <div className="bg-orb bg-orb-2" aria-hidden />
      <div className="bg-orb bg-orb-3" aria-hidden />

      <AppNav />

      {/* Sync status bar for simulator */}
      {user && (
        <div className="border-b border-border/40 bg-background/50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 md:px-8">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              {loading || !synced ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Wczytuję ustawienia…</>
              ) : saving ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Zapisuję…</>
              ) : (
                <>
                  <Cloud className="h-3 w-3 text-success" />
                  Zsynchronizowano{syncedAt ? ` • ${syncedAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}` : ""}
                </>
              )}
            </span>
            {!user && (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <Lock className="h-3 w-3" /> Zaloguj, by zapisać
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="relative mx-auto max-w-7xl px-4 py-8 md:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Symulator</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Ile zaoszczędzisz <span className="text-gradient-brand">w 12 miesięcy?</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pobaw się parametrami Auto-Sejfu i Round-Up. Wykres aktualizuje się na żywo —
            zobacz jak małe zmiany zmieniają roczną prognozę.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {user && (loading || !synced) ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                <span className="font-semibold">Wczytuję Twoje ustawienia symulacji…</span>{" "}
                <span className="text-primary/80">Prognoza pojawi się za chwilę.</span>
              </span>
            </motion.div>
          ) : showLoaded && user ? (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                <span className="font-semibold">Ustawienia zsynchronizowane</span>{" "}
                <span className="text-success/80">— prognoza poniżej liczy się na Twoich danych.</span>
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {user && (loading || !synced) ? (
          <SimulatorSkeleton />
        ) : null}

        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div
              key="err-summary"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <p className="font-display text-sm font-semibold">
                  {Object.keys(errors).length === 1
                    ? "Popraw 1 pole, aby zapisać ustawienia"
                    : `Popraw ${Object.keys(errors).length} pól, aby zapisać ustawienia`}
                </p>
              </div>
              <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {(Object.entries(errors) as [keyof UserSettings, string][]).map(([field, msg]) => (
                  <li key={field}>
                    <button
                      onClick={() => {
                        markTouched(field);
                        const el = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.focus({ preventScroll: true });
                        }
                      }}
                      className="group flex w-full items-start gap-2 rounded-lg border border-destructive/20 bg-background/40 p-2 text-left text-xs transition hover:border-destructive/50 hover:bg-destructive/5"
                    >
                      <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-foreground group-hover:text-destructive">
                          {FIELD_LABELS[field] ?? field}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{msg}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Controls */}
          <div className="space-y-4 lg:col-span-1">
            <div className="glass-card flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-display text-xs font-semibold">Walidacja pól</p>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {validationMode === "onChange"
                    ? "Pokazuję błędy od razu, podczas edycji."
                    : "Pokazuję błędy dopiero po zakończeniu edycji (blur)."}
                </p>
              </div>
              <div className="flex shrink-0 rounded-lg border border-border bg-secondary/40 p-0.5 text-[10px] font-semibold">
                {(["onChange", "onBlur"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setValidationMode(m);
                      if (m === "onChange") setTouched(new Set());
                    }}
                    className={`rounded-md px-2 py-1 transition ${
                      validationMode === m
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-pressed={validationMode === m}
                  >
                    {m === "onChange" ? "Na bieżąco" : "Po edycji"}
                  </button>
                ))}
              </div>
            </div>
            <VersionHistory
              userId={user?.id}
              onRestore={handleRestore}
              refreshKey={versionsRefresh + (saving ? 0 : 1)}
            />
            {/* Auto-Sejf */}
            <div className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="font-display font-semibold">Auto-Sejf</h3>
                </div>
                <Toggle on={autoEnabled} onChange={setAutoEnabled} />
              </div>

              <Field label="Średni miesięczny wpływ" value={formatPLN(income)} error={errFor("sim_income")}>
                <input
                  type="range" min={2000} max={25000} step={100}
                  value={income} onChange={(e) => setIncome(+e.target.value)} data-field="sim_income" onBlur={() => markTouched("sim_income")}
                  className="w-full accent-[oklch(0.78_0.17_165)]"
                />
              </Field>

              <Field label="Procent odkładania" value={`${autoPct}%`} error={errFor("auto_save_percent")}>
                <input
                  type="range" min={1} max={40} value={autoPct}
                  onChange={(e) => setAutoPct(+e.target.value)} data-field="auto_save_percent" onBlur={() => markTouched("auto_save_percent")}
                  disabled={!autoEnabled}
                  className="w-full accent-[oklch(0.78_0.17_165)] disabled:opacity-40"
                />
              </Field>
            </div>

            {/* Budżet i zmiany w czasie */}
            <div className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <h3 className="font-display font-semibold">Budżet i zmiany w czasie</h3>
                </div>
                <Toggle on={advancedMode} onChange={setAdvancedMode} />
              </div>
              <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
                {advancedMode
                  ? "Auto-Sejf liczony z dochodu po odjęciu zobowiązań, z uwzględnieniem zmian w czasie."
                  : "Włącz, aby uwzględniać zobowiązania, wzrost dochodu i podwyżki w prognozie."}
              </p>

              <Field label="Stałe miesięczne zobowiązania" value={formatPLN(obligations)} error={errFor("sim_obligations")}>
                <input
                  type="range" min={0} max={15000} step={50}
                  value={obligations} onChange={(e) => setObligations(+e.target.value)} data-field="sim_obligations" onBlur={() => markTouched("sim_obligations")}
                  disabled={!advancedMode}
                  className="w-full accent-[oklch(0.78_0.17_165)] disabled:opacity-40"
                />
              </Field>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-2 text-xs">
                <span className="text-muted-foreground">Dochód rozporządzalny</span>
                <span className="font-display font-semibold text-success">{formatPLN(disposable)}</span>
              </div>

              <Field label="Roczny wzrost dochodu" value={`${incomeGrowthPct}%`} error={errFor("income_growth_pct")}>
                <input
                  type="range" min={0} max={20} step={0.5} value={incomeGrowthPct}
                  onChange={(e) => setIncomeGrowthPct(+e.target.value)} data-field="income_growth_pct" onBlur={() => markTouched("income_growth_pct")}
                  disabled={!advancedMode}
                  className="w-full accent-[oklch(0.78_0.17_165)] disabled:opacity-40"
                />
              </Field>

              <Field label="Roczny wzrost zobowiązań (inflacja)" value={`${obligationsGrowthPct}%`} error={errFor("obligations_growth_pct")}>
                <input
                  type="range" min={0} max={15} step={0.5} value={obligationsGrowthPct}
                  onChange={(e) => setObligationsGrowthPct(+e.target.value)} data-field="obligations_growth_pct" onBlur={() => markTouched("obligations_growth_pct")}
                  disabled={!advancedMode}
                  className="w-full accent-[oklch(0.78_0.17_165)] disabled:opacity-40"
                />
              </Field>

              <Field label="Skokowa podwyżka (jednorazowo)" value={raiseAmount > 0 ? `+${formatPLN(raiseAmount)}` : "brak"} error={errFor("raise_amount")}>
                <input
                  type="range" min={0} max={5000} step={100} value={raiseAmount}
                  onChange={(e) => setRaiseAmount(+e.target.value)} data-field="raise_amount" onBlur={() => markTouched("raise_amount")}
                  disabled={!advancedMode}
                  className="w-full accent-[oklch(0.78_0.17_165)] disabled:opacity-40"
                />
              </Field>

              <Field label="W którym miesiącu" value={`M${raiseMonth}`} error={errFor("raise_month")}>
                <input
                  type="range" min={1} max={24} value={raiseMonth}
                  onChange={(e) => setRaiseMonth(+e.target.value)} data-field="raise_month" onBlur={() => markTouched("raise_month")}
                  disabled={!advancedMode || raiseAmount === 0}
                  className="w-full accent-[oklch(0.78_0.17_165)] disabled:opacity-40"
                />
              </Field>
            </div>
            <div className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-accent" />
                  <h3 className="font-display font-semibold">Round-Up</h3>
                </div>
                <Toggle on={roundupEnabled} onChange={setRoundupEnabled} />
              </div>

              <p className="mb-2 text-xs text-muted-foreground">Reguła zaokrąglenia</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(RULE_LABELS) as RoundupRule[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRule(r)}
                    disabled={!roundupEnabled}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                      rule === r
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {RULE_LABELS[r]}
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-4 text-xs text-muted-foreground">Mnożnik (np. 2× zaokrąglenia)</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    disabled={!roundupEnabled}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                      multiplier === m
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m}×
                  </button>
                ))}
              </div>

              <Field label="Oprocentowanie konta (rocznie)" value={`${interestPct}%`} error={errFor("interest_pct")}>
                <input
                  type="range" min={0} max={10} step={0.5} value={interestPct}
                  onChange={(e) => setInterestPct(+e.target.value)} data-field="interest_pct" onBlur={() => markTouched("interest_pct")}
                  className="w-full accent-[oklch(0.78_0.17_165)]"
                />
              </Field>

              <p className="mt-3 rounded-lg border border-border bg-secondary/30 p-2 text-[11px] leading-relaxed text-muted-foreground">
                Liczone z <span className="font-semibold text-foreground">{roundupStats.txCount}</span> zapisanych transakcji
                (zakres ~{roundupStats.spanDays} dni). Suma zaokrągleń w próbce: {formatPLN(roundupStats.totalInSample)},
                średnio {formatPLN(roundupStats.avgPerTx)} / transakcja.
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultCard label="Auto-Sejf / mies." value={formatPLN(autoMonthly)} accent="primary" />
              <ResultCard label="Round-Up / mies." value={formatPLN(roundupMonthly)} accent="accent" />
              <ResultCard label="Razem / mies." value={formatPLN(totalMonthly)} accent="primary" big />
              <ResultCard label="Razem / rok" value={formatPLN(totalYearly)} accent="accent" big />
            </div>

            <div className="glass-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">Prognoza salda — 24 miesiące</h3>
                  <p className="text-xs text-muted-foreground">
                    Procent składany {interestPct}% rocznie
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-muted-foreground">Po 5 latach</p>
                  <p className="font-display text-xl font-bold text-gradient-brand">{formatPLN(fiveYear)}</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={projection} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g-saldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.78 0.17 165)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="oklch(0.78 0.17 165)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-bez" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 235 / 40%)" />
                    <XAxis dataKey="month" stroke="oklch(0.68 0.03 220)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.68 0.03 220)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.21 0.03 235)",
                        border: "1px solid oklch(0.3 0.03 235)",
                        borderRadius: 12,
                      }}
                      formatter={(v: number) => formatPLN(v)}
                      labelFormatter={(l) => `Miesiąc ${String(l).slice(1)}`}
                    />
                    <Area type="monotone" dataKey="bezOdsetek" name="Bez odsetek" stroke="oklch(0.72 0.15 200)" strokeWidth={2} fill="url(#g-bez)" />
                    <Area type="monotone" dataKey="saldo" name="Z odsetkami" stroke="oklch(0.78 0.17 165)" strokeWidth={2.5} fill="url(#g-saldo)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
              <Milestone icon={Calendar} label="Po 3 miesiącach" value={formatPLN(projection[2]?.saldo ?? 0)} />
              <Milestone icon={Calendar} label="Po 12 miesiącach" value={formatPLN(projection[11]?.saldo ?? 0)} />
              <Milestone icon={TrendingUp} label="Po 24 miesiącach" value={formatPLN(projection[23]?.saldo ?? 0)} highlight />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SimulatorSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3" aria-busy="true" aria-label="Ładowanie symulatora">
      <div className="space-y-4 lg:col-span-1">
        <div className="glass-card p-5 space-y-3">
          <div className="h-4 w-24 rounded bg-muted/30 animate-pulse" />
          <div className="space-y-2">
            {[80, 60, 40].map((w, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-20 rounded bg-muted/20 animate-pulse" />
                <div className="h-2 rounded bg-muted/20 animate-pulse" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5 space-y-3">
          <div className="h-4 w-24 rounded bg-muted/30 animate-pulse" />
          <div className="space-y-2">
            {[100, 70, 90, 50].map((w, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-28 rounded bg-muted/20 animate-pulse" />
                <div className="h-2 rounded bg-muted/20 animate-pulse" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5 space-y-3">
          <div className="h-4 w-20 rounded bg-muted/30 animate-pulse" />
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 5, 10].map((v) => (
              <div key={v} className="h-7 rounded-lg bg-muted/20 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 5].map((v) => (
              <div key={v} className="h-7 rounded-lg bg-muted/20 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4 lg:col-span-2">
        <div className="glass-card p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((v) => (
              <div key={v} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="h-3 w-20 rounded bg-muted/20 animate-pulse" />
                <div className="mt-2 h-5 w-16 rounded bg-muted/20 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-36 rounded bg-muted/20 animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted/20 animate-pulse" />
            </div>
            <div className="text-right">
              <div className="h-3 w-16 rounded bg-muted/20 animate-pulse" />
              <div className="mt-1 h-6 w-20 rounded bg-muted/20 animate-pulse" />
            </div>
          </div>
          <div className="h-72 w-full rounded-lg bg-muted/10 animate-pulse" />
        </div>
        <div className="glass-card grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          {[1, 2, 3].map((v) => (
            <div key={v} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="h-3 w-20 rounded bg-muted/20 animate-pulse" />
              <div className="mt-1 h-5 w-16 rounded bg-muted/20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  error,
  children,
}: {
  label: string;
  value: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-end justify-between">
        <span className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{label}</span>
        <span className={`font-display text-sm font-semibold ${error ? "text-destructive" : ""}`}>{value}</span>
      </div>
      <div className="mt-1.5">{children}</div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-1.5 text-[11px] font-medium text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 rounded-full transition ${on ? "bg-primary" : "bg-secondary"}`}
      aria-label="toggle"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${on ? "right-0.5" : "left-0.5"}`}
      />
    </button>
  );
}

function ResultCard({ label, value, accent, big }: { label: string; value: string; accent: "primary" | "accent"; big?: boolean }) {
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0.6, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card relative overflow-hidden p-4"
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl ${
        accent === "primary" ? "bg-[oklch(0.78_0.17_165)]" : "bg-[oklch(0.72_0.15_200)]"
      }`} />
      <p className="relative text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`relative mt-1 font-display font-bold ${big ? "text-2xl text-gradient-brand" : "text-lg"}`}>{value}</p>
    </motion.div>
  );
}

function Milestone({ icon: Icon, label, value, highlight }: { icon: typeof Calendar; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/30"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className={`mt-1 font-display text-lg font-bold ${highlight ? "text-gradient-brand" : ""}`}>{value}</p>
    </div>
  );
}
