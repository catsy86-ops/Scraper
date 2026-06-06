import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, RotateCcw, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { useSettingsVersions, pickRestorable, deleteVersion, type SettingsVersion } from "@/hooks/useSettingsVersions";
import type { UserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

type Props = {
  userId: string | undefined;
  onRestore: (patch: Partial<UserSettings>) => Promise<void> | void;
  refreshKey: number;
};

const RULE_LABELS: Record<string, string> = {
  nearest1: "do 1 zł",
  nearest2: "do 2 zł",
  nearest5: "do 5 zł",
  nearest10: "do 10 zł",
};

function describe(s: Partial<UserSettings>) {
  const parts: string[] = [];
  if (s.auto_save_percent !== undefined) parts.push(`Auto-Sejf ${s.auto_save_percent}%`);
  if (s.roundup_rule) parts.push(`Round-Up ${RULE_LABELS[s.roundup_rule] ?? s.roundup_rule}`);
  if (s.roundup_multiplier && s.roundup_multiplier > 1) parts.push(`×${s.roundup_multiplier}`);
  if (s.advanced_mode) parts.push("tryb zaawans.");
  return parts.join(" • ") || "Migawka ustawień";
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "przed chwilą";
  if (m < 60) return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz. temu`;
  const days = Math.floor(h / 24);
  return `${days} dni temu`;
}

export function VersionHistory({ userId, onRestore, refreshKey }: Props) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { versions, loading, reload } = useSettingsVersions(userId, refreshKey);

  if (!userId) return null;

  const handleRestore = async (v: SettingsVersion) => {
    setBusyId(v.id);
    try {
      await onRestore(pickRestorable(v.snapshot));
      toast.success("Przywrócono wersję");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (v: SettingsVersion) => {
    setBusyId(v.id);
    const ok = await deleteVersion(v.id);
    setBusyId(null);
    if (ok) {
      toast.success("Wersja usunięta");
      reload();
    }
  };

  return (
    <div className="glass-card p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold">Historia wersji</h3>
          <span className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {versions.length}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Każda zmiana suwaków zapisuje migawkę. Cofnij się jednym kliknięciem
              do dowolnej z 20 ostatnich wersji.
            </p>

            <div className="mt-3 space-y-2">
              {loading && versions.length === 0 && (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Wczytywanie…
                </div>
              )}

              {!loading && versions.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-3 py-4 text-center text-xs text-muted-foreground">
                  Brak zapisanych wersji. Zmień dowolne ustawienie, aby utworzyć pierwszą.
                </div>
              )}

              {versions.map((v, idx) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group relative rounded-lg border border-border bg-secondary/30 p-2.5 transition hover:border-primary/40 hover:bg-secondary/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xs font-semibold">
                        {describe(v.snapshot)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {timeAgo(v.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleRestore(v)}
                        disabled={busyId === v.id}
                        className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                        title="Przywróć tę wersję"
                      >
                        {busyId === v.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        Cofnij
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        disabled={busyId === v.id}
                        className="rounded-md border border-border p-1 text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                        title="Usuń wersję"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
