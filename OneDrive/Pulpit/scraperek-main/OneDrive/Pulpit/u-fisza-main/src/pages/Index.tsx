import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import BeerScene3D from "@/components/BeerScene3D";
import BeerAmbient from "@/components/BeerAmbient";
import FeaturesSection from "@/components/FeaturesSection";
import PromoBanner from "@/components/PromoBanner";
import ScrollReveal from "@/components/ScrollReveal";
import TopRatedProducts from "@/components/TopRatedProducts";
import FiszWisdom from "@/components/FiszWisdom";
import BeerOracle from "@/components/BeerOracle";
import FishHoroscope from "@/components/FishHoroscope";
import FridayCountdown from "@/components/FridayCountdown";
import SavingsCalculator from "@/components/SavingsCalculator";
import DontClick from "@/components/DontClick";
import FiszRadio from "@/components/FiszRadio";
import FiszStatus from "@/components/FiszStatus";
import AchievementSystem from "@/components/AchievementSystem";

const FloatingDivider = () => (
  <div className="relative h-20 overflow-hidden">
    <motion.div
      className="absolute inset-x-0 top-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="section-divider" />
    </motion.div>
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-6 z-10"
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
    >
      <span className="text-beer-gold/30 text-sm tracking-[0.5em]">✦ ✦ ✦</span>
    </motion.div>
  </div>
);

const Index = () => {
  const sceneRef = useRef<HTMLElement>(null);
  const { scrollYProgress: sceneProgress } = useScroll({
    target: sceneRef,
    offset: ["start end", "end start"],
  });
  const sceneY = useTransform(sceneProgress, [0, 1], [60, -60]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      {/* Features with scroll reveal */}
      <ScrollReveal>
        <FeaturesSection />
      </ScrollReveal>

      <FloatingDivider />

      {/* Top Rated Products */}
      <ScrollReveal>
        <TopRatedProducts />
      </ScrollReveal>

      <FloatingDivider />

      {/* 3D section with parallax */}
      <section ref={sceneRef} className="relative py-24 bg-beer-gradient overflow-hidden bg-grain">
        <div className="absolute inset-0 bg-gradient-to-b from-beer-dark via-transparent to-beer-dark/90" />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-beer-gold/15"
            style={{ width: 4 + i * 2, height: 4 + i * 2, left: `${10 + i * 15}%`, bottom: 0 }}
            animate={{ y: [0, -300, -600], x: [0, Math.sin(i) * 30, 0], opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
          />
        ))}

        <motion.div className="relative container mx-auto text-center px-4" style={{ y: sceneY }}>
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2 text-beer-foam/40 text-xs tracking-[0.2em] uppercase mb-5 font-body">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-beer-gold/60"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Poznaj naszą maskotkę 🍺
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-beer-foam mb-3 leading-tight">
              Kufel <span className="shimmer-text">Fisza</span> tańczy!
            </h2>
            <p className="text-beer-foam/35 text-sm mb-10 font-body">Nasz tancerz nie może się doczekać Twojego zamówienia 🕺</p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="rounded-2xl overflow-hidden border border-beer-gold/10 bg-beer-dark/30 backdrop-blur-sm">
              <BeerScene3D />
            </div>
          </ScrollReveal>
        </motion.div>
      </section>

      <FloatingDivider />

      {/* Products with scroll reveal */}
      <ScrollReveal>
        <ProductGrid />
      </ScrollReveal>

      <FloatingDivider />

      {/* Beer Oracle - interactive fortune teller */}
      <ScrollReveal>
        <BeerOracle />
      </ScrollReveal>

      <FloatingDivider />

      {/* Fish Horoscope */}
      <ScrollReveal>
        <FishHoroscope />
      </ScrollReveal>

      <FloatingDivider />

      {/* Savings Calculator */}
      <ScrollReveal>
        <div className="container mx-auto">
          <SavingsCalculator />
        </div>
      </ScrollReveal>

      <FloatingDivider />

      {/* Friday Countdown */}
      <div className="container mx-auto py-4">
        <FridayCountdown />
      </div>

      {/* VIP Promo */}
      <ScrollReveal>
        <PromoBanner />
      </ScrollReveal>

      <Footer />
      <CartDrawer />
      <FiszWisdom />
      <FiszRadio />
      <FiszStatus />
      <AchievementSystem />
      <BeerAmbient />
      <div className="fixed bottom-6 right-24 z-40 hidden md:flex flex-col items-center gap-1">
        <DontClick />
      </div>
    </div>
  );
};

export default Index;
