import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { formatPLN, recentTransactions as demoTx } from "@/lib/finance-data";
import {
  ShoppingCart, Fuel, Utensils, Music, Briefcase, Package,
  Repeat, Trash2, Search, TrendingUp, TrendingDown, Wallet,
  Plus, Pencil, Download, ChevronDown, ChevronUp, FileText,
  Home, Heart, GraduationCap, MoreHorizontal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const iconFor = (cat: string) => {
  switch (cat) {
    case "Jedzenie": return Utensils;
    case "Transport": return Fuel;
    case "Subskrypcje": return Music;
    case "Przychód": return Briefcase;
    case "Zakupy": return Package;
    case "Mieszkanie": return Home;
    case "Zdrowie": return Heart;
    case "Edukacja": return GraduationCap;
    case "Rozrywka": return MoreHorizontal;
    default: return ShoppingCart;
  }
};

function exportToCSV(items: { title: string; category: string; amount: number; occurred_on: string; recurring: boolean }[]) {
  const header = ["Data", "Tytuł", "Kategoria", "Kwota (PLN)", "Cykliczna"];
  const rows = items.map((t) => [
    t.occurred_on,
    `"${t.title.replace(/"/g, '""')}"`,
    t.category,
    t.amount.toFixed(2).replace(".", ","),
    t.recurring ? "Tak" : "Nie",
  ]);
  const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fiszu-transakcje-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TransactionSkeleton() {
  return (
    <ul className="divide-y divide-border" aria-busy="true" aria-label="Ładowanie transakcji">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted/30 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-muted/30 animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted/20 animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-16 rounded bg-muted/20 animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

const PAGE_SIZE = 20;

export function TransactionsPanel() {
  const { user } = useAuth();
  const { transactions, loading, remove } = useTransactions(user?.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [page, setPage] = useState(1);

  const isAuthed = !!user;
  const items = useMemo(() => {
    if (!isAuthed) {
      return demoTx.map((t) => ({
        id: t.id, title: t.title, category: t.category,
        amount: t.amount, recurring: !!t.recurring,
        occurred_on: t.date, note: null as string | null,
      }));
    }
    return transactions.map((t) => ({
      id: t.id, title: t.title, category: t.category,
      amount: Number(t.amount), recurring: t.recurring,
      occurred_on: t.occurred_on, note: t.note,
    }));
  }, [isAuthed, transactions]);

  const filtered = useMemo(() => {
    setPage(1);
    return items.filter((t) => {
      if (filter === "income" && t.amount <= 0) return false;
      if (filter === "expense" && t.amount > 0) return false;
      if (q) {
        const lq = q.toLowerCase();
        if (!t.title.toLowerCase().includes(lq) && !t.category.toLowerCase().includes(lq) && !(t.note ?? "").toLowerCase().includes(lq)) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, filter]);

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    let income = 0, expense = 0;
    for (const t of items) {
      if (!t.occurred_on.startsWith(month)) continue;
      if (t.amount >= 0) income += t.amount;
      else expense += Math.abs(t.amount);
    }
    return { income, expense, balance: income - expense };
  }, [items]);

  const visibleItems = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > visibleItems.length;
  const deletingItem = items.find((t) => t.id === deletingId);

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Transakcje</h3>
          <p className="text-xs text-muted-foreground">
            {isAuthed ? "Twoja historia, synchronizowana w czasie rzeczywistym" : "Demo — zaloguj się, aby dodawać własne"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => exportToCSV(items)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              title="Eksportuj do CSV"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          )}
          <AddTransactionDialog
            trigger={
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Dodaj
              </button>
            }
          />
        </div>
      </div>

      {/* Stats this month */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card/40 p-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-success" /> Wpływy
          </div>
          <div className="mt-1 font-display text-sm font-semibold text-success">{formatPLN(stats.income)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <TrendingDown className="h-3 w-3 text-destructive" /> Wydatki
          </div>
          <div className="mt-1 font-display text-sm font-semibold text-destructive">{formatPLN(stats.expense)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Wallet className="h-3 w-3" /> Saldo m-ca
          </div>
          <div className={`mt-1 font-display text-sm font-semibold ${stats.balance >= 0 ? "text-success" : "text-destructive"}`}>
            {formatPLN(stats.balance)}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj po tytule, kategorii, notatce…"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          {([
            ["all", "Wszystkie"],
            ["income", "Wpływy"],
            ["expense", "Wydatki"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading && isAuthed ? (
        <TransactionSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Brak transakcji do wyświetlenia</p>
          {q && <p className="mt-1 text-xs text-muted-foreground">Spróbuj zmienić wyszukiwaną frazę</p>}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {visibleItems.map((t) => {
                const Icon = iconFor(t.category);
                const isIncome = t.amount > 0;
                const isExpanded = expandedId === t.id;
                const hasNote = !!t.note;
                return (
                  <motion.li
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`shrink-0 rounded-lg p-2 ${isIncome ? "bg-primary/15 text-primary" : "bg-secondary text-foreground/80"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {t.title}
                            {t.recurring && <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" title="Cykliczna" />}
                            {hasNote && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : t.id)}
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                aria-label={isExpanded ? "Ukryj notatkę" : "Pokaż notatkę"}
                              >
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.category} · {format(parseISO(t.occurred_on), "d MMM yyyy", { locale: pl })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-display text-sm font-semibold tabular-nums ${isIncome ? "text-success" : "text-foreground"}`}>
                          {isIncome ? "+" : ""}{formatPLN(t.amount)}
                        </span>
                        {isAuthed && (
                          <>
                            <button
                              onClick={() => setEditingId(t.id)}
                              className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                              aria-label="Edytuj transakcję"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(t.id)}
                              className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                              aria-label="Usuń transakcję"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && hasNote && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-3 ml-11 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/70">Notatka: </span>{t.note}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="mt-4 w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              Załaduj więcej ({filtered.length - visibleItems.length} pozostałych)
            </button>
          )}

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Wyświetlono {visibleItems.length} z {filtered.length} transakcji
          </p>
        </>
      )}

      {/* Edit dialog */}
      {isAuthed && (
        <AddTransactionDialog
          editing={transactions.find((x) => x.id === editingId) ?? null}
          open={!!editingId}
          onOpenChange={(v) => { if (!v) setEditingId(null); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń transakcję</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć{" "}
              <span className="font-semibold text-foreground">„{deletingItem?.title}"</span>?{" "}
              Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deletingId) {
                  await remove(deletingId);
                  setDeletingId(null);
                }
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
