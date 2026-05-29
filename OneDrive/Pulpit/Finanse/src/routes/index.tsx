import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Wallet, PiggyBank, TrendingUp, CreditCard } from "lucide-react";
import { AppNav } from "@/components/fiszu/AppNav";
import { StatCard } from "@/components/fiszu/StatCard";
import { TrendChart } from "@/components/fiszu/TrendChart";
import { CategoryChart } from "@/components/fiszu/CategoryChart";
import { SavingsOpportunities } from "@/components/fiszu/SavingsOpportunities";
import { SaveMoneyHub } from "@/components/fiszu/SaveMoneyHub";
import { TransactionsPanel } from "@/components/fiszu/TransactionsPanel";
import { InsightsSection } from "@/components/fiszu/InsightsSection";
import { BudgetsPanel } from "@/components/fiszu/BudgetsPanel";
import { AddTransactionDialog } from "@/components/fiszu/AddTransactionDialog";
import { SavingsGoal } from "@/components/fiszu/SavingsGoal";
import { formatPLN, recentTransactions } from "@/lib/finance-data";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function getGreeting(email: string | undefined): string {
  if (!email) return "Gościu";
  const local = email.split("@")[0] ?? "";
  const name = local.replace(/[._\-0-9]/g, " ").trim().split(" ")[0] ?? local;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function Dashboard() {
  const { user } = useAuth();
  const { transactions } = useTransactions(user?.id);
  const greeting = getGreeting(user?.email);
  const [addOpen, setAddOpen] = useState(false);

  // Keyboard shortcut: N = new transaction
  useKeyboardShortcuts([
    { key: "n", handler: () => setAddOpen(true), description: "Nowa transakcja" },
  ]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonth = (() => {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    const source = user
      ? transactions.map((t) => ({ date: t.occurred_on, amount: Number(t.amount), category: t.category }))
      : recentTransactions.map((t) => ({ date: t.date, amount: t.amount, category: t.category }));

    let balance = 0, curExpense = 0, prevExpense = 0, curIncome = 0, prevIncome = 0, subscriptions = 0;

    for (const t of source) {
      balance += t.amount;
      const month = t.date.slice(0, 7);
      if (t.amount < 0) {
        if (month === currentMonth) curExpense += Math.abs(t.amount);
        if (month === prevMonth) prevExpense += Math.abs(t.amount);
        if (t.category === "Subskrypcje" && month === currentMonth) subscriptions += Math.abs(t.amount);
      } else {
        if (month === currentMonth) curIncome += t.amount;
        if (month === prevMonth) prevIncome += t.amount;
      }
    }

    const savings = curIncome - curExpense;
    const prevSavings = prevIncome - prevExpense;
    const expenseDelta = prevExpense > 0 ? ((curExpense - prevExpense) / prevExpense) * 100 : 0;
    const savingsDelta = prevSavings !== 0 ? ((savings - prevSavings) / Math.abs(prevSavings)) * 100 : 0;
    const monthName = now.toLocaleDateString("pl-PL", { month: "long" });

    return { balance, curExpense, savings, subscriptions, expenseDelta, savingsDelta, monthName };
  }, [user, transactions]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-orb bg-orb-1" aria-hidden />
      <div className="bg-orb bg-orb-2" aria-hidden />
      <div className="bg-orb bg-orb-3" aria-hidden />

      <AppNav />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <p className="text-sm text-muted-foreground">Cześć, {greeting} 👋</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Twoje finanse <span className="text-gradient-brand">pod kontrolą</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              FISZU analizuje Twoje wydatki i pokazuje, jak co miesiąc oszczędzić więcej — bez wyrzeczeń.
            </p>
          </div>
          <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />
        </motion.section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Saldo łączne" value={formatPLN(user ? stats.balance : 18420.55)} delta={0} icon={Wallet} accent="primary" index={0} />
          <StatCard label={`Wydatki w ${stats.monthName}`} value={formatPLN(user ? stats.curExpense : 5298)} delta={user ? Math.round(stats.expenseDelta * 10) / 10 : -8.3} icon={CreditCard} accent="accent" index={1} />
          <StatCard label="Oszczędności m-ca" value={formatPLN(user ? stats.savings : 3402)} delta={user ? Math.round(stats.savingsDelta * 10) / 10 : 12.7} icon={PiggyBank} accent="primary" index={2} />
          <StatCard label="Subskrypcje" value={formatPLN(user ? stats.subscriptions : 508)} delta={0} icon={TrendingUp} accent="warning" index={3} />
        </section>

        {/* Charts row */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><TrendChart /></div>
          <CategoryChart />
        </section>

        {/* Savings hub & goal */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><SaveMoneyHub /></div>
          <SavingsGoal />
        </section>

        <section className="mt-6"><SavingsOpportunities /></section>
        <section className="mt-6"><InsightsSection /></section>
        <section className="mt-6"><BudgetsPanel /></section>
        <section className="mt-6"><TransactionsPanel /></section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 FISZU · Twoja przystań finansowa
        </footer>
      </main>
    </div>
  );
}
