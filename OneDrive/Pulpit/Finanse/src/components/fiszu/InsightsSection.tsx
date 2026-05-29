import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PieChartIcon, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { formatPLN, recentTransactions } from "@/lib/finance-data";

const PALETTE = [
  "oklch(0.78 0.17 165)",
  "oklch(0.72 0.15 200)",
  "oklch(0.75 0.16 75)",
  "oklch(0.65 0.22 22)",
  "oklch(0.7 0.18 300)",
  "oklch(0.6 0.05 240)",
];

type AnyTx = { occurred_on?: string; date?: string; amount: number; category: string };

function monthKey(iso: string) {
  return iso.slice(0, 7); // YYYY-MM
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString("pl-PL", { month: "short" });
}

export function InsightsSection() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);

  const source: AnyTx[] = user
    ? transactions
    : (recentTransactions as unknown as AnyTx[]);

  const { topCategories, monthly, totalExpenses } = useMemo(() => {
    const getDate = (t: AnyTx) => t.occurred_on ?? t.date ?? "";

    // Top 5 categories by expenses (current month)
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const catMap = new Map<string, number>();
    for (const t of source) {
      if (t.amount >= 0) continue;
      const key = monthKey(getDate(t));
      if (key !== currentKey) continue;
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(Number(t.amount)));
    }
    const sorted = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));
    const totalExp = sorted.reduce((s, c) => s + c.value, 0);

    // Last 6 months balance trend
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const agg = new Map<string, { income: number; expense: number }>();
    months.forEach((m) => agg.set(m, { income: 0, expense: 0 }));
    for (const t of source) {
      const k = monthKey(getDate(t));
      if (!agg.has(k)) continue;
      const v = agg.get(k)!;
      const amt = Number(t.amount);
      if (amt >= 0) v.income += amt;
      else v.expense += Math.abs(amt);
    }
    let running = 0;
    const monthly = months.map((k) => {
      const v = agg.get(k)!;
      const net = v.income - v.expense;
      running += net;
      return { month: monthLabel(k), saldo: Math.round(running), netto: Math.round(net) };
    });

    return { topCategories: sorted, monthly, totalExpenses: totalExp };
  }, [source]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-5"
    >
      {/* Top categories */}
      <div className="glass-card p-5 lg:col-span-2">
        <div className="mb-2 flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Top 5 kategorii wydatków</h3>
        </div>
        <p className="text-xs text-muted-foreground">Bieżący miesiąc</p>

        {topCategories.length === 0 ? (
          <div className="mt-8 flex h-56 items-center justify-center text-sm text-muted-foreground">
            Brak wydatków w tym miesiącu
          </div>
        ) : (
          <>
            <div className="relative mt-2 h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={topCategories}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {topCategories.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.03 235)",
                      border: "1px solid oklch(0.3 0.03 235)",
                      borderRadius: 12,
                      color: "oklch(0.97 0.01 200)",
                    }}
                    formatter={(v: number) => formatPLN(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Razem</span>
                <span className="font-display text-xl font-bold">{formatPLN(totalExpenses)}</span>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {topCategories.map((c) => {
                const pct = totalExpenses ? Math.round((c.value / totalExpenses) * 100) : 0;
                return (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-foreground/90">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </span>
                    <span className="font-medium tabular-nums">{formatPLN(c.value)}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Balance trend */}
      <div className="glass-card p-5 lg:col-span-3">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Trend salda</h3>
        </div>
        <p className="text-xs text-muted-foreground">Ostatnie 6 miesięcy (skumulowane netto)</p>
        <div className="mt-3 h-72 w-full">
          <ResponsiveContainer>
            <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="g-saldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.17 165)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="oklch(0.78 0.17 165)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 235 / 40%)" />
              <XAxis
                dataKey="month"
                stroke="oklch(0.68 0.03 220)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.68 0.03 220)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.21 0.03 235)",
                  border: "1px solid oklch(0.3 0.03 235)",
                  borderRadius: 12,
                  color: "oklch(0.97 0.01 200)",
                }}
                formatter={(v: number, name) => [formatPLN(v), name === "saldo" ? "Saldo" : "Netto"]}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="oklch(0.78 0.17 165)"
                strokeWidth={2.5}
                fill="url(#g-saldo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.section>
  );
}
