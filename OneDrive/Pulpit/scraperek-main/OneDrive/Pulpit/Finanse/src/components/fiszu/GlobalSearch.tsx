import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { formatPLN, recentTransactions as demoTx } from "@/lib/finance-data";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Zap, Receipt, Target, PiggyBank, BarChart3,
  TrendingUp, TrendingDown,
} from "lucide-react";

const PAGES = [
  { to: "/", label: "Pulpit", icon: LayoutDashboard },
  { to: "/symulator", label: "Symulator oszczędności", icon: Zap },
  { to: "/transakcje", label: "Transakcje", icon: Receipt },
  { to: "/budzet", label: "Budżet miesięczny", icon: Target },
  { to: "/cele", label: "Cele oszczędnościowe", icon: PiggyBank },
  { to: "/raporty", label: "Raporty", icon: BarChart3 },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function GlobalSearch({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const [q, setQ] = useState("");

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  const txSource = useMemo(() => {
    if (user && transactions.length > 0) {
      return transactions.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        amount: Number(t.amount),
        date: t.occurred_on,
      }));
    }
    return demoTx.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      amount: t.amount,
      date: t.date,
    }));
  }, [user, transactions]);

  const matchedTx = useMemo(() => {
    if (!q || q.length < 2) return [];
    const lq = q.toLowerCase();
    return txSource
      .filter((t) => t.title.toLowerCase().includes(lq) || t.category.toLowerCase().includes(lq))
      .slice(0, 6);
  }, [q, txSource]);

  const go = (to: string) => {
    onOpenChange(false);
    setQ("");
    navigate({ to: to as "/" });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Szukaj stron, transakcji…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        <CommandEmpty>Brak wyników dla „{q}"</CommandEmpty>

        <CommandGroup heading="Nawigacja">
          {PAGES.map(({ to, label, icon: Icon }) => (
            <CommandItem key={to} onSelect={() => go(to)} className="gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        {matchedTx.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Transakcje">
              {matchedTx.map((t) => {
                const isIncome = t.amount > 0;
                return (
                  <CommandItem
                    key={t.id}
                    onSelect={() => go("/transakcje")}
                    className="gap-2"
                  >
                    {isIncome
                      ? <TrendingUp className="h-4 w-4 text-success" />
                      : <TrendingDown className="h-4 w-4 text-destructive" />
                    }
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{t.category}</span>
                    <span className={`text-xs font-semibold tabular-nums ${isIncome ? "text-success" : ""}`}>
                      {isIncome ? "+" : ""}{formatPLN(t.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(t.date), "d MMM", { locale: pl })}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
