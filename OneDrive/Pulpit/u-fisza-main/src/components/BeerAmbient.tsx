import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const BUBBLE_COUNT = 18;
const HOP_COUNT = 6;

const BeerAmbient = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--mx", String(x));
      el.style.setProperty("--my", String(y));
    };
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating bubbles */}
      {Array.from({ length: BUBBLE_COUNT }).map((_, i) => {
        const size = 4 + Math.random() * 20;
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 20;
        const delay = Math.random() * 15;
        return (
          <motion.div
            key={`bubble-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              bottom: -size,
              background:
                Math.random() > 0.5
                  ? "radial-gradient(circle at 30% 30%, hsl(var(--beer-gold)/0.3), transparent)"
                  : "radial-gradient(circle at 30% 30%, hsl(var(--beer-foam)/0.15), transparent)",
              border: "1px solid hsl(var(--beer-gold)/0.1)",
            }}
            animate={{
              y: [0, -(400 + Math.random() * 600)],
              x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, 0],
              opacity: [0, 0.6, 0.3, 0],
              scale: [0.4, 1, 0.8, 0.2],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Floating hops 🌿 */}
      {Array.from({ length: HOP_COUNT }).map((_, i) => {
        const left = 5 + Math.random() * 90;
        const duration = 15 + Math.random() * 25;
        const delay = Math.random() * 20;
        return (
          <motion.div
            key={`hop-${i}`}
            className="absolute text-beer-hop/10 text-lg md:text-2xl select-none"
            style={{ left: `${left}%`, bottom: -30 }}
            animate={{
              y: [0, -300 - Math.random() * 400],
              x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60, 0],
              rotate: [0, 360, 720, 1080],
              opacity: [0, 0.4, 0.2, 0],
            }}
            transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
          >
            {Math.random() > 0.5 ? "🌿" : "🍺"}
          </motion.div>
        );
      })}

      {/* Mouse-following glow */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-beer-gold/3 blur-[120px]"
        animate={{
          x: [null, `${Math.random() * 100 - 50}`],
          y: [null, `${Math.random() * 100 - 50}`],
        }}
        style={{
          left: "calc(var(--mx, 0) * 100px + 50% - 12rem)",
          top: "calc(var(--my, 0) * 100px + 50% - 12rem)",
        }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
    </div>
  );
};

export default BeerAmbient;
