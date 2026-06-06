import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { AppNav } from "@/components/fiszu/AppNav";
import { TransactionsPanel } from "@/components/fiszu/TransactionsPanel";
import { InsightsSection } from "@/components/fiszu/InsightsSection";

export const Route = createFileRoute("/transakcje")({
  head: () => ({
    meta: [
      { title: "Transakcje — FISZU" },
      { name: "description", content: "Historia Twoich transakcji finansowych." },
    ],
  }),
  component: TransakcjePage,
});

function TransakcjePage() {
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
            <Receipt className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Historia</span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Twoje <span className="text-gradient-brand">transakcje</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pełna historia wpływów i wydatków. Filtruj, szukaj i zarządzaj każdą transakcją.
          </p>
        </motion.div>

        <section className="mb-6">
          <InsightsSection />
        </section>

        <section>
          <TransactionsPanel />
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 FISZU · Twoja przystań finansowa
        </footer>
      </main>
    </div>
  );
}
