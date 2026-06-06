import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  trigger: () => boolean;
  cooldown?: number;
}

const LS_ACHIEVEMENTS = "fisz_achievements";
const LS_LAST_CHECK = "fisz_ach_last_check";
const CHECK_INTERVAL = 10000;

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "pierwsze_piwo",
    title: "Pierwsze piwo w koszyku!",
    desc: "Fisz kiwa płetwą — zaczyna się przygoda!",
    icon: "🍺",
    trigger: () => {
      try { return !!localStorage.getItem("fisz_ach_cart_1"); } catch { return false; }
    },
  },
  {
    id: "nocny_marek",
    title: "Nocny Marek",
    desc: "Przeglądasz alkohol o 3 w nocy. Fisz rozumie.",
    icon: "🌙",
    trigger: () => {
      const h = new Date().getHours();
      return h >= 1 && h <= 4;
    },
  },
  {
    id: "klikacz",
    title: "Klikacz Fisza",
    desc: "Kliknąłeś logo 10 razy. Determinacja godna podziwu.",
    icon: "👆",
    trigger: () => {
      try { return parseInt(localStorage.getItem("fisz_secret_clicks") || "0", 10) >= 10; } catch { return false; }
    },
  },
  {
    id: "piec_zamowien",
    title: "Stały Gość",
    desc: "5 zamówień! Fisz zna już Twój adres na pamięć.",
    icon: "⭐",
    trigger: () => {
      try {
        const data = JSON.parse(localStorage.getItem("fisz_loyalty_stamps") || "{}");
        return (data.stamps || 0) >= 5;
      } catch { return false; }
    },
  },
  {
    id: "konami",
    title: "Haker Chmielu",
    desc: "Znalazłeś sekretny kod! Fisz jest pod wrażeniem.",
    icon: "🎮",
    trigger: () => false, // triggered manually via custom event
  },
  {
    id: "pusty_koszyk_5min",
    title: "Kontemplator Pustki",
    desc: "Od 5 minut patrzysz na pusty koszyk. Czas coś zamówić!",
    icon: "🤔",
    trigger: () => false, // triggered via cart watch
  },
  {
    id: "vip_fisza",
    title: "VIP Fisza",
    desc: "Dołączyłeś do elitarnego klubu Fisza!",
    icon: "👑",
    trigger: () => {
      try { return localStorage.getItem("fisz_vip") === "true"; } catch { return false; }
    },
  },
  {
    id: "piatek",
    title: "Piąteczek!",
    desc: "Jest piątek po 17. Fisz już otwiera browara.",
    icon: "🎉",
    trigger: () => {
      const d = new Date();
      return d.getDay() === 5 && d.getHours() >= 17;
    },
  },
];

const loadUnlocked = (): Set<string> => {
  try {
    const raw = localStorage.getItem(LS_ACHIEVEMENTS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveUnlocked = (s: Set<string>) => {
  try { localStorage.setItem(LS_ACHIEVEMENTS, JSON.stringify([...s])); } catch { /* noop */ }
};

// Global event-based trigger
export const triggerAchievement = (id: string) => {
  window.dispatchEvent(new CustomEvent("fisz-achievement", { detail: { id } }));
};

const AchievementPopup = ({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.8, rotate: -2 }}
    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
    exit={{ opacity: 0, y: -30, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="fixed bottom-24 right-6 z-50 pointer-events-auto"
  >
    <div className="relative glass-card rounded-2xl p-4 pr-8 border border-beer-gold/30 bg-beer-dark/95 shadow-[0_10px_60px_-10px_hsl(var(--beer-gold)/0.4)] max-w-[260px]">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="flex items-center gap-2 text-beer-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
        <Trophy className="h-3 w-3" />
        Achievement Unlocked!
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-3xl">{achievement.icon}</span>
        <p className="font-display text-sm font-bold text-beer-foam">{achievement.title}</p>
      </div>
      <p className="text-xs text-muted-foreground">{achievement.desc}</p>
    </div>
  </motion.div>
);

const AchievementSystem = () => {
  const [unlocked, setUnlocked] = useState<Set<string>>(() => loadUnlocked());
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  const checkAndUnlock = useCallback((ach: Achievement) => {
    if (unlocked.has(ach.id)) return;
    if (!ach.trigger()) return;
    const next = new Set(unlocked);
    next.add(ach.id);
    setUnlocked(next);
    saveUnlocked(next);
    setQueue((q) => [...q, ach]);
  }, [unlocked]);

  // Periodic check
  useEffect(() => {
    const interval = setInterval(() => {
      ACHIEVEMENTS.forEach(checkAndUnlock);
    }, CHECK_INTERVAL);
    // Fire once on mount
    setTimeout(() => ACHIEVEMENTS.forEach(checkAndUnlock), 2000);
    return () => clearInterval(interval);
  }, [checkAndUnlock]);

  // Listen for manual triggers
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent).detail;
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) checkAndUnlock(ach);
    };
    window.addEventListener("fisz-achievement", handler);
    return () => window.removeEventListener("fisz-achievement", handler);
  }, [checkAndUnlock]);

  // Process queue
  useEffect(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setCurrent(next);
    setQueue((q) => q.slice(1));
  }, [queue, current]);

  const handleClose = () => setCurrent(null);

  return (
    <AnimatePresence>
      {current && (
        <AchievementPopup key={current.id} achievement={current} onClose={handleClose} />
      )}
    </AnimatePresence>
  );
};

export default AchievementSystem;
