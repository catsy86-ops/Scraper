import { useMemo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { formatPLN } from "@/lib/finance-data";

type ScoreComponent = {
  label: string;
  score: number; // 0–100
  weight: number;
  detail: string;
  trend?: "up" | "down" | "neutral";
};

/**
 * Oblicza wskaźnik zdrowia finansowego 0–100 na podstawie:
 * - Stopy oszczędności (savings rate) — waga 40%
 * - Wykorzystania budżetów — waga 35%
 * - Regularności wpływów — waga 25%
 */
function useFinancialHealth() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const { budgets } = useBudgets(user?.id);

  return useMemo(() => {
    if (!user || transactions.length === 0) return null;

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevKey = (() => {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    // Agregacja per miesiąc
    const agg = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const key = t.occurred_on.slice(0, 7);
      const v = agg.get(key) ?? { income: 0, expense: 0 };
      const amt = Number(t.amount);
      if (amt >= 0) v.income += amt;
      else v.expense += Math.abs(amt);
      agg.set(key, v);
    }

    const cur = agg.get(currentKey) ?? { income: 0, expense: 0 };
    const prev = agg.get(prevKey) ?? { income: 0, expense: 0 };

    // ── 1. Stopa oszczędności (savings rate) ──────────────────────────────
    // Ideał: ≥20% = 100 pkt, 0% = 0 pkt, ujemna = 0 pkt
    const savingsRate = cur.income > 0
      ? Math.max(0, (cur.income - cur.expense) / cur.income)
      : 0;
    const savingsScore = Math.min(100, Math.round((savingsRate / 0.2) * 100));
    const savingsDetail = cur.income > 0
      ? `${Math.round(savingsRate * 100)}% dochodu odkładasz (cel: ≥20%)`
      : "Brak wpływów w tym miesiącu";
    const savingsTrend: "up" | "down" | "neutral" = (() => {
      if (prev.income === 0) return "neutral";
      const prevRate = Math.max(0, (prev.income - prev.expense) / prev.income);
      if (savingsRate > prevRate + 0.02) return "up";
      if (savingsRate < prevRate - 0.02) return "down";
      return "neutral";
    })();

    // ── 2. Wykorzystanie budżetów ─────────────────────────────────────────
    // Brak budżetów = 50 pkt (neutralne). Każde przekroczenie obniża wynik.
    let budgetScore = 50;
    let budgetDetail = "Brak ustawionych budżetów";
    if (budgets.length > 0) {
      const spentByCategory = new Map<string, number>();
      for (const t of transactions) {
        if (Number(t.amount) >= 0) continue;
        if (!t.occurred_on.startsWith(currentKey)) continue;
        const cat = t.category;
        spentByCategory.set(cat, (spentByCategory.get(cat) ?? 0) + Math.abs(Number(t.amount)));
      }
      const pcts = budgets.map((b) => {
        const spent = spentByCategory.get(b.category) ?? 0;
        return Math.min(150, (spent / b.monthly_limit) * 100);
      });
      const avgPct = pcts.reduce((s, p) => s + p, 0) / pcts.length;
      // 0% = 100 pkt, 100% = 50 pkt, 150% = 0 pkt
      budgetScore = Math.max(0, Math.round(100 - (avgPct / 150) * 100));
      const over = pcts.filter((p) => p >= 100).length;
      budgetDetail = over > 0
        ? `${over} z ${budgets.length} budżetów przekroczonych`
        : `Średnie wykorzystanie: ${Math.round(avgPct)}%`;
    }

    // ── 3. Regularność wpływów ────────────────────────────────────────────
    // Sprawdzamy ostatnie 3 miesiące — czy były wpływy w każdym
    const recentMonths: string[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      recentMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const monthsWithIncome = recentMonths.filter((m) => (agg.get(m)?.income ?? 0) > 0).length;
    const regularityScore = Math.round((monthsWithIncome / 3) * 100);
    const regularityDetail = monthsWithIncome === 3
      ? "Regularne wpływy przez ostatnie 3 miesiące"
      : `Wpływy w ${monthsWithIncome}/3 ostatnich miesiącach`;

    // ── Wynik końcowy ─────────────────────────────────────────────────────
    const components: ScoreComponent[] = [
      { label: "Stopa oszczędności", score: savingsScore, weight: 0.4, detail: savingsDetail, trend: savingsTrend },
      { label: "Dyscyplina budżetowa", score: budgetScore, weight: 0.35, detail: budgetDetail },
      { label: "Regularność wpływów", score: regularityScore, weight: 0.25, detail: regularityDetail },
    ];

    const total = Math.round(
      components.reduce((s, c) => s + c.score * c.weight, 0),
    );

    const label =
      total >= 80 ? "Doskonały" :
      total >= 60 ? "Dobry" :
      total >= 40 ? "Wymaga uwagi" :
      "Krytyczny";

    const color =
      total >= 80 ? "oklch(0.78 0.17 165)" :
      total >= 60 ? "oklch(0.72 0.15 200)" :
      total >= 40 ? "oklch(0.78 0.18 60)" :
      "oklch(0.65 0.22 22)";

    return { total, label, color, components, curIncome: cur.income, curExpense: cur.expense };
  }, [user, transactions, budgets]);
}

export function FinancialHealthScore() {
  const health = useFinancialHealth();

  if (!health) return null;

  const { total, label, color, components } = health;
  const circumference = 2 * Math.PI * 36; // r=36
  const dash = (total / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-display text-lg font-semibold">Zdrowie finansowe</h3>
          <p className="text-xs text-muted-foreground">Bieżący miesiąc</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Circular gauge */}
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle
              cx="48" cy="48" r="36"
              fill="none"
              stroke="oklch(0.3 0.03 235 / 40%)"
              strokeWidth="8"
            />
            <motion.circle
              cx="48" cy="48" r="36"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - dash }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold" style={{ color }}>{total}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Label + summary */}
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold" style={{ color }}>{label}</p>
          <div className="mt-2 space-y-1.5">
            {components.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {c.trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                    {c.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                    {(c.trend === "neutral" || !c.trend) && <Minus className="h-3 w-3 text-muted-foreground/50" />}
                    {c.label}
                  </span>
                  <span className="font-semibold tabular-nums">{c.score}</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.score}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{
                      background: c.score >= 70 ? "oklch(0.78 0.17 165)" :
                                  c.score >= 40 ? "oklch(0.78 0.18 60)" :
                                  "oklch(0.65 0.22 22)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-1">
        {components.map((c) => (
          <p key={c.label} className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/70">{c.label}:</span> {c.detail}
          </p>
        ))}
      </div>
    </motion.div>
  );
}
