import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, MapPin, Beer, Fish, Package, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";

const BARS_ON_ROUTE = [
  { name: "Bar Pod Złotym Karpiem", lat: 53.435, lng: 14.560, delay: 2000 },
  { name: "Knajpa U Wujka Staszka", lat: 53.440, lng: 14.555, delay: 3000 },
  { name: "Piwiarnia Na Rogu", lat: 53.430, lng: 14.565, delay: 1500 },
  { name: "Whisky Bar Dno", lat: 53.445, lng: 14.550, delay: 4000 },
  { name: "Stacja Paliw (z barem)", lat: 53.438, lng: 14.558, delay: 1000 },
];

interface DeliveryStep {
  text: string;
  icon: string;
  delay: number;
}

const DeliveryTracker = () => {
  const [started, setStarted] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [steps, setSteps] = useState<DeliveryStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [fiszThought, setFiszThought] = useState("");

  const FISZ_THOUGHTS = [
    "Fisz ładuje paczkę na bagażnik 🚲",
    "Fisz sprawdza adres... hmm, gdzie to jest?",
    `Fisz mija ${BARS_ON_ROUTE[0].name}... tylko rzucę okiem 👀`,
    "Fisz wziął jednego na drogę. To rozgrzewka! 🍺",
    "Fisz mówi: 'Jeszcze jeden browar i jadę' 🍻",
    "Fisz wsiada na rower... po 3 kuflach. To będzie ciekawe.",
    "Fisz wraca do baru... zapomniał kapelusza! 🎩",
    "Fisz znowu w barze. Kurierem jest, prawa ma. 🐟",
    "Fisz gubi paczkę. Szuka pod stołem. 📦",
    "Fisz znalazł paczkę! Kierunek — Twój dom! 🏠",
    "Fisz sprawdza ciśnienie w oponach... sprawdza też ciśnienie w kuflu.",
    "OSTATECZNIE Fisz jedzie do Ciebie! (Po 5 piwach to już na serio)",
  ];

  const generateSteps = () => {
    const result: DeliveryStep[] = [
      { text: "Przyjęto zamówienie — Fisz dostał cynk!", icon: "📋", delay: 500 },
      { text: "Fisz idzie do magazynu", icon: "🏭", delay: 1000 },
      { text: "Wybiera najlepsze butelki", icon: "🍾", delay: 1200 },
    ];

    const numBars = 2 + Math.floor(Math.random() * 4);
    const shuffled = [...BARS_ON_ROUTE].sort(() => Math.random() - 0.5).slice(0, numBars);

    for (let i = 0; i < numBars; i++) {
      result.push({
        text: `Fisz zatrzymuje się w: ${shuffled[i].name}`,
        icon: "🍺",
        delay: shuffled[i].delay,
      });
      if (Math.random() > 0.5) {
        result.push({
          text: FISZ_THOUGHTS[Math.floor(Math.random() * FISZ_THOUGHTS.length)],
          icon: "🤔",
          delay: 1000 + Math.random() * 2000,
        });
      }
    }

    result.push({ text: "Fisz jedzie prosto do Ciebie! 🚀", icon: "🚴", delay: 2000 });
    result.push({ text: "Paczka dostarczona! Fisz oddaje pokłon płetwą 🐟🎩", icon: "✅", delay: 500 });

    return result;
  };

  const startDelivery = () => {
    setStarted(true);
    setDelivered(false);
    setCurrentStep(-1);
    const newSteps = generateSteps();
    setSteps(newSteps);

    let totalDelay = 0;
    newSteps.forEach((step, i) => {
      totalDelay += step.delay;
      setTimeout(() => {
        setCurrentStep(i);
        setFiszThought(
          FISZ_THOUGHTS[Math.floor(Math.random() * FISZ_THOUGHTS.length)]
        );
        if (i === newSteps.length - 1) {
          setDelivered(true);
        }
      }, totalDelay);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      <section className="relative pt-28 pb-16 min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-beer-dark via-beer-brown/20 to-beer-dark" />
        <div className="absolute inset-0 bg-grain opacity-30" />

        <div className="relative container mx-auto px-4 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-beer-gold/10 text-beer-gold text-xs font-bold px-4 py-2 rounded-full mb-4 border border-beer-gold/20 tracking-widest uppercase">
              <Truck className="h-3.5 w-3.5" />
              Dostawca Fisz
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Śledź swoją <span className="shimmer-text">paczkę</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Fisz osobiście dostarcza Twoje zamówienie... podobno. Śledź jego (mniej więcej) trasę. 🐟📦
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-6 md:p-8 border border-beer-gold/15"
          >
            {/* Fake map */}
            <div className="relative rounded-2xl overflow-hidden mb-6 border border-beer-gold/10 aspect-video bg-beer-dark/50 flex items-center justify-center">
              {!started ? (
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-beer-gold/40 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">Mapa Szczecina [symulacja]</p>
                </div>
              ) : (
                <motion.div
                  className="absolute"
                  animate={{
                    left: ["10%", "30%", "15%", "50%", "45%", "70%", "80%", "60%", "90%"],
                    top: ["80%", "50%", "70%", "30%", "60%", "40%", "20%", "50%", "15%"],
                  }}
                  transition={{ duration: (steps.length * 1.5) || 10, ease: "linear" }}
                >
                  <Fish className="h-6 w-6 text-beer-gold" />
                </motion.div>
              )}
            </div>

            {!started ? (
              <div className="text-center">
                <Button
                  onClick={startDelivery}
                  className="bg-beer-gold hover:bg-beer-gold/90 text-beer-dark font-bold gap-2 px-8"
                >
                  <Package className="h-4 w-4" />
                  Rozpocznij śledzenie paczki
                </Button>
                <p className="text-muted-foreground/40 text-[10px] mt-3 italic">
                  * Fisz nie gwarantuje szybkości, trzeźwości ani dotarcia paczki
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-beer-gold text-xs font-bold uppercase tracking-wider mb-3">
                  <Truck className="h-3.5 w-3.5" />
                  Status dostawy:
                </div>

                <AnimatePresence>
                  {steps.map((step, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep && !delivered;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: i <= currentStep + 1 ? 1 : 0, x: 0 }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                            done
                              ? "bg-beer-gold/20 border border-beer-gold/30 text-beer-gold"
                              : "bg-muted/30 border border-border/20 text-muted-foreground"
                          }`}
                        >
                          {done ? "✓" : step.icon}
                        </div>
                        <div className="flex-1 pt-1">
                          <p
                            className={`text-sm ${
                              done ? "text-foreground font-semibold" : "text-muted-foreground"
                            } ${active ? "animate-pulse text-beer-gold" : ""}`}
                          >
                            {step.text}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Fisz's current thought */}
                {currentStep >= 0 && !delivered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentStep}
                    className="mt-4 p-3 rounded-xl bg-beer-gold/5 border border-beer-gold/10 text-center"
                  >
                    <p className="text-xs text-beer-gold/70 italic">💭 {fiszThought}</p>
                  </motion.div>
                )}

                {delivered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="mt-5 text-center"
                  >
                    <p className="text-4xl mb-2">📦🐟🎩</p>
                    <p className="font-display text-xl font-bold text-beer-gold">
                      Paczka dostarczona!
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Fisz zrobił to... jakoś. Twój trunek czeka na otwarcie!
                    </p>
                    <Button
                      onClick={startDelivery}
                      variant="ghost"
                      className="mt-3 text-xs text-beer-gold/70 hover:text-beer-gold"
                    >
                      Śledź kolejną paczkę
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DeliveryTracker;
