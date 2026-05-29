import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PiggyBank } from "lucide-react";
import { AppNav } from "@/components/fiszu/AppNav";
import { SavingsGoal } from "@/components/fiszu/SavingsGoal";
import { SaveMoneyHub } from "@/components/fiszu/SaveMoneyHub";
import { SavingsOpportunities } from "@/components/fiszu/SavingsOpportunities";

export const Route = createFileRoute("/cele")({
  head: () => ({
    meta: [
      { title: "Cele oszczędnościowe — FISZU" },
      { name: "description", content: "Śledź swoje cele oszczędnościowe i odkrywaj możliwości oszczędzania." },
    ],
  }),
  component: CelePage,
});

function CelePage() {
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
            <PiggyBank className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Oszczędzanie</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Twoje <span className="text-gradient-brand">cele</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Śledź postęp w realizacji celów oszczędnościowych i odkrywaj nowe możliwości oszczędzania.
          </p>
        </motion.div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <SavingsGoal />
          </div>
          <div className="lg:col-span-2">
            <SaveMoneyHub />
          </div>
        </section>

        <section className="mt-6">
          <SavingsOpportunities />
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 FISZU · Twoja przystań finansowa
        </footer>
      </main>
    </div>
  );
}
