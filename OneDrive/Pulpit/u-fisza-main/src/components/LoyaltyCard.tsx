import { motion } from "framer-motion";
import { Fish, Star, Crown, Award } from "lucide-react";
import { getLoyaltyData, getNextMilestone, MILESTONES } from "@/stores/loyaltyStore";
import { useEffect, useState } from "react";

const LoyaltyCard = () => {
  const [data, setData] = useState(getLoyaltyData);
  const next = getNextMilestone();

  useEffect(() => {
    const handler = () => setData(getLoyaltyData());
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, []);

  if (data.stamps === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card rounded-2xl p-6 border border-beer-gold/15"
      >
        <div className="text-center">
          <Fish className="h-12 w-12 text-beer-gold/40 mx-auto mb-3" />
          <p className="text-beer-foam/60 font-display text-lg font-bold mb-1">
            Jeszcze żadnej pieczątki
          </p>
          <p className="text-beer-foam/40 text-xs">
            Złóż pierwsze zamówienie, a Fisz odbije tu swoją płetwę! 🐟
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-6 border border-beer-gold/20"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-beer-gold/10">
          <Award className="h-5 w-5 text-beer-gold" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-beer-foam">
            Karta Stałego Klienta Fisza
          </h3>
          <p className="text-beer-foam/40 text-xs">
            {data.stamps} / {next.stamps} do następnej nagrody
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-beer-gold to-beer-amber"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (data.stamps / next.stamps) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stamp grid */}
      <div className="grid grid-cols-7 gap-2 mb-5">
        {MILESTONES.slice(0, 7).map((m, i) => {
          const earned = data.stamps >= m.stamps;
          return (
            <motion.div
              key={m.stamps}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`aspect-square rounded-xl flex items-center justify-center text-xl ${
                earned
                  ? "bg-beer-gold/15 border border-beer-gold/30 shadow-[0_0_10px_hsl(var(--beer-gold)/0.15)]"
                  : "bg-muted/30 border border-border/20 grayscale opacity-40"
              }`}
              title={earned ? `Zdobyta: ${m.title}` : `Do zdobycia: ${m.title} (${m.stamps} zamówień)`}
            >
              {earned ? <span>{m.emoji}</span> : <span className="text-muted-foreground/30 text-xs">{m.stamps}</span>}
            </motion.div>
          );
        })}
      </div>

      {/* Earned badges */}
      {data.earnedBadges.length > 0 && (
        <div className="space-y-2">
          <p className="text-beer-foam/50 text-xs font-semibold uppercase tracking-wider">
            Zdobyte odznaki:
          </p>
          {data.earnedBadges.slice(-3).map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 p-2 rounded-lg bg-beer-gold/5 border border-beer-gold/10"
            >
              <Crown className="h-3.5 w-3.5 text-beer-gold flex-shrink-0" />
              <span className="text-beer-foam/80 text-xs">{badge}</span>
              <Star className="h-3 w-3 text-beer-gold/60 ml-auto" />
            </div>
          ))}
        </div>
      )}

      {/* Next milestone hint */}
      {next && data.stamps < next.stamps && (
        <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/20">
          <p className="text-beer-foam/50 text-xs text-center">
            {next.emoji} Jeszcze <strong className="text-beer-gold">{next.stamps - data.stamps}</strong> zamówienia do: <strong>{next.title}</strong>
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default LoyaltyCard;
