import { motion } from "framer-motion";

export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        whileHover={{ rotate: -4, scale: 1.05 }}
        className="relative"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 rounded-2xl blur-md opacity-60"
          style={{ background: "var(--gradient-brand)" }}
          aria-hidden
        />
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className="relative"
          aria-label="FISZU logo"
        >
          <defs>
            <linearGradient id="fiszu-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.85 0.18 165)" />
              <stop offset="100%" stopColor="oklch(0.7 0.16 220)" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#fiszu-grad)" />
          {/* fish body */}
          <path
            d="M14 34 C 22 22, 38 22, 46 30 L 54 24 L 52 34 L 54 44 L 46 38 C 38 46, 22 46, 14 34 Z"
            fill="oklch(0.18 0.04 230)"
            opacity="0.95"
          />
          {/* trend line through */}
          <motion.path
            d="M14 40 L 24 34 L 32 38 L 42 28 L 50 24"
            fill="none"
            stroke="oklch(0.97 0.02 200)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          />
          <circle cx="42" cy="32" r="1.8" fill="oklch(0.85 0.18 165)" />
        </svg>
      </motion.div>
      {withText && (
        <span className="font-display text-xl font-bold tracking-tight text-gradient-brand">
          FISZU
        </span>
      )}
    </div>
  );
}
