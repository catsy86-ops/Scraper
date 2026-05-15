import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, AlarmClock } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

interface CouponTimerProps {
  expiresAt: number;
  /** "inline" = compact pill for lists, "card" = full bar for active coupon. */
  variant?: "inline" | "card";
}

const formatRemaining = (ms: number) => {
  if (ms <= 0) return "wygasł";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, "0")}s`;
  return `${sec}s`;
};

export const CouponTimer = ({ expiresAt, variant = "inline" }: CouponTimerProps) => {
  const [now, setNow] = useState(() => Date.now());
  const validateCoupon = useCartStore((s) => s.validateCoupon);

  useEffect(() => {
    const remaining = expiresAt - Date.now();
    // Tick every second when under an hour, otherwise every minute.
    const interval = remaining < 60 * 60 * 1000 ? 1000 : 60 * 1000;
    const id = window.setInterval(() => {
      setNow(Date.now());
      // Re-validate so an expired active coupon gets dropped from cart.
      validateCoupon();
    }, interval);
    return () => window.clearInterval(id);
  }, [expiresAt, validateCoupon]);

  const remaining = expiresAt - now;
  const expired = remaining <= 0;
  const urgent = !expired && remaining < 60 * 60 * 1000; // < 1h
  const critical = !expired && remaining < 5 * 60 * 1000; // < 5m

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold tabular-nums ${
          expired
            ? "bg-destructive/15 text-destructive"
            : urgent
            ? "bg-destructive/10 text-destructive"
            : "bg-beer-amber/10 text-beer-amber"
        }`}
        title={expired ? "Kupon wygasł" : `Wygasa: ${new Date(expiresAt).toLocaleString("pl-PL")}`}
      >
        <Clock className="h-2.5 w-2.5" />
        {formatRemaining(remaining)}
      </span>
    );
  }

  return (
    <motion.div
      layout
      animate={critical ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={critical ? { duration: 1, repeat: Infinity } : undefined}
      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${
        expired
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : urgent
          ? "bg-destructive/5 border-destructive/20 text-destructive"
          : "bg-beer-amber/5 border-beer-amber/20 text-beer-amber"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <AlarmClock className="h-3.5 w-3.5" />
        {expired ? "Kupon wygasł" : "Kod ważny jeszcze"}
      </span>
      <span className="font-bold tabular-nums">{formatRemaining(remaining)}</span>
    </motion.div>
  );
};

export default CouponTimer;
