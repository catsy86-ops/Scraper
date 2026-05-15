import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MESSAGES = [
  { clicks: 0, text: "Nie klikaj ⚠️" },
  { clicks: 1, text: "Prosiłem... 😒" },
  { clicks: 2, text: "Serio, nie klikaj." },
  { clicks: 3, text: "Fisz się denerwuje 😤" },
  { clicks: 4, text: "Mój kapelusz trzęsie się ze złości! 🎩💢" },
  { clicks: 5, text: "PRZESTAŃ KLIKAC" },
  { clicks: 6, text: "Dobrze... Fisz płacze. Zadowolony? 😭🐟" },
  { clicks: 7, text: "Ok, właśnie zepsułeś kupon BEER20. Brawo. 👏" },
  { clicks: 8, text: "Fisz dzwoni po ochronę 📞" },
  { clicks: 9, text: "Nikt nie przyjdzie. Jesteśmy sami w tym sklepie. 🫥" },
  { clicks: 10, text: "DOBRZE. WYGRAŁEŚ/AŚ. Fisz oddaje kapelusz. 🎩🐟" },
  { clicks: 11, text: "już nie ma czego klikać, idź po piwo" },
  { clicks: 15, text: "naprawdę nie masz co robić?" },
  { clicks: 20, text: "Fisz zrezygnował z bycia rybą. Został przyciskiem. 🔘" },
  { clicks: 30, text: "TAK, JESTEŚ NAJWIĘKSZYM KLIKACZEM W HISTORII. Gratulacje? 🏆" },
];

const DontClick = () => {
  const [clicks, setClicks] = useState(0);
  const [exploded, setExploded] = useState(false);

  const handleClick = () => {
    if (exploded) return;
    const next = clicks + 1;
    setClicks(next);

    const msg = MESSAGES.findLast((m) => m.clicks <= next) || MESSAGES[MESSAGES.length - 1];

    if (next === 5) {
      toast.error("FISZ SIĘ GOTUJE!", { description: "Mówiłem, nie klikaj..." });
    } else if (next === 10) {
      toast("🎩 Kapelusz spada... Fisz uznaje Twoją wyższość.", { duration: 5000 });
    } else if (next === 15) {
      toast("🐟💀 Fisz nie żyje. To Twoja wina.", { duration: 4000 });
    } else if (next === 25) {
      setExploded(true);
      toast("💥 PRZYCISK EKSPLODOWAŁ. Fisz odszedł w chmurze piany.", { duration: 8000 });
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!exploded ? (
        <motion.button
          key="dont-click"
          onClick={handleClick}
          whileHover={{ scale: [1, 1.1, 1.05] }}
          whileTap={{ scale: 0.9 }}
          className="pointer-events-auto px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 text-destructive/70 text-xs font-bold hover:bg-destructive/20 transition-colors"
        >
          {MESSAGES.findLast((m) => m.clicks <= clicks)?.text || MESSAGES[0].text}
        </motion.button>
      ) : (
        <motion.div
          key="exploded"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-auto"
        >
          <span className="text-[10px] text-muted-foreground/40 italic">
            💥 przycisk zniszczony. Fisz odszedł.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DontClick;
