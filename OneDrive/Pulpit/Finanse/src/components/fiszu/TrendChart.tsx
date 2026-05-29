import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthlyTrend, formatPLN } from "@/lib/finance-data";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";

export function TrendChart() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);

  const chartData = useMemo(() => {
    if (!user || transactions.length === 0) return monthlyTrend;

    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const agg = new Map<string, { przychody: number; wydatki: number }>();
    months.forEach((m) => agg.set(m, { przychody: 0, wydatki: 0 }));

    for (const t of transactions) {
      const key = t.occurred_on.slice(0, 7);
      if (!agg.has(key)) continue;
      const v = agg.get(key)!;
      const amt = Number(t.amount);
      if (amt >= 0) v.przychody += amt;
      else v.wydatki += Math.abs(amt);
    }

    return months.map((key) => {
      const v = agg.get(key)!;
      const d = new Date(key + "-01");
      const month = d.toLocaleDateString("pl-PL", { month: "short" });
      return {
        month,
        przychody: Math.round(v.przychody),
        wydatki: Math.round(v.wydatki),
        oszczednosci: Math.round(Math.max(0, v.przychody - v.wydatki)),
      };
    });
  }, [user, transactions]);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Przepływy finansowe</h3>
          <p className="text-xs text-muted-foreground">Ostatnie 6 miesięcy</p>
        </div>
        <div className="flex gap-3 text-xs">
          <Legend color="oklch(0.78 0.17 165)" label="Przychody" />
          <Legend color="oklch(0.65 0.22 22)" label="Wydatki" />
          <Legend color="oklch(0.72 0.15 200)" label="Oszczędności" />
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="g-prz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.17 165)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.78 0.17 165)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-wyd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.22 22)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.65 0.22 22)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-osz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 235 / 40%)" />
            <XAxis dataKey="month" stroke="oklch(0.68 0.03 220)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.68 0.03 220)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.21 0.03 235)",
                border: "1px solid oklch(0.3 0.03 235)",
                borderRadius: 12,
                color: "oklch(0.97 0.01 200)",
              }}
              formatter={(v: number) => formatPLN(v)}
            />
            <Area type="monotone" dataKey="przychody" name="Przychody" stroke="oklch(0.78 0.17 165)" strokeWidth={2} fill="url(#g-prz)" />
            <Area type="monotone" dataKey="wydatki" name="Wydatki" stroke="oklch(0.65 0.22 22)" strokeWidth={2} fill="url(#g-wyd)" />
            <Area type="monotone" dataKey="oszczednosci" name="Oszczędności" stroke="oklch(0.72 0.15 200)" strokeWidth={2} fill="url(#g-osz)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
