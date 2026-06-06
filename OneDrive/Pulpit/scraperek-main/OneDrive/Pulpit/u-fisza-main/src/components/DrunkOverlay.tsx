import { motion, AnimatePresence } from "framer-motion";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const DRUNK_WISDOMS = [
  "Za dużo! Za dużo! 🐟💥",
  "FISZ TRACI KAPELUSZ! 🎩🌀",
  "Kto wpisał ten kod?! Chmiel przejmuje kontrolę! 🌿🤪",
  "Tryb pijanego ekranu aktywowany! 🍻😵",
  "Piana zalała serwer! 💻🍺",
  "Fisz: To nie ja, to mój brat bliźniak! 🐟🐟",
];

const DrunkOverlay = () => {
  const [wisdom, setWisdom] = useState("");
  const { showDrunk } = useKonamiCode(() => {
    const w = DRUNK_WISDOMS[Math.floor(Math.random() * DRUNK_WISDOMS.length)];
    setWisdom(w);
    toast(w, {
      description: "Tryb pijanego ekranu — za 6 sekund wracamy do normy 🍻",
      duration: 6000,
    });
  });

  return (
    <AnimatePresence>
      {showDrunk && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] pointer-events-none"
        >
          {/* Blur and color shift overlay */}
          <motion.div
            className="absolute inset-0 backdrop-blur-[3px]"
            animate={{
              filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(180deg)", "hue-rotate(270deg)", "hue-rotate(360deg)"],
            }}
            transition={{ duration: 6, ease: "linear" }}
          />

          {/* Wobble layer */}
          <motion.div
            className="absolute inset-0"
            animate={{
              rotate: [1, -2, 1.5, -1, 0.5, 0],
              scale: [1, 1.02, 0.98, 1.01, 1],
            }}
            transition={{ duration: 6, ease: "easeInOut" }}
          />

          {/* Floating emojis */}
          {["🐟", "🍺", "🎩", "🌿", "💥", "🤪", "🍻", "😵"].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl md:text-5xl"
              style={{
                left: `${Math.random() * 85 + 5}%`,
                top: `${Math.random() * 80 + 10}%`,
              }}
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.5, 2, 0.3],
                rotate: [0, 180, 360, 540],
                y: [0, -100, -200, -300],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            >
              {emoji}
            </motion.div>
          ))}

          {/* Center text */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            animate={{
              rotate: [-3, 3, -2, 2, 0],
              scale: [1, 1.1, 0.95, 1.05, 1],
            }}
            transition={{ duration: 6, ease: "easeInOut" }}
          >
            <p className="text-beer-gold text-2xl md:text-4xl font-display font-black drop-shadow-[0_0_30px_hsl(var(--beer-gold)/0.6)]">
              {wisdom || DRUNK_WISDOMS[0]}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DrunkOverlay;
