import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fish } from "lucide-react";

const STATUSES = [
  { text: "Fisz właśnie pakuje zamówienie 📦", icon: "📦" },
  { text: "Fisz przeciera kufle i nuci szlagier 🎵", icon: "🎵" },
  { text: "Fisz sprawdza świeżość chmielu 🌿", icon: "🌿" },
  { text: "Fisz ogląda mecz i komentuje sędziego ⚽", icon: "⚽" },
  { text: "Fisz debatuje z kuflem o sensie życia 🧐", icon: "🧐" },
  { text: "Fisz testuje nową dostawę (mówi, że tylko kontrolnie) 🍻", icon: "🍻" },
  { text: "Fisz dzwoni po kuriera — Twoja paczka idzie! 🚚", icon: "🚚" },
  { text: "Fisz układa piramidę z kapsli 🏗️", icon: "🏗️" },
  { text: "Fisz szuka kapelusza (znowu go gdzieś zostawił) 🎩", icon: "🎩" },
  { text: "Fisz pisze wiersz o pianie — będzie bestseller 📜", icon: "📜" },
  { text: "Fisz śpi (jest środek nocy, dajcie mu spokój) 😴", icon: "😴" },
  { text: "Fisz ćwiczy taniec na sobotnią imprezę 💃", icon: "💃" },
  { text: "Fisz negocjuje z dostawcą chmielu (twarda ryba) 💪", icon: "💪" },
  { text: "Fisz wymyśla nowy kod rabatowy 🔐", icon: "🔐" },
  { text: "Fisz karmi kaczki w stawie za sklepem 🦆", icon: "🦆" },
  { text: "Fisz medytuje nad bąbelkami w stoutcie 🧘", icon: "🧘" },
];

const FiszStatus = () => {
  const [status, setStatus] = useState(STATUSES[0]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      setStatus(next);
      setKey((k) => k + 1);
    }, 15000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 right-4 z-30 hidden xl:block"
      >
        <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-beer-foam/70 border border-beer-gold/10 shadow-lg max-w-[300px]">
          <Fish className="h-3.5 w-3.5 text-beer-gold flex-shrink-0" />
          <span>{status.icon} {status.text}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FiszStatus;
