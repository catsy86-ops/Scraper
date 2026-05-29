import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { AppNav } from "@/components/fiszu/AppNav";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { formatPLN, recentTransactions as demoTx } from "@/lib/finance-data";

export const Route = createFileRoute("/raporty")({
  head: () => ({
    meta: [
      { title: "Raporty — FISZU" },
      { name: "description", content: "Miesięczne zestawienia i analiza wydatków." },
    ],
  }),
  component: RaportyPage,
});

const MONTHS_BACK = 6;

function getMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("pl-PL", { month: "short", year: "2-digit" });
}

const PALETTE = [
  "oklch(0.78 0.17 165)",
  "oklch(0.72 0.15 200)",
  "oklch(0.7 0.18 280)",
  "oklch(0.82 0.15 75)",
  "oklch(0.65 0.22 22)",
  "oklch(0.7 0.2 20)",
  "oklch(0.6 0.05 240)",
  "oklch(0.75 0.16 130)",
];

function exportMonthlyCSV(rows: { month: string; income: number; expense: number; savings: number }[]) {
  const header = ["Miesiąc", "Przychody", "Wydatki", "Oszczędności"];
  const data = rows.map((r) => [
    r.month,
    r.income.toFixed(2).replace(".", ","),
    r.expense.toFixed(2).replace(".", ","),
    r.savings.toFixed(2).replace(".", ","),
  ]);
  const csv = [header, ...data].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fiszu-raport-${new Date().toISOString().slice(0, 7)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function RaportyPage() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const monthKeys = useMemo(() => getMonthKeys(MONTHS_BACK), []);

  const source = useMemo(() => {
    if (user && transactions.length > 0) {
      return transactions.map((t) => ({
        date: t.occurred_on,
        amount: Number(t.amount),
        category: t.category,
        title: t.title,
      }));
    }
    return demoTx.map((t) => ({ date: t.date, amount: t.amount, category: t.category, title: t.title }));
  }, [user, transactions]);

  // Monthly summary
  const monthly = useMemo(() => {
    const agg = new Map<string, { income: number; expense: number }>();
    monthKeys.forEach((k) => agg.set(k, { income: 0, expense: 0 }));
    for (const t of source) {
      const k = t.date.slice(0, 7);
      if (!agg.has(k)) continue;
      const v = agg.get(k)!;
      if (t.amount >= 0) v.income += t.amount;
      else v.expense += Math.abs(t.amount);
    }
    return monthKeys.map((k) => {
      const v = agg.get(k)!;
      return {
        key: k,
        month: monthLabel(k),
        income: Math.round(v.income),
        expense: Math.round(v.expense),
        savings: Math.round(v.income - v.expense),
      };
    });
  }, [source, monthKeys]);

  // Category breakdown for selected month (or current)
  const activeMonth = selectedMonth ?? monthKeys[monthKeys.length - 1] ?? "";
  const categoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const t of source) {
      if (t.amount >= 0) continue;
      if (!t.date.startsWith(activeMonth)) continue;
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    return [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));
  }, [source, activeMonth]);

  const totalCatExpense = categoryData.reduce((s, c) => s + c.value, 0);

  // Month-over-month comparison
  const currentIdx = monthly.length - 1;
  const cur = monthly[currentIdx];
  const prev = monthly[currentIdx - 1];
  const expDelta = prev && prev.expense > 0 ? ((cur!.expense - prev.expense) / prev.expense) * 100 : 0;
  const savDelta = prev && prev.savings !== 0 ? ((cur!.savings - prev.savings) / Math.abs(prev.savings)) * 100 : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-orb bg-orb-1" aria-hidden />
      <div className="bg-orb bg-orb-2" aria-hidden />
      <AppNav />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Analiza</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Twoje <span className="text-gradient-brand">raporty</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Miesięczne zestawienia przychodów, wydatków i oszczędności. Kliknij miesiąc, aby zobaczyć szczegóły.
            </p>
          </div>
          <button
            onClick={() => exportMonthlyCSV(monthly)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <Download className="h-4 w-4" /> Eksportuj CSV
          </button>
        </motion.div>

        {/* Summary cards */}
        {cur && prev && (
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Przychody ({cur.month})</p>
              <p className="mt-2 font-display text-2xl font-bold text-success">{formatPLN(cur.income)}</p>
              <p className="mt-1 text-xs text-muted-foreground">poprzednio: {formatPLN(prev.income)}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Wydatki ({cur.month})</p>
              <p className="mt-2 font-display text-2xl font-bold text-destructive">{formatPLN(cur.expense)}</p>
              <div className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${expDelta <= 0 ? "text-success" : "text-destructive"}`}>
                {expDelta <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {expDelta > 0 ? "+" : ""}{expDelta.toFixed(1)}% vs poprzedni miesiąc
              </div>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Oszczędności ({cur.month})</p>
              <p className={`mt-2 font-display text-2xl font-bold ${cur.savings >= 0 ? "text-gradient-brand" : "text-destructive"}`}>
                {formatPLN(cur.savings)}
              </p>
              <div className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${savDelta >= 0 ? "text-success" : "text-destructive"}`}>
                {savDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {savDelta > 0 ? "+" : ""}{savDelta.toFixed(1)}% vs poprzedni miesiąc
              </div>
            </div>
          </section>
        )}

        {/* Monthly bar chart */}
        <section className="glass-card mb-6 p-5">
          <h2 className="mb-1 font-display text-lg font-semibold">Przepływy — ostatnie {MONTHS_BACK} miesięcy</h2>
          <p className="mb-4 text-xs text-muted-foreground">Kliknij słupek, aby zobaczyć podział kategorii</p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(d) => { if (d?.activePayload) setSelectedMonth((d.activePayload[0]?.payload as { key: string }).key); }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 235 / 40%)" />
                <XAxis dataKey="month" stroke="oklch(0.68 0.03 220)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.03 220)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.21 0.03 235)", border: "1px solid oklch(0.3 0.03 235)", borderRadius: 12, color: "oklch(0.97 0.01 200)" }}
                  formatter={(v: number, name: string) => [formatPLN(v), name === "income" ? "Przychody" : name === "expense" ? "Wydatki" : "Oszczędności"]}
                  cursor={{ fill: "oklch(0.78 0.17 165 / 8%)" }}
                />
                <Bar dataKey="income" name="income" fill="oklch(0.78 0.17 165)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="expense" fill="oklch(0.65 0.22 22)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savings" name="savings" fill="oklch(0.72 0.15 200)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[oklch(0.78_0.17_165)]" />Przychody</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[oklch(0.65_0.22_22)]" />Wydatki</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.15_200)]" />Oszczędności</span>
          </div>
        </section>

        {/* Category breakdown for selected month */}
        <section className="glass-card p-5">
          <h2 className="mb-1 font-display text-lg font-semibold">
            Wydatki per kategoria — {monthLabel(activeMonth)}
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">Łącznie: {formatPLN(totalCatExpense)}</p>

          {categoryData.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Brak wydatków w tym miesiącu</p>
          ) : (
            <ul className="space-y-3">
              {categoryData.map((c) => {
                const pct = totalCatExpense > 0 ? (c.value / totalCatExpense) * 100 : 0;
                return (
                  <li key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                      </span>
                      <span className="font-display font-semibold tabular-nums">{formatPLN(c.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: c.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 FISZU · Twoja przystań finansowa
        </footer>
      </main>
    </div>
  );
}
