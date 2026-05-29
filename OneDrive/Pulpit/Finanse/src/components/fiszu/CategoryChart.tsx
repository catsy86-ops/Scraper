import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryBreakdown, formatPLN } from "@/lib/finance-data";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.7 0.18 300)",
];

export function CategoryChart() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);

  const data = useMemo(() => {
    if (!user || transactions.length === 0) return categoryBreakdown;

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const catMap = new Map<string, number>();

    for (const t of transactions) {
      if (Number(t.amount) >= 0) continue;
      if (!t.occurred_on.startsWith(currentKey)) continue;
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(Number(t.amount)));
    }

    return [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));
  }, [user, transactions]);

  const total = data.reduce((s, c) => s + c.value, 0);

  return (
    <div className="glass-card p-5">
      <h3 className="font-display text-lg font-semibold">Wydatki wg kategorii</h3>
      <p className="text-xs text-muted-foreground">Ten miesiąc</p>

      {data.length === 0 ? (
        <div className="mt-8 flex h-56 items-center justify-center text-sm text-muted-foreground">
          Brak wydatków w tym miesiącu
        </div>
      ) : (
        <>
          <div className="relative mt-2 h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((c, i) => (
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
              <span className="font-display text-xl font-bold">{formatPLN(total)}</span>
            </div>
          </div>

          <ul className="mt-3 space-y-2">
            {data.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-foreground/90">{c.name}</span>
                </span>
                <span className="font-medium tabular-nums">{formatPLN(c.value)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
