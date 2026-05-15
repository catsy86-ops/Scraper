import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, X, Play, Pause, SkipForward, Music } from "lucide-react";

const SHOWS = [
  { name: "Piankowe Przeboje", desc: "Top 10 najbardziej spienionych kawałków", icon: "🍺" },
  { name: "Chmielowe Porady", desc: "Jak nie wylać piwa na klawiaturę", icon: "🌿" },
  { name: "Lista Przebojów Kufla", desc: "Notowanie 100 najlepszych kufli", icon: "🏆" },
  { name: "Bąbelkowy Chill", desc: "Muzyka do sączenia stouta", icon: "🫧" },
  { name: "Rock & Hop", desc: "Mocne riffy, mocne IPA", icon: "🎸" },
  { name: "Disco Polo nad Stawem", desc: "Fisz tańczy do disco polo", icon: "🕺" },
  { name: "Fisz Czyta Wiersze", desc: "Poezja rybna w interpretacji Fisza", icon: "📜" },
  { name: "Nocna Zmiana", desc: "Dla tych, co piją po 22:00", icon: "🌙" },
];

const FAKE_FREQUENCY = "107.5 FM";

const FiszRadio = () => {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentShow, setCurrentShow] = useState(SHOWS[0]);
  const [progress, setProgress] = useState(0);
  const [staticNoise, setStaticNoise] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      progRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            const next = SHOWS[(SHOWS.indexOf(currentShow) + 1) % SHOWS.length];
            setCurrentShow(next);
            return 0;
          }
          return p + 0.3;
        });
      }, 200);
      intervalRef.current = setInterval(() => {
        const noises = ["...trzask...", "...szum...", "...pianka...", "...chmiel...", "...bulgot..."];
        setStaticNoise(noises[Math.floor(Math.random() * noises.length)]);
      }, 4000);
    } else {
      if (progRef.current) clearInterval(progRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStaticNoise("");
      setProgress(0);
    }
    return () => {
      if (progRef.current) clearInterval(progRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  const nextShow = () => {
    setCurrentShow(SHOPS[(SHOPS.indexOf(currentShow) + 1) % SHOPS.length]);
    setProgress(0);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto glass-card rounded-2xl p-4 w-[240px] border border-beer-gold/20 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-beer-gold" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-beer-gold uppercase">
                  Fisz FM
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-mono">{FAKE_FREQUENCY}</span>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Fake radio display */}
            <div className="bg-muted/40 rounded-xl p-3 mb-3 border border-border/20">
              <div className="flex items-center gap-2 mb-1">
                <Music className="h-3 w-3 text-beer-amber" />
                <span className="text-[10px] text-beer-amber font-semibold uppercase tracking-wider">
                  Teraz gramy:
                </span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {currentShow.icon} {currentShow.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {currentShow.desc}
              </p>
              {playing && staticNoise && (
                <p className="text-[9px] text-muted-foreground/50 italic mt-1 animate-pulse">
                  {staticNoise}
                </p>
              )}
            </div>

            {/* Progress bar */}
            {playing && (
              <div className="h-1 rounded-full bg-muted/50 mb-3 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-beer-gold"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPlaying(!playing)}
                className="p-2 rounded-full bg-beer-gold/10 hover:bg-beer-gold/20 text-beer-gold transition-colors"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={nextShow}
                className="p-2 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="pointer-events-auto relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-beer-hop to-beer-gold text-beer-dark shadow-xl border-2 border-beer-foam/30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={playing ? { boxShadow: ["0 0 0px hsl(var(--beer-gold)/0)", "0 0 20px hsl(var(--beer-gold)/0.4)", "0 0 0px hsl(var(--beer-gold)/0)"] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Radio className="h-5 w-5" />
        {playing && (
          <motion.span
            className="absolute -top-1 -right-1 flex h-3 w-3"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-beer-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-beer-gold" />
          </motion.span>
        )}
      </motion.button>
    </div>
  );
};

export default FiszRadio;
