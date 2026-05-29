import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { subscriptions, formatPLN } from "@/lib/finance-data";

export function SavingsOpportunities() {
  const opps = subscriptions.filter((s) => s.alternative);
  const totalMonthly = opps.reduce((s, o) => s + (o.monthly - (o.alternative?.price ?? 0)), 0);
  const yearly = totalMonthly * 12;

  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 -top-20 h-40 bg-[var(--gradient-glow)]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Możesz zaoszczędzić</h3>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-gradient-brand">{formatPLN(totalMonthly)}</p>
            <p className="text-xs text-muted-foreground">miesięcznie · {formatPLN(yearly)} rocznie</p>
          </div>
        </div>

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
      </div>
    </div>
  );
}
