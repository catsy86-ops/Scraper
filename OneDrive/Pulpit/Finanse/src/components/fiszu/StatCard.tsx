import { motion } from "framer-motion";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: number; // percent
  icon: LucideIcon;
  accent?: "primary" | "accent" | "warning" | "destructive";
  index?: number;
}

const accentMap = {
  primary: "from-[oklch(0.78_0.17_165)] to-[oklch(0.72_0.15_200)]",
  accent: "from-[oklch(0.72_0.15_200)] to-[oklch(0.7_0.18_280)]",
  warning: "from-[oklch(0.82_0.15_75)] to-[oklch(0.78_0.17_45)]",
  destructive: "from-[oklch(0.65_0.22_22)] to-[oklch(0.7_0.2_350)]",
};

// Extract numeric value from formatted PLN string for animation
function parseNumeric(formatted: string): number {
  return parseFloat(formatted.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
}

function AnimatedValue({ value }: { value: string }) {
  const numeric = parseNumeric(value);
  const motionVal = useMotionValue(numeric);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 });
  // We just re-render the formatted string directly — spring is for future use
  // For simplicity, animate opacity+y on value change
  return (
    <motion.p
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mt-2 font-display text-2xl font-bold text-foreground"
    >
      {value}
    </motion.p>
  );
}

export function StatCard({ label, value, delta, icon: Icon, accent = "primary", index = 0 }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      className="glass-card relative overflow-hidden p-5"
    >
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accentMap[accent]} opacity-20 blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <AnimatedValue value={value} />
          {delta !== undefined && delta !== 0 && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {positive ? "+" : ""}{delta.toFixed(1)}%
              <span className="text-muted-foreground">vs poprzedni miesiąc</span>
            </div>
          )}
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${accentMap[accent]} p-2.5 shadow-glow`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </motion.div>
  );
}
