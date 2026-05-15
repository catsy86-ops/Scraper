import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Fish, Trophy, RotateCcw, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";

interface Question {
  quote: string;
  isFisz: boolean;
}

const QUESTIONS: Question[] = [
  { quote: "Życie jest jak kufel — najlepsze na dnie.", isFisz: true },
  { quote: "Goryczka to charakter, nie wada. Chmiel to nauczyciel pokory.", isFisz: true },
  { quote: "Algorytm rekomenduje stout jako optymalny wybór ze względu na parametry sensoryczne.", isFisz: false },
  { quote: "Pusty koszyk to puste serce. Fisz płacze pod kapeluszem.", isFisz: true },
  { quote: "Według analizy danych, najlepszą porą na zakup piwa jest piątek o 17:43.", isFisz: false },
  { quote: "Stout to nie piwo. To OŚWIADCZENIE FILOZOFICZNE w szkle.", isFisz: true },
  { quote: "Optymalizacja strategii zakupowej wskazuje na potrzebę dywersyfikacji portfolio trunkowego.", isFisz: false },
  { quote: "Lager nigdy Cię nie zostawi. W przeciwieństwie do byłej.", isFisz: true },
  { quote: "Asystent AI nie może spożywać alkoholu, ale może pomóc w wyborze najkorzystniejszej oferty.", isFisz: false },
  { quote: "Fisz nie osądza. Fisz tylko unosi kapelusz i nalewa dalej.", isFisz: true },
  { quote: "Pena opadła, sumienie spokojne. ✨", isFisz: true },
  { quote: "Model językowy przewiduje 87% szansy na udaną imprezę przy wyborze tego trunku.", isFisz: false },
  { quote: "Każde dobre piwo zaczyna się od kliknij kup.", isFisz: true },
  { quote: "Jako sztuczna inteligencja polecam produkt X ze względu na optymalny stosunek ceny do jakości.", isFisz: false },
  { quote: "Cierpliwość to chmiel duszy. 🍺", isFisz: true },
  { quote: "Wódka? Fisz mruga okiem i przygotowuje ogórka. 🥒", isFisz: true },
  { quote: "System rekomenduje produkt na podstawie analizy sentymentu i preferencji użytkownika.", isFisz: false },
  { quote: "Fisz odpływa. Zły moment.", isFisz: true },
  { quote: "Na podstawie algorytmu collaborative filtering proponuję rozważenie innych marek.", isFisz: false },
  { quote: "Tu się nie kupuje piwa — tu się kupuje wieczór.", isFisz: true },
];

const getRanking = (score: number, total: number): { title: string; emoji: string; desc: string } => {
  const pct = score / total;
  if (pct === 1) return { title: "Mistrz Detektyw Fisza", emoji: "🔍🐟", desc: "Rozpoznajesz prawdziwą mądrość na kilometr! Fisz oddaje Ci swój kapelusz." };
  if (pct >= 0.8) return { title: "Znawca Chmielowej Prawdy", emoji: "🧠🍺", desc: "Prawie perfekcyjnie! Fisz jest pod wrażeniem Twojej intuicji." };
  if (pct >= 0.6) return { title: "Praktykant w Kapeluszu", emoji: "🎩📚", desc: "Nieźle! Masz zadatki na prawdziwego bywalca u Fisza." };
  if (pct >= 0.4) return { title: "Lekko Zdezorientowany", emoji: "🤔🍻", desc: "AI zaczyna brzmieć trochę za bardzo jak Fisz? A może Fisz jak AI? Trudne!" };
  if (pct >= 0.2) return { title: "Zagubiony w Chmielu", emoji: "🌿😵", desc: "Potrzebujesz więcej treningu. Wpadnij do Fisza na piwo — to pomaga!" };
  return { title: "Kompletny Laik", emoji: "🤖❌", desc: "Może za bardzo wierzysz w AI. Fisz Cię jednak nie skreśla — browarek czeka!" };
};

const FiszVsAI = () => {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [shuffled, setShuffled] = useState<Question[]>([]);

  const start = () => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setShuffled(shuffled);
    setCurrentQ(0);
    setAnswers([]);
    setFinished(false);
    setStarted(true);
  };

  const handleAnswer = (guessIsFisz: boolean) => {
    const correct = shuffled[currentQ].isFisz;
    setAnswers([...answers, correct === guessIsFisz]);
    if (currentQ < shuffled.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setFinished(true);
    }
  };

  const score = answers.filter(Boolean).length;
  const ranking = useMemo(() => getRanking(score, shuffled.length), [score, shuffled]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <section className="relative pt-28 pb-16 min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-beer-dark via-beer-brown/20 to-beer-dark" />
        <div className="absolute inset-0 bg-grain opacity-30" />

        <div className="relative container mx-auto px-4 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-beer-gold/10 text-beer-gold text-xs font-bold px-4 py-2 rounded-full mb-4 border border-beer-gold/20 tracking-widest uppercase">
              <Brain className="h-3.5 w-3.5" />
              Fisz czy AI?
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Czy to <span className="shimmer-text">Fisz</span>, czy sztuczna inteligencja?
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Zgadnij, czy cytat pochodzi od Fisza, czy wygenerowało go AI. Tylko prawdziwi znawcy odróżnią chmiel od kodu! 🤖🍺
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-6 md:p-8 border border-beer-gold/15"
          >
            {!started ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Fish className="h-16 w-16 text-beer-gold" />
                  <span className="text-2xl font-black text-beer-gold">VS</span>
                  <Brain className="h-16 w-16 text-beer-hop" />
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  10 cytatów. Zgadnij: czy to Fisz, czy AI? <br />
                  🐟 = Prawdziwa mądrość Fisza<br />
                  🤖 = Wygenerowane przez sztuczną inteligencję
                </p>
                <Button
                  onClick={start}
                  className="bg-beer-gold hover:bg-beer-gold/90 text-beer-dark font-bold gap-2 px-8"
                >
                  <Trophy className="h-4 w-4" />
                  Rozpocznij quiz
                </Button>
              </div>
            ) : !finished ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Progress */}
                  <div className="flex items-center gap-1 mb-6">
                    {shuffled.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < answers.length
                            ? answers[i]
                              ? "bg-green-400"
                              : "bg-red-400"
                            : i === currentQ
                            ? "bg-beer-gold"
                            : "bg-muted/50"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-beer-gold/60 font-bold uppercase tracking-widest mb-1">
                    Cytat {currentQ + 1} z {shuffled.length}
                  </p>
                  <div className="bg-muted/20 rounded-2xl p-5 border border-border/20 mb-5">
                    <p className="font-display text-lg font-bold text-foreground leading-relaxed text-center">
                      "{shuffled[currentQ].quote}"
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAnswer(true)}
                      className="flex-1 h-16 rounded-2xl bg-beer-amber/15 border-2 border-beer-gold/30 hover:bg-beer-gold/20 text-foreground font-bold text-lg gap-2"
                    >
                      <Fish className="h-6 w-6 text-beer-gold" />
                      Fisz 🐟
                    </Button>
                    <Button
                      onClick={() => handleAnswer(false)}
                      className="flex-1 h-16 rounded-2xl bg-beer-hop/10 border-2 border-beer-hop/20 hover:bg-beer-hop/20 text-foreground font-bold text-lg gap-2"
                    >
                      <Brain className="h-6 w-6 text-beer-hop" />
                      AI 🤖
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center"
              >
                <p className="text-5xl mb-3">{ranking.emoji}</p>
                <p className="font-display text-2xl font-bold text-beer-gold mb-1">
                  {ranking.title}
                </p>
                <p className="text-3xl font-black text-foreground mb-3">
                  {score} / {shuffled.length}
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  {ranking.desc}
                </p>

                {/* Show wrong answers */}
                <div className="text-left space-y-2 mb-6">
                  <p className="text-xs text-beer-foam/50 font-semibold uppercase tracking-wider">
                    Podsumowanie:
                  </p>
                  {shuffled.map((q, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                        answers[i]
                          ? "bg-green-500/5 border border-green-500/10"
                          : "bg-destructive/5 border border-destructive/10"
                      }`}
                    >
                      <span>{answers[i] ? "✅" : "❌"}</span>
                      <span className="flex-1 truncate">{q.quote}</span>
                      <span className={`font-bold ${q.isFisz ? "text-beer-gold" : "text-beer-hop"}`}>
                        {q.isFisz ? "🐟 Fisz" : "🤖 AI"}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={start}
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Zagraj ponownie
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FiszVsAI;
