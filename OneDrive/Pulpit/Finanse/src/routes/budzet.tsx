import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { AppNav } from "@/components/fiszu/AppNav";
import { BudgetsPanel } from "@/components/fiszu/BudgetsPanel";
import { CategoryChart } from "@/components/fiszu/CategoryChart";

export const Route = createFileRoute("/budzet")({
  head: () => ({
    meta: [
      { title: "Budżet — FISZU" },
      { name: "description", content: "Zarządzaj miesięcznymi limitami wydatków per kategoria." },
    ],
  }),
  component: BudzetPage,
});

function BudzetPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="bg-orb bg-orb-1" aria-hidden />
      <div className="bg-orb bg-orb-2" aria-hidden />
      <AppNav />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Kontrola</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Miesięczny <span className="text-gradient-brand">budżet</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Ustaw limity wydatków per kategoria i śledź, jak blisko jesteś ich przekroczenia.
          </p>
        </motion.div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BudgetsPanel />
          </div>
          <div>
            <CategoryChart />
          </div>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 FISZU · Twoja przystań finansowa
        </footer>
      </main>
    </div>
  );
}
