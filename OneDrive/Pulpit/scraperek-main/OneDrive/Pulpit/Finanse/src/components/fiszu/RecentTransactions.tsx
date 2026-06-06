import { recentTransactions, formatPLN } from "@/lib/finance-data";
import { ShoppingCart, Fuel, Utensils, Music, Briefcase, Package, Repeat } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

const iconFor = (cat: string) => {
  switch (cat) {
    case "Jedzenie": return Utensils;
    case "Transport": return Fuel;
    case "Subskrypcje": return Music;
    case "Przychód": return Briefcase;
    case "Zakupy": return Package;
    default: return ShoppingCart;
  }
};

export function RecentTransactions() {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Ostatnie transakcje</h3>
        <button className="text-xs font-medium text-primary hover:underline">Zobacz wszystkie</button>
      </div>
      <ul className="divide-y divide-border">
        {recentTransactions.map((t) => {
          const Icon = iconFor(t.category);
          const isIncome = t.amount > 0;
          return (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${isIncome ? "bg-primary/15 text-primary" : "bg-secondary text-foreground/80"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {t.title}
                    {t.recurring && <Repeat className="h-3 w-3 text-muted-foreground" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {format(parseISO(t.date), "d MMM", { locale: pl })}
                  </p>
                </div>
              </div>
              <span className={`font-display text-sm font-semibold tabular-nums ${isIncome ? "text-success" : "text-foreground"}`}>
                {isIncome ? "+" : ""}{formatPLN(t.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
