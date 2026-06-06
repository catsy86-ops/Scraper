import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fish, ArrowRight, RotateCcw, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import type { Product } from "@/types/product";

interface Question {
  q: string;
  options: { text: string; score: Record<string, number> }[];
}

const QUESTIONS: Question[] = [
  {
    q: "Jesteś na imprezie. Co robisz?",
    options: [
      { text: "Tańczysz na stole w kapeluszu Fisza 🎩💃", score: { piwo: 2, wódka: 1 } },
      { text: "Siedzisz w kącie i recenzujesz playlistę 🧐🎵", score: { wino: 2, inne: 1 } },
      { text: "Rozmawiasz z psem gospodarza o filozofii 🐕📚", score: { piwo: 1, wino: 1 } },
      { text: "Jesteś DJ-em i miksujesz disco polo z techno 🎧🔥", score: { wódka: 3 } },
    ],
  },
  {
    q: "Wybierasz przekąskę do picia:",
    options: [
      { text: "Kabanosy i ogórek kiszony 🥒", score: { wódka: 2, piwo: 1 } },
      { text: "Ser pleśniowy i winogrona 🧀🍇", score: { wino: 3 } },
      { text: "Precle i orzeszki 🥨", score: { piwo: 2 } },
      { text: "Wszystko co jest w lodówce, łącznie z dżemem 🍓", score: { inne: 2, piwo: 1 } },
    ],
  },
  {
    q: "Twój ulubiony wieczór to:",
    options: [
      { text: "Grill z ekipą, gitara i śpiew do rana 🔥🎸", score: { piwo: 3 } },
      { text: "Kolacja przy świecach i dobre wino 🕯️🍷", score: { wino: 3 } },
      { text: "Domówka z tańcami do białego rana 🏠🕺", score: { wódka: 2, inne: 1 } },
      { text: "Oglądanie serialu w piżamie, sam/a ze sobą 📺😌", score: { piwo: 1, wino: 1 } },
    ],
  },
  {
    q: "Gdybyś był/a alkoholem, to jakim?",
    options: [
      { text: "Rześkim piwkiem w słoneczny dzień ☀️🍺", score: { piwo: 3 } },
      { text: "Wyrafinowanym winem z piwniczki 🍷🏰", score: { wino: 3 } },
      { text: "Mocną czystą — bez litości 💪", score: { wódka: 3 } },
      { text: "Likierem z tajemniczą historią 🍸🕵️", score: { inne: 3 } },
    ],
  },
  {
    q: "Co Cię najbardziej denerwuje?",
    options: [
      { text: "Gdy piwo nie jest odpowiednio schłodzone ❄️😤", score: { piwo: 2 } },
      { text: "Gdy ktoś dolewa coli do wina (serio?!) 🤢", score: { wino: 2 } },
      { text: "Gdy impreza kończy się o 22:00 🕙💢", score: { wódka: 2 } },
      { text: "Gdy nie ma nic ciekawego do picia, tylko woda 💧😒", score: { inne: 1, piwo: 1 } },
    ],
  },
];

const resultMessages: Record<string, { title: string; desc: string; emoji: string }> = {
  piwo: { title: "Piwny Koneser", desc: "Fisz kiwa płetwą — jesteś stworzony/a do piwa. Złoty trunek to Twoja droga!", emoji: "🍺" },
  wino: { title: "Winny Elegant", desc: "Fisz unosi kapelusz przed Twoją klasą. Karafka, korek i rozmowa do późna.", emoji: "🍷" },
  wódka: { title: "Wódczany Wojownik", desc: "Fisz wyciąga ogórki i szykuje parkiet! Zimna czysta to Twój żywioł.", emoji: "🥃" },
  inne: { title: "Alkoholowy Odkrywca", desc: "Likiery, whisky, tajemnicze trunki. Fisz nie wie co pijesz, ale szanuje!", emoji: "🍸" },
};

const QuizPage = () => {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const winner = useMemo(() => {
    const entries = Object.entries(scores);
    if (entries.length === 0) return "piwo";
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [scores]);

  const recommendedProducts = useMemo(() => {
    return products.filter((p) => {
      if (winner === "piwo") return p.category === "piwo";
      if (winner === "wino") return p.category === "wino";
      if (winner === "wódka") return p.category === "wódka";
      if (winner === "inne") return p.category === "inne";
      return false;
    });
  }, [winner]);

  const handleAnswer = (score: Record<string, number>) => {
    setScores((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(score)) {
        next[k] = (next[k] || 0) + v;
      }
      return next;
    });

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} dodano do koszyka! 🐟`);
  };

  const restart = () => {
    setStep(0);
    setScores({});
    setFinished(false);
  };

  const msg = resultMessages[winner];

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
              Co by tu wypić?
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Quiz <span className="shimmer-text">Fisza</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Odpowiedz na 5 pytań, a Fisz podpowie Ci idealny trunek na dziś! 🐟🎩
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card rounded-3xl p-6 md:p-8 border border-beer-gold/15"
          >
            <AnimatePresence mode="wait">
              {!finished ? (
                <motion.div
                  key={`q-${step}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Progress */}
                  <div className="flex items-center gap-1 mb-6">
                    {QUESTIONS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= step ? "bg-beer-gold" : "bg-muted/50"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-beer-gold/60 font-bold uppercase tracking-widest mb-1">
                    Pytanie {step + 1} z {QUESTIONS.length}
                  </p>
                  <p className="font-display text-lg md:text-xl font-bold text-foreground mb-5">
                    {QUESTIONS[step].q}
                  </p>
                  <div className="space-y-2">
                    {QUESTIONS[step].options.map((opt, i) => (
                      <motion.button
                        key={i}
                        onClick={() => handleAnswer(opt.score)}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/20 hover:border-beer-gold/30 hover:bg-beer-gold/5 transition-all group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-beer-gold/10 flex items-center justify-center text-sm font-bold text-beer-gold group-hover:bg-beer-gold/20 transition-colors flex-shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm text-foreground/80">{opt.text}</span>
                        <ArrowRight className="h-4 w-4 text-beer-gold/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="text-6xl mb-4"
                  >
                    {msg.emoji}
                  </motion.div>

                  <p className="font-display text-2xl font-bold text-beer-gold mb-2">
                    {msg.title}
                  </p>
                  <p className="text-muted-foreground text-sm mb-6">
                    {msg.desc}
                  </p>

                  <p className="text-beer-foam/60 text-xs font-semibold uppercase tracking-wider mb-3">
                    Fisz poleca:
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {recommendedProducts.slice(0, 4).map((product) => (
                      <motion.div
                        key={product.id}
                        whileHover={{ scale: 1.03 }}
                        className="p-3 rounded-xl bg-muted/30 border border-border/20 hover:border-beer-gold/20 text-left"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-contain mx-auto mb-2"
                        />
                        <p className="text-xs font-bold text-foreground text-center mb-1 line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-beer-gold font-bold text-center mb-2">
                          {product.price.toFixed(2)} zł
                        </p>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="w-full text-[11px] h-7 bg-beer-gold/10 hover:bg-beer-gold/20 text-beer-gold border border-beer-gold/20 rounded-lg"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Do koszyka
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    onClick={restart}
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Zagraj ponownie
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuizPage;
