import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Beer, Minus, Plus, Fish } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";

interface Drink {
  name: string;
  abv: number;
  volumeMl: number;
  emoji: string;
}

const PRESET_DRINKS: Drink[] = [
  { name: "Piwo (duże)", abv: 5, volumeMl: 500, emoji: "🍺" },
  { name: "Piwo (małe)", abv: 5, volumeMl: 330, emoji: "🍻" },
  { name: "Piwo kraftowe", abv: 7, volumeMl: 500, emoji: "🍻" },
  { name: "Wino czerwone", abv: 13, volumeMl: 150, emoji: "🍷" },
  { name: "Wódka (50ml)", abv: 40, volumeMl: 50, emoji: "🥃" },
  { name: "Whisky (50ml)", abv: 40, volumeMl: 50, emoji: "🥃" },
  { name: "Likier", abv: 18, volumeMl: 50, emoji: "🍸" },
  { name: "Shot", abv: 40, volumeMl: 25, emoji: "🥃" },
];

const ALCOHOL_DENSITY = 0.789; // g/ml

const calcBAC = (drinks: { abv: number; volumeMl: number; count: number }[], weightKg: number): number => {
  if (weightKg <= 0) return 0;
  let totalGrams = 0;
  for (const d of drinks) {
    totalGrams += d.abv / 100 * d.volumeMl * ALCOHOL_DENSITY * d.count;
  }
  const w = weightKg * 0.68; // male factor, approximate
  return +(totalGrams / w * 10).toFixed(2);
};

const getFiszVerdict = (bac: number): { title: string; desc: string; emoji: string; color: string } => {
  if (bac === 0) return { title: "Trzeźwy jak ryba", desc: "Fisz pokazuje płetwę w górę — jesteś wzorem cnót!", emoji: "🐟👍", color: "text-green-400" };
  if (bac < 0.2) return { title: "Lekko na fali", desc: "Fisz mruga okiem — piwko w normie, możesz jeszcze pisać SMS-y do mamy.", emoji: "😌🍺", color: "text-green-300" };
  if (bac < 0.5) return { title: "Fisz mruga znacząco", desc: "Jesteś rozluźniony. Może nie pisz SMS-ów do byłej, ale rozmowa z kotem wciąż akceptowalna.", emoji: "😏🐟", color: "text-yellow-400" };
  if (bac < 0.8) return { title: "Kapelusz Fisza lekko krzywo", desc: "Lepiej nie tańcz. Lepiej nie śpiewaj. Lepiej zamów taksówkę. Fisz zdejmuje kapelusz z troski.", emoji: "🎩⚠️", color: "text-orange-400" };
  if (bac < 1.5) return { title: "Fisz leży pod barem", desc: "Zdecydowanie NIE prowadź. Nie dzwoń do nikogo. Połóż się i przytul poduszkę. Fisz już śpi.", emoji: "🐟💤", color: "text-red-400" };
  if (bac < 2.5) return { title: "Fisz NIE ŻYJE (prawie)", desc: "Kapelusz spadł za ladę. Płetwy w górze. Wezwij pomoc — dla siebie i dla Fisza.", emoji: "💀🎩", color: "text-red-500" };
  return { title: "Fisz poszedł po papierosy i nie wrócił", desc: "Ten poziom to już nie jest alkomat, tylko archeologia. Wezwij karetkę. Serio.", emoji: "⚰️🐟", color: "text-red-600" };
};

const AlkomatPage = () => {
  const [weight, setWeight] = useState(75);
  const [counts, setCounts] = useState<number[]>(PRESET_DRINKS.map(() => 0));

  const bac = useMemo(() => {
    const drinks = PRESET_DRINKS.map((d, i) => ({ ...d, count: counts[i] }));
    return calcBAC(drinks, weight);
  }, [counts, weight]);

  const verdict = useMemo(() => getFiszVerdict(bac), [bac]);

  const add = (i: number) => setCounts((prev) => prev.map((c, j) => (j === i ? c + 1 : c)));
  const remove = (i: number) => setCounts((prev) => prev.map((c, j) => (j === i && c > 0 ? c - 1 : c)));
  const reset = () => setCounts(PRESET_DRINKS.map(() => 0));

  const totalDrinks = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-beer-dark via-beer-brown/20 to-beer-dark" />
        <div className="absolute inset-0 bg-grain opacity-30" />

        <div className="relative container mx-auto px-4 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-beer-gold/10 text-beer-gold text-xs font-bold px-4 py-2 rounded-full mb-4 border border-beer-gold/20 tracking-widest uppercase">
              <Fish className="h-3.5 w-3.5" />
              Alkomat Fisza
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Sprawdź, co powie <span className="shimmer-text">Fisz</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Dodaj wypite trunki i sprawdź swój stan. Fisz oceni z perspektywy rybiej mądrości. 🐟
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card rounded-3xl p-6 md:p-8 border border-beer-gold/15"
          >
            {/* Weight input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-beer-foam mb-2">
                Twoja waga (kg):
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeight((w) => Math.max(30, w - 5))}
                  className="h-10 w-10 rounded-xl border-beer-gold/20"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Math.max(30, Math.min(200, +e.target.value || 30)))}
                  className="flex-1 text-center text-2xl font-bold bg-background/50 border border-beer-gold/20 rounded-xl py-2 text-foreground focus:ring-2 focus:ring-beer-amber/30 outline-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeight((w) => Math.min(200, w + 5))}
                  className="h-10 w-10 rounded-xl border-beer-gold/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Drink selectors */}
            <div className="space-y-2 mb-6">
              <p className="text-beer-foam/60 text-xs font-semibold uppercase tracking-wider mb-3">
                Co piłeś/aś?
              </p>
              {PRESET_DRINKS.map((drink, i) => (
                <div
                  key={drink.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/20 hover:border-beer-gold/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{drink.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{drink.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {drink.abv}% · {drink.volumeMl}ml
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(i)}
                      disabled={counts[i] === 0}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold text-beer-gold">
                      {counts[i]}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => add(i)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalDrinks > 0 && (
              <div className="flex justify-center mb-6">
                <Button
                  variant="ghost"
                  onClick={reset}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Wyczyść wszystko
                </Button>
              </div>
            )}

            {/* Result */}
            <motion.div
              key={bac.toFixed(2)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Beer className="h-5 w-5 text-beer-gold" />
                <span className="font-display text-3xl md:text-4xl font-black text-beer-gold">
                  {bac} ‰
                </span>
                <Beer className="h-5 w-5 text-beer-gold" />
              </div>

              <motion.div
                className={`inline-flex flex-col items-center gap-1 p-4 rounded-2xl ${
                  bac > 0.5 ? "bg-destructive/10 border border-destructive/20" : "bg-beer-gold/5 border border-beer-gold/10"
                }`}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-4xl">{verdict.emoji}</span>
                <p className={`font-display text-lg font-bold ${verdict.color}`}>
                  {verdict.title}
                </p>
                <p className="text-muted-foreground text-xs max-w-xs">
                  {verdict.desc}
                </p>
              </motion.div>
            </motion.div>

            {/* Disclaimer */}
            <p className="text-center text-[10px] text-muted-foreground/40 mt-6">
              * Fisz nie jest lekarzem. Alkomat ma charakter rozrywkowy.
              Alkohol = tylko dla osób 18+. Nie prowadź po alkoholu!
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AlkomatPage;
