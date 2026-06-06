import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Fish, Calendar, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ZODIAK = [
  { sign: "Baran", emoji: "🐏", date: "21.03–19.04" },
  { sign: "Byk", emoji: "🐂", date: "20.04–20.05" },
  { sign: "Bliźnięta", emoji: "👯", date: "21.05–20.06" },
  { sign: "Rak", emoji: "🦞", date: "21.06–22.07" },
  { sign: "Lew", emoji: "🦁", date: "23.07–22.08" },
  { sign: "Panna", emoji: "🌾", date: "23.08–22.09" },
  { sign: "Waga", emoji: "⚖️", date: "23.09–22.10" },
  { sign: "Skorpion", emoji: "🦂", date: "23.10–21.11" },
  { sign: "Strzelec", emoji: "🏹", date: "22.11–21.12" },
  { sign: "Koziorożec", emoji: "🐐", date: "22.12–19.01" },
  { sign: "Wodnik", emoji: "🏺", date: "20.01–18.02" },
  { sign: "Ryby", emoji: "🐟", date: "19.02–20.03" },
];

const HOROSCOPES: Record<string, { beer: string; text: string }[]> = {
  "Baran": [{ beer: "Wiking Amber Ale", text: "Dziś rzucisz się w wir wydarzeń jak wiking na łódź. Po wszystkim — zimny amber i satysfakcja." }, { beer: "Bourbon Szeryf", text: "Twoja energia może dziś kogoś wystraszyć. Uspokój nerwy bourbonem." }],
  "Byk": [{ beer: "Złoty Fisz Lager", text: "Stabilność to Twoje drugie imię. Dziś trzymaj się klasyki — lager nigdy nie zawodzi." }, { beer: "Wino Kowboj", text: "Byki czasem potrzebują kopa. Wino kowbojskie załatwi sprawę." }],
  "Bliźnięta": [{ beer: "Hipster IPA", text: "Dwie osobowości — jedno piwo. IPA z charakterem podwójnego chmielenia dla Ciebie." }, { beer: "Zielony Tancerz", text: "Bliźnięta tańczą na dwóch imprezach naraz. Zielony Tancerz dotrzyma Ci kroku." }],
  "Rak": [{ beer: "Mroczny Stout Boarthu", text: "Schroniłeś się w skorupie — stout otuli Cię jak kocyk. Daj sobie dziś luz." }, { beer: "Wiśniówka Kawaii", text: "Raki mają miękkie serce. Słodka wiśniówka to Twój dzisiejszy kompan." }],
  "Lew": [{ beer: "Pszeniczny Siłacz", text: "Jesteś w centrum uwagi! Pszeniczniak doda Ci charyzmy na dzisiejszy wieczór." }, { beer: "Whisky Dżentelmen", text: "Lwy nie piją byle czego. Single malt z klasą — tak jak Ty." }],
  "Panna": [{ beer: "Kwaśny Cytrynek", text: "Perfekcjonizm męczy. Dziś odpuść i wypij kwaśnego sour ale. Zaufaj chaosowi." }, { beer: "Wino Kowboj", text: "Zorganizowana jak zawsze. Dziś — kieliszek wina i zrób sobie wolne." }],
  "Waga": [{ beer: "Złoty Fisz Lager", text: "Równowaga to Twój żywioł. Złoty lager — ani za mocny, ani za słaby. W punkt." }, { beer: "Wino Kowboj", text: "Dziś musisz podjąć decyzję. Wino pomoże. Albo nie. W sumie to nieważne." }],
  "Skorpion": [{ beer: "Mroczny Stout Boarthu", text: "Intensywny jak stout. Tajemniczy jak noc. Skorpion + stout = niebezpieczny duet." }, { beer: "Wódka Góralska", text: "Dziś tniesz prosto z mostu. Czysta wódka — bez litości, tak jak Ty." }],
  "Strzelec": [{ beer: "Wiking Amber Ale", text: "Przygoda czeka! Wiking w dłoni, mapa w kieszeni — dziś odkrywasz nowe smaki." }, { beer: "Zielony Tancerz", text: "Strzelce kochają podróże. Zielony Tancerz zabierze Cię w tango bez biletu." }],
  "Koziorożec": [{ beer: "Whisky Dżentelmen", text: "Pracowity jak mrówka — czas na nagrodę. Whisky single malt to Twój dzisiejszy bonus." }, { beer: "Bourbon Szeryf", text: "Koziorożce trzymają porządek. Bourbon Szeryf — oficjalne piwo władzy." }],
  "Wodnik": [{ beer: "Hipster IPA", text: "Innowacyjny i nieprzewidywalny. IPA z podwójnym chmielem — dokładnie jak Ty." }, { beer: "Zielony Tancerz", text: "Wodniki są z innej planety. Zielony Tancerz to jedyny trunek który Cię rozumie." }],
  "Ryby": [{ beer: "Kwaśny Cytrynek", text: "Fisz pozdrawia kolegę po fachu! Dziś unikaj IPA — chmiel będzie agresywny. Postaw na sour." }, { beer: "Mroczny Stout Boarthu", text: "Ryby czują więcej. Stout zrozumie Twoją duszę. Fisz ręczy płetwą." }],
};

const FishHoroscope = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [horoscopeIndex, setHoroscopeIndex] = useState(0);

  const randomSign = () => {
    const sign = ZODIAK[Math.floor(Math.random() * ZODIAK.length)];
    setSelectedSign(sign.sign);
    setHoroscopeIndex(Math.floor(Math.random() * (HOROSCOPES[sign.sign]?.length || 1)));
  };

  const horoscopes = selectedSign ? HOROSCOPES[selectedSign] : null;
  const current = horoscopes?.[horoscopeIndex % horoscopes.length];

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-beer-gold/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 max-w-xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-beer-gold/10 text-beer-gold text-xs font-bold px-4 py-2 rounded-full mb-4 border border-beer-gold/20 tracking-widest uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Rybi Horoskop
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            Co <span className="shimmer-text">Fisz</span> wróży Twojemu znakowi?
          </h2>
          <p className="text-muted-foreground text-sm">
            Wybierz znak zodiaku, a Fisz podpowie Ci dzisiejszy trunek 🐟🔮
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-6 border border-beer-gold/15"
        >
          {/* Sign grid */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {ZODIAK.map((z) => (
              <motion.button
                key={z.sign}
                onClick={() => {
                  setSelectedSign(z.sign);
                  setHoroscopeIndex(0);
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl text-center transition-all ${
                  selectedSign === z.sign
                    ? "bg-beer-gold/15 border border-beer-gold/30 shadow-[0_0_10px_hsl(var(--beer-gold)/0.1)]"
                    : "bg-muted/30 border border-border/20 hover:border-beer-gold/20 hover:bg-beer-gold/5"
                }`}
              >
                <div className="text-xl mb-0.5">{z.emoji}</div>
                <div className="text-[10px] font-semibold text-foreground/70">{z.sign}</div>
              </motion.button>
            ))}
          </div>

          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={randomSign}
              className="text-xs text-beer-gold/70 hover:text-beer-gold gap-1"
            >
              <Shuffle className="h-3 w-3" />
              Losuj znak
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={`${selectedSign}-${horoscopeIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-4 rounded-2xl bg-beer-gold/5 border border-beer-gold/10"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Fish className="h-4 w-4 text-beer-gold" />
                  <span className="font-display text-lg font-bold text-beer-gold">
                    {ZODIAK.find((z) => z.sign === selectedSign)?.emoji} {selectedSign}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {ZODIAK.find((z) => z.sign === selectedSign)?.date}
                  </span>
                </div>
                <p className="text-foreground font-semibold mb-1">
                  🍺 Fisz poleca: {current.beer}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {current.text}
                </p>
                {(horoscopes?.length || 0) > 1 && (
                  <button
                    onClick={() => setHoroscopeIndex((i) => i + 1)}
                    className="mt-3 text-[11px] text-beer-gold/60 hover:text-beer-gold font-semibold"
                  >
                    Pokaż alternatywną wróżbę →
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <Calendar className="h-10 w-10 text-beer-gold/25 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Wybierz swój znak, by poznać piwną przepowiednię
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default FishHoroscope;
