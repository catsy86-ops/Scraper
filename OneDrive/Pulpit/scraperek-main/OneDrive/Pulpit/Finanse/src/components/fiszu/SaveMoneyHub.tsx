import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Zap, Trophy, Sparkles, ArrowUpRight, Check, Loader2, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { recentTransactions, formatPLN } from "@/lib/finance-data";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useState } from "react";

type Tab = "roundup" | "auto" | "challenges";

const challenges = [
  { id: "c1", title: "Tydzień bez kawy na mieście", reward: 84, total: 7, emoji: "☕" },
  { id: "c2", title: "Zero zakupów impulsowych", reward: 220, total: 30, emoji: "🛍️" },
  { id: "c3", title: "Gotuj w domu 5x w tygodniu", reward: 180, total: 5, emoji: "🍳" },
  { id: "c4", title: "Wyzwanie 1% — odłóż 1% każdego wpływu", reward: 95, total: 4, emoji: "💎" },
];

export function SaveMoneyHub() {
  const [tab, setTab] = useState<Tab>("roundup");
  const { user } = useAuth();
  const { settings, update, loading, saving } = useUserSettings(user?.id);
  const { transactions } = useTransactions(user?.id);

  const roundups = useMemo(() => {
    // Używamy prawdziwych transakcji użytkownika jeśli dostępne, inaczej demo
    const source = user && transactions.length > 0
      ? transactions
          .filter((t) => Number(t.amount) < 0)
          .map((t) => ({ id: t.id, title: t.title, amount: Number(t.amount) }))
      : recentTransactions
          .filter((t) => t.amount < 0)
          .map((t) => ({ id: t.id, title: t.title, amount: t.amount }));

    return source
      .map((t) => {
        const abs = Math.abs(t.amount);
        const up = Math.ceil(abs) - abs;
        return { id: t.id, title: t.title, amount: abs, roundup: +up.toFixed(2) };
      })
      .filter((r) => r.roundup > 0);
  }, [user, transactions]);
  const roundupTotal = roundups.reduce((s, r) => s + r.roundup, 0);
  const monthlyEstimate = roundupTotal * 12;

  const autoMonthly = settings.auto_save_enabled ? (settings.sim_income * settings.auto_save_percent) / 100 : 0;
  const autoYear = autoMonthly * 12;

  const toggleChallenge = (id: string) => {
    const set = new Set(settings.enabled_challenges);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update({ enabled_challenges: Array.from(set) });
  };

  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 -top-24 h-48 bg-[var(--gradient-glow)]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/15 p-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold">Centrum oszczędzania</h3>
          </div>
          <div className="flex items-center gap-2">
            {user && saving && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Zapisuję…
              </span>
            )}
            {user && !saving && !loading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-success">
                <Check className="h-3 w-3" /> Zapisano
              </span>
            )}
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Nowość
            </span>
          </div>
        </div>

        {!user && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-xs text-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Zaloguj się, aby zapisywać preferencje
            </span>
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Zaloguj
            </Link>
          </div>
        )}

        <div className="mb-4 inline-flex rounded-xl border border-border bg-secondary/40 p-1">
          {[
            { id: "roundup" as Tab, label: "Zaokrąglanie", icon: Coins },
            { id: "auto" as Tab, label: "Auto-Sejf", icon: Zap },
            { id: "challenges" as Tab, label: "Wyzwania", icon: Trophy },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="save-tab"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="absolute inset-0 -z-0 rounded-lg"
                    style={{ background: "var(--gradient-brand)" }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab === "roundup" && (
            <motion.div key="roundup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Z tego tygodnia</p>
                  <p className="mt-1 font-display text-2xl font-bold text-gradient-brand">{formatPLN(roundupTotal)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">z {roundups.length} transakcji</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Prognoza roczna</p>
                  <p className="mt-1 font-display text-2xl font-bold">{formatPLN(monthlyEstimate)}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-success">
                    <ArrowUpRight className="h-3 w-3" /> bez wysiłku
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {roundups.slice(0, 4).map((r, i) => (
                  <motion.li key={r.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                    <span className="text-foreground/90">{r.title}</span>
                    <span className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{formatPLN(r.amount)}</span>
                      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 font-semibold text-primary">+{formatPLN(r.roundup)}</span>
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {tab === "auto" && (
            <motion.div key="auto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <p className="text-sm font-medium">Auto-odkładanie z każdego wpływu</p>
                  <p className="text-xs text-muted-foreground">Zasada „zapłać sobie najpierw”</p>
                </div>
                <button
                  onClick={() => user && update({ auto_save_enabled: !settings.auto_save_enabled })}
                  disabled={!user || loading}
                  className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${settings.auto_save_enabled ? "bg-primary" : "bg-secondary"}`}
                  aria-label="toggle"
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${settings.auto_save_enabled ? "right-0.5" : "left-0.5"}`}
                  />
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-end justify-between">
                  <span className="text-xs text-muted-foreground">Procent wpływu</span>
                  <span className="font-display text-2xl font-bold text-gradient-brand">{settings.auto_save_percent}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={settings.auto_save_percent}
                  onChange={(e) => update({ auto_save_percent: +e.target.value })}
                  disabled={!user || loading}
                  className="mt-2 w-full accent-[oklch(0.78_0.17_165)] disabled:opacity-50"
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-secondary/30 p-3">
                    <p className="text-[11px] text-muted-foreground">Miesięcznie</p>
                    <motion.p key={autoMonthly} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl font-bold">
                      {formatPLN(autoMonthly)}
                    </motion.p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/30 p-3">
                    <p className="text-[11px] text-muted-foreground">Rocznie</p>
                    <motion.p key={autoYear} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-display text-xl font-bold text-gradient-brand">
                      {formatPLN(autoYear)}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "challenges" && (
            <motion.div key="challenges" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-2.5">
              {challenges.map((c, i) => {
                const enabled = settings.enabled_challenges.includes(c.id);
                return (
                  <motion.button
                    type="button"
                    key={c.id}
                    onClick={() => user && toggleChallenge(c.id)}
                    disabled={!user || loading}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`block w-full rounded-xl border p-3 text-left transition disabled:opacity-50 ${
                      enabled ? "border-primary/60 bg-primary/10" : "border-border bg-secondary/30 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none">{c.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {enabled ? "Aktywne" : "Kliknij, aby aktywować"} · {c.total} dni
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
                          enabled ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                        }`}
                      >
                        {enabled ? <Check className="h-3.5 w-3.5" /> : `+${formatPLN(c.reward)}`}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
