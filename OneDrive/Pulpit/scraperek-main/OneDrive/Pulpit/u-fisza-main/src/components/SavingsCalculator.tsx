import { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

const ABSURD_ALTERNATIVES: { name: string; price: number; unit: string; emoji: string }[] = [
  { name: "Mieszkanie w centrum Warszawy", price: 12000, unit: "miesięcznie", emoji: "🏢" },
  { name: "Karnet na siłownię", price: 120, unit: "miesięcznie", emoji: "💪" },
  { name: "Subskrypcja Netflix Premium", price: 60, unit: "miesięcznie", emoji: "📺" },
  { name: "Awokado (3 szt.)", price: 21, unit: "tygodniowo", emoji: "🥑" },
  { name: "Roczne studia", price: 8000, unit: "rok", emoji: "🎓" },
  { name: "500 kebabów", price: 7500, unit: "jednorazowo", emoji: "🥙" },
  { name: "Lamborghini... Hot Wheels", price: 12, unit: "jednorazowo", emoji: "🚗" },
  { name: "Pizza co piątek przez rok", price: 2080, unit: "rok", emoji: "🍕" },
  { name: "Konsola PlayStation 7 (jeszcze nie istnieje)", price: 3500, unit: "jednorazowo", emoji: "🎮" },
  { name: "Karma dla kota Fisza", price: 45, unit: "miesięcznie", emoji: "🐱" },
];

const SavingsCalculator = () => {
  const subtotal = useCartStore((s) => s.subtotal);

  const alternatives = useMemo(() => {
    if (subtotal() <= 0) return [];
    return ABSURD_ALTERNATIVES.filter((a) => a.price <= subtotal())
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);
  }, [subtotal()]);

  const total = subtotal();
  if (total <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-4 px-4"
    >
      <p className="text-beer-foam/40 text-[11px] italic mb-2">
        Gdybyś nie kupił tego piwa, miałbyś teraz...
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {alternatives.map((alt) => (
          <motion.div
            key={alt.name}
            whileHover={{ scale: 1.05 }}
            className="glass-card rounded-lg px-3 py-1.5 text-[10px] text-beer-foam/50 border border-beer-gold/10 flex items-center gap-1.5"
          >
            <span>{alt.emoji}</span>
            <span>{alt.name}</span>
            <ArrowRight className="h-2.5 w-2.5 text-beer-gold/40" />
            <span className="text-beer-gold font-semibold">{alt.price} zł</span>
          </motion.div>
        ))}
      </div>
      {alternatives.length === 0 && total > 0 && (
        <p className="text-beer-foam/30 text-[10px]">
          ...za mało na cokolwiek. Ale piwo zawsze się liczy! 🍺
        </p>
      )}
    </motion.div>
  );
};

export default SavingsCalculator;
