import { TrainFront, Bus } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
    <div className="container mx-auto px-4 text-center">
      <motion.div
        className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span>🚊</span> ZDiTM Szczecin
      </motion.div>
      <motion.h1
        className="font-heading text-4xl md:text-6xl font-extrabold text-foreground leading-tight max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Transport publiczny<br />
        <span className="text-primary">w Twoim telefonie</span>
      </motion.h1>
      <motion.p
        className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        Rozkłady jazdy tramwajów i autobusów ZDiTM Szczecin.
        Sprawdź linie, trasy i częstotliwość kursowania.
      </motion.p>
      <motion.div
        className="flex items-center justify-center gap-4 mt-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4, type: "spring" }}
      >
        <a
          href="#tramwaje"
          className="inline-flex items-center gap-2 bg-tram text-tram-foreground px-6 py-3 rounded-lg font-heading font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95"
        >
          <TrainFront size={20} /> Tramwaje
        </a>
        <a
          href="#autobusy"
          className="inline-flex items-center gap-2 bg-bus text-bus-foreground px-6 py-3 rounded-lg font-heading font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95"
        >
          <Bus size={20} /> Autobusy
        </a>
      </motion.div>
    </div>
    {/* Decorative circles with animation */}
    <motion.div
      className="absolute -top-20 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl"
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  </section>
);

export default HeroSection;
