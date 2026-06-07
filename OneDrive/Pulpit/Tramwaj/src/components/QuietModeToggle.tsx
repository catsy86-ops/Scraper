import { useEffect, useState } from "react";
import { Bell, BellOff, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuietModeToggleProps {
  muted: boolean;
  until: number; // epoch ms or Infinity
  onToggle: () => void;
  onMuteFor: (ms: number | "forever") => void;
  onUnmute: () => void;
}

const PRESETS: { label: string; value: number | "forever" }[] = [
  { label: "15 minut", value: 15 * 60_000 },
  { label: "1 godzina", value: 60 * 60_000 },
  { label: "4 godziny", value: 4 * 60 * 60_000 },
  { label: "Bezterminowo", value: "forever" },
];

const QuietModeToggle = ({ muted, until, onToggle, onMuteFor, onUnmute }: QuietModeToggleProps) => {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  // tick every 30s while muted to refresh remaining time
  useEffect(() => {
    if (!muted || until === Infinity) return;
    const i = setInterval(() => force((x) => x + 1), 30_000);
    return () => clearInterval(i);
  }, [muted, until]);

  const remaining = (() => {
    if (!muted) return null;
    if (until === Infinity) return "bezterminowo";
    const ms = until - Date.now();
    if (ms <= 0) return null;
    const min = Math.round(ms / 60_000);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  })();

  return (
    <div className="relative">
      <div className="inline-flex items-center rounded-lg overflow-hidden border border-border">
        <button
          onClick={() => (muted ? onUnmute() : onToggle())}
          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 transition-colors ${
            muted
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          title={muted ? "Wyłącz tryb cichy" : "Wycisz powiadomienia dla tej linii"}
        >
          {muted ? <BellOff size={12} /> : <Bell size={12} />}
          <span>{muted ? `Cisza · ${remaining}` : "Tryb cichy"}</span>
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-1.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l border-border"
          aria-label="Wybierz czas wyciszenia"
          title="Wybierz czas wyciszenia"
        >
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 mt-1.5 z-50 min-w-[180px] rounded-lg border border-border bg-popover shadow-lg p-1"
            >
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                Wycisz na…
              </div>
              {PRESETS.map((p) => (
                <button
                  key={String(p.value)}
                  onClick={() => {
                    onMuteFor(p.value);
                    setOpen(false);
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted/70 transition-colors"
                >
                  {p.label}
                </button>
              ))}
              {muted && (
                <>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => {
                      onUnmute();
                      setOpen(false);
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded text-primary hover:bg-primary/10 transition-colors"
                  >
                    Włącz powiadomienia
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuietModeToggle;
