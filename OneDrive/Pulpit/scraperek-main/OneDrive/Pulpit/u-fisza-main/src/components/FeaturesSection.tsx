import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Truck, Award, ShieldCheck, Sparkles, Beer, Users } from "lucide-react";

const features = [
  {
    icon: Beer,
    title: "Selekcja Fisza",
    desc: "Każda butelka ręcznie wybrana przez naszego eksperta — gwarancja jakości.",
    emoji: "🍺",
    gradient: "from-beer-amber/20 to-beer-gold/10",
  },
  {
    icon: Truck,
    title: "Szybka dostawa",
    desc: "Zamów online, a my dostarczymy Twoje ulubione trunki w 24h.",
    emoji: "🚚",
    gradient: "from-beer-gold/15 to-beer-amber/10",
  },
  {
    icon: Award,
    title: "Premium & Craft",
    desc: "Ekskluzywne piwa rzemieślnicze, whisky i wina z całego świata.",
    emoji: "🏆",
    gradient: "from-beer-copper/15 to-beer-amber/10",
  },
  {
    icon: ShieldCheck,
    title: "Zaufanie klientów",
    desc: "Ponad 1000+ zadowolonych klientów. Sprawdź nasze recenzje!",
    emoji: "⭐",
    gradient: "from-beer-gold/15 to-beer-wheat/10",
  },
  {
    icon: Users,
    title: "Klub VIP",
    desc: "Dołącz do VIP i odkryj piwa z sekretnym składnikiem Fisza.",
    emoji: "👑",
    gradient: "from-beer-amber/20 to-beer-copper/10",
  },
  {
    icon: Sparkles,
    title: "Unikalne smaki",
    desc: "Co tydzień nowe pozycje — nie przegap limitowanych edycji.",
    emoji: "✨",
    gradient: "from-beer-wheat/15 to-beer-gold/10",
  },
];

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [60, -100]);

  return (
    <section ref={sectionRef} className="relative py-24 px-4 bg-grain overflow-hidden">
      {/* Parallax decorative orbs */}
      <motion.div
        className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-beer-gold/5 blur-3xl"
        style={{ y: orbY }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-beer-amber/5 blur-3xl"
        style={{ y: orbY2 }}
      />

      <div className="relative container mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-beer-amber/10 text-beer-amber text-sm font-semibold px-5 py-2 rounded-full mb-5 tracking-wider uppercase border border-beer-amber/15"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="h-4 w-4" />
            Dlaczego my?
          </motion.div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5">
            Co nas <span className="text-gradient-beer">wyróżnia</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Fisz to nie tylko sklep — to filozofia dobrego trunku 🐟
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative rounded-2xl p-6 cursor-default overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            >
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${f.gradient}`} />
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[inset_0_0_0_1px_hsl(var(--beer-gold)/0.15),0_10px_40px_-10px_hsl(var(--beer-amber)/0.15)]" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-13 h-13 rounded-xl bg-gradient-to-br from-beer-amber/15 to-beer-gold/10 flex items-center justify-center border border-beer-gold/10 group-hover:border-beer-gold/25 transition-all duration-300"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    <f.icon className="h-6 w-6 text-beer-amber" />
                  </motion.div>
                  <motion.span
                    className="text-2xl"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {f.emoji}
                  </motion.span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-beer-amber transition-colors duration-300">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
