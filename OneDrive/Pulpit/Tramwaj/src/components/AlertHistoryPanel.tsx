import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Ban, Clock, Trash2, History, Bell } from "lucide-react";
import type { AlertHistoryEntry, AlertHistoryKind } from "@/hooks/use-alert-history";

interface Props {
  entries: AlertHistoryEntry[];
  onClear: () => void;
}

type Filter = "all" | AlertHistoryKind;

const FILTERS: { id: Filter; label: string; icon: typeof Bell }[] = [
  { id: "all", label: "Wszystko", icon: Bell },
  { id: "alert", label: "Alerty", icon: AlertTriangle },
  { id: "cancel", label: "Odwołania", icon: Ban },
  { id: "delay", label: "Opóźnienia", icon: Clock },
];

const kindStyles: Record<AlertHistoryKind, { icon: typeof Bell; bg: string; text: string; ring: string }> = {
  alert:  { icon: AlertTriangle, bg: "bg-amber-500/10",     text: "text-amber-700 dark:text-amber-400",     ring: "border-amber-500/30" },
  cancel: { icon: Ban,           bg: "bg-destructive/10",    text: "text-destructive",                       ring: "border-destructive/30" },
  delay:  { icon: Clock,         bg: "bg-orange-500/10",    text: "text-orange-700 dark:text-orange-400",   ring: "border-orange-500/30" },
};

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const AlertHistoryPanel = ({ entries, onClear }: Props) => {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => ({
    all: entries.length,
    alert: entries.filter((e) => e.kind === "alert").length,
    cancel: entries.filter((e) => e.kind === "cancel").length,
    delay: entries.filter((e) => e.kind === "delay").length,
  }), [entries]);

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.kind === filter)),
    [entries, filter],
  );

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <History size={18} className="text-muted-foreground" />
            <h2 className="font-heading font-bold text-lg text-foreground">Historia zdarzeń</h2>
            <span className="text-xs text-muted-foreground">({entries.length})</span>
          </div>
          <button
            onClick={onClear}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={12} /> Wyczyść
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                }`}
              >
                <Icon size={12} /> {label}
                <span className={`ml-0.5 ${active ? "opacity-90" : "opacity-60"}`}>{counts[id]}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {entries.length === 0
                ? "Brak zdarzeń. Historia zaczyna się od momentu otwarcia tej linii."
                : "Brak zdarzeń pasujących do filtra."}
            </p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {filtered.map((e) => {
                  const s = kindStyles[e.kind];
                  const Icon = s.icon;
                  return (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex gap-3 p-3 rounded-lg border ${s.ring} ${s.bg}`}
                    >
                      <Icon size={16} className={`${s.text} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{fmtTime(e.ts)}</span>
                        </div>
                        {e.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{e.description}</p>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default AlertHistoryPanel;
