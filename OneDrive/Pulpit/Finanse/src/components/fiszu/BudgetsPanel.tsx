import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, Target, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useBudgets, type Budget } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { formatPLN, recentTransactions } from "@/lib/finance-data";
import { cn } from "@/lib/utils";

const COMMON_CATEGORIES = [
  "Jedzenie",
  "Transport",
  "Mieszkanie",
  "Rozrywka",
  "Subskrypcje",
  "Zdrowie",
  "Zakupy",
  "Inne",
];

function statusColor(pct: number, threshold: number) {
  if (pct >= 100) return "destructive";
  if (pct >= threshold) return "warning";
  return "ok";
}

function BudgetForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Budget>;
  onSave: (data: { category: string; monthly_limit: number; alert_threshold: number }) => Promise<boolean>;
  onClose: () => void;
}) {
  const [category, setCategory] = useState(initial?.category ?? "Jedzenie");
  const [limit, setLimit] = useState<string>(initial?.monthly_limit?.toString() ?? "1000");
  const [threshold, setThreshold] = useState<string>(initial?.alert_threshold?.toString() ?? "80");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Kategoria</Label>
        <Select value={category} onValueChange={setCategory} disabled={!!initial?.id}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Limit miesięczny (PLN)</Label>
        <Input type="number" min={1} step={50} value={limit} onChange={(e) => setLimit(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Próg alertu: {threshold}%</Label>
        <Input
          type="range"
          min={50}
          max={100}
          step={5}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Powiadomimy Cię, gdy wydatki osiągną {threshold}% limitu.
        </p>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Anuluj</Button>
        <Button
          disabled={saving || !limit || Number(limit) <= 0}
          onClick={async () => {
            setSaving(true);
            const ok = await onSave({
              category,
              monthly_limit: Number(limit),
              alert_threshold: Number(threshold),
            });
            setSaving(false);
            if (ok) onClose();
          }}
        >
          Zapisz
        </Button>
      </DialogFooter>
    </div>
  );
}

export function BudgetsPanel() {
  const { user } = useAuth();
  const { budgets, upsert, remove } = useBudgets(user?.id);
  const { transactions } = useTransactions(user?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const spentByCategory = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const map = new Map<string, number>();
    const source = user
      ? transactions.map((t) => ({ category: t.category, amount: Number(t.amount), date: t.occurred_on }))
      : recentTransactions.map((t) => ({ category: t.category, amount: t.amount, date: t.date }));
    for (const t of source) {
      if (t.amount >= 0) continue;
      if (!t.date.startsWith(key)) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    return map;
  }, [transactions, user]);

  const rows = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = spentByCategory.get(b.category) ?? 0;
        const limit = Number(b.monthly_limit);
        const pct = limit > 0 ? Math.min(999, (spent / limit) * 100) : 0;
        return { ...b, spent, pct, status: statusColor(pct, b.alert_threshold) };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, spentByCategory]);

  const alerts = rows.filter((r) => r.status !== "ok");

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-display text-lg font-semibold">Budżety miesięczne</h3>
            <p className="text-xs text-muted-foreground">
              {rows.length === 0 ? "Ustaw limity per kategoria" : `Aktywne: ${rows.length}`}
            </p>
          </div>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Nowy budżet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edytuj budżet" : "Nowy budżet"}</DialogTitle>
            </DialogHeader>
            <BudgetForm
              initial={editing ?? undefined}
              onSave={upsert}
              onClose={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-lg border border-[oklch(0.65_0.22_22)]/40 bg-[oklch(0.65_0.22_22)]/10 p-3"
          >
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-[oklch(0.78_0.18_60)]" />
              <div>
                <p className="font-medium text-foreground">
                  {alerts.length === 1 ? "1 kategoria wymaga uwagi" : `${alerts.length} kategorie wymagają uwagi`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alerts
                    .slice(0, 3)
                    .map((a) => `${a.category} (${Math.round(a.pct)}%)`)
                    .join(" · ")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <Wallet className="h-8 w-8 opacity-40" />
          <p>Brak budżetów. Dodaj pierwszy, aby śledzić limity wydatków.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => {
            const remaining = Number(r.monthly_limit) - r.spent;
            const barColor =
              r.status === "destructive"
                ? "bg-[oklch(0.65_0.22_22)]"
                : r.status === "warning"
                  ? "bg-[oklch(0.78_0.18_60)]"
                  : "bg-[oklch(0.78_0.17_165)]";
            return (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-lg border border-border/60 bg-card/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.category}</span>
                      {r.status === "destructive" && (
                        <span className="rounded-full bg-[oklch(0.65_0.22_22)]/20 px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.78_0.2_22)]">
                          Limit przekroczony
                        </span>
                      )}
                      {r.status === "warning" && (
                        <span className="rounded-full bg-[oklch(0.78_0.18_60)]/20 px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.85_0.18_60)]">
                          Blisko limitu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPLN(r.spent)} z {formatPLN(Number(r.monthly_limit))}
                      {" · "}
                      {remaining >= 0
                        ? `pozostało ${formatPLN(remaining)}`
                        : `przekroczone o ${formatPLN(-remaining)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}
                    >
                      Edytuj
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(r.id)}
                      aria-label="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className={cn("h-full transition-all", barColor)}
                      style={{ width: `${Math.min(100, r.pct)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>{Math.round(r.pct)}% wykorzystane</span>
                    <span>alert przy {r.alert_threshold}%</span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
