import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Repeat } from "lucide-react";
import { subscriptions, formatPLN } from "@/lib/finance-data";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";

/**
 * Wykrywa subskrypcje z prawdziwych transakcji użytkownika (recurring: true lub
 * powtarzające się tytuły w ostatnich 60 dniach). Jeśli brak danych — fallback
 * na demo z finance-data.
 */
function useDetectedSubscriptions() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);

  return useMemo(() => {
    if (!user || transactions.length === 0) {
      // Demo fallback
      return subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        monthly: s.monthly,
        category: s.category,
        isReal: false,
        alternative: s.alternative,
      }));
    }

    // Zbieramy transakcje z ostatnich 90 dni
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const recent = transactions.filter(
      (t) => Number(t.amount) < 0 && new Date(t.occurred_on) >= cutoff,
    );

    // Grupujemy po tytule — szukamy tych oznaczonych recurring lub powtarzających się ≥2 razy
    const byTitle = new Map<
      string,
      { count: number; totalAmt: number; category: string; recurring: boolean }
    >();
    for (const t of recent) {
      const key = t.title.trim().toLowerCase();
      const prev = byTitle.get(key);
      if (prev) {
        prev.count++;
        prev.totalAmt += Math.abs(Number(t.amount));
        if (t.recurring) prev.recurring = true;
      } else {
        byTitle.set(key, {
          count: 1,
          totalAmt: Math.abs(Number(t.amount)),
          category: t.category,
          recurring: t.recurring,
        });
      }
    }

    const detected: {
      id: string;
      name: string;
      monthly: number;
      category: string;
      isReal: boolean;
      alternative?: { name: string; price: number };
    }[] = [];

    for (const [key, v] of byTitle.entries()) {
      if (!v.recurring && v.count < 2) continue;
      // Szacujemy miesięczną kwotę: średnia z wystąpień
      const avgAmt = v.totalAmt / v.count;
      // Znajdź oryginalny tytuł (z pierwszej transakcji)
      const original = transactions.find(
        (t) => t.title.trim().toLowerCase() === key && Number(t.amount) < 0,
      );
      if (!original) continue;

      // Sprawdź czy mamy sugestię alternatywy w danych demo (dopasowanie po nazwie)
      const demoMatch = subscriptions.find((s) =>
        s.name.toLowerCase().includes(key.split(" ")[0]?.toLowerCase() ?? "") ||
        key.includes(s.name.toLowerCase().split(" ")[0] ?? ""),
      );

      detected.push({
        id: original.id,
        name: original.title,
        monthly: +avgAmt.toFixed(2),
        category: original.category,
        isReal: true,
        alternative: demoMatch?.alternative,
      });
    }

    // Jeśli nie wykryto nic — wróć do demo
    if (detected.length === 0) {
      return subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        monthly: s.monthly,
        category: s.category,
        isReal: false,
        alternative: s.alternative,
      }));
    }

    return detected.sort((a, b) => b.monthly - a.monthly);
  }, [user, transactions]);
}

export function SavingsOpportunities() {
  const items = useDetectedSubscriptions();
  const opps = items.filter((s) => s.alternative);
  const allItems = items; // pokazujemy wszystkie wykryte subskrypcje
  const totalMonthly = opps.reduce((s, o) => s + (o.monthly - (o.alternative?.price ?? 0)), 0);
  const yearly = totalMonthly * 12;
  const hasReal = items.some((i) => i.isReal);

  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 -top-20 h-40 bg-[var(--gradient-glow)]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-display text-lg font-semibold">Możesz zaoszczędzić</h3>
              {hasReal && (
                <p className="flex items-center gap-1 text-[10px] text-success">
                  <Repeat className="h-3 w-3" /> Wykryto z Twoich transakcji
                </p>
              )}
            </div>
          </div>
          {opps.length > 0 && (
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-gradient-brand">{formatPLN(totalMonthly)}</p>
              <p className="text-xs text-muted-foreground">miesięcznie · {formatPLN(yearly)} rocznie</p>
            </div>
          )}
        </div>

        {opps.length > 0 ? (
          <ul className="space-y-2.5">
            {opps.map((s, i) => {
              const save = s.monthly - (s.alternative?.price ?? 0);
              return (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3 transition hover:border-primary/40 hover:bg-secondary/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="line-through">{formatPLN(s.monthly)}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-foreground">{s.alternative?.name} · {formatPLN(s.alternative?.price ?? 0)}</span>
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
                    -{formatPLN(save)}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        ) : null}

        {/* Wszystkie wykryte subskrypcje bez alternatywy */}
        {allItems.filter((s) => !s.alternative).length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Pozostałe cykliczne wydatki
            </p>
            <ul className="space-y-1.5">
              {allItems
                .filter((s) => !s.alternative)
                .map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2"
                  >
                    <span className="truncate text-sm text-foreground/80">{s.name}</span>
                    <span className="ml-3 shrink-0 text-xs font-medium text-muted-foreground">
                      {formatPLN(s.monthly)}/mies.
                    </span>
                  </motion.li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
