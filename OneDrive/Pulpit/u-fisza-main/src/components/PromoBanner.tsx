import { motion } from "framer-motion";
import { Crown, ArrowRight, Zap, Star, Shield, Beer } from "lucide-react";
import { Link } from "react-router-dom";

const PromoBanner = () => (
  <section className="relative py-24 px-4 overflow-hidden">
    {/* Background */}
    <div className="absolute inset-0 bg-beer-gradient" />
    <div className="absolute inset-0 bg-grain" />

    {/* Animated orbs */}
    <motion.div
      className="absolute -top-20 -left-20 w-[30rem] h-[30rem] rounded-full bg-beer-gold/8 blur-[100px]"
      animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-beer-amber/8 blur-[80px]"
      animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />

    {/* Floating particles */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-beer-gold/30"
        style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
        animate={{ y: [-20, 20, -20], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
      />
    ))}

    <div className="relative container mx-auto">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 150 }}
        >
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-6 py-2.5 text-beer-gold text-sm font-semibold mb-8">
            <Crown className="h-4 w-4" />
            Oferta specjalna
            <motion.div animate={{ rotate: [0, 180, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <Zap className="h-4 w-4" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-beer-foam mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Dołącz do <span className="shimmer-text">Klubu VIP</span> 👑
        </motion.h2>

        <motion.p
          className="text-beer-foam/60 text-lg md:text-xl mb-5 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          Tylko <span className="text-beer-gold font-bold text-3xl">5 zł</span>
          <span className="text-beer-gold/70 text-lg">/tydzień</span> za dostęp
          do ekskluzywnych piw z&nbsp;
          <span className="text-beer-gold font-semibold">sekretnym składnikiem Fisza</span> 🐟
        </motion.p>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: Beer, text: "Limitowane edycje" },
            { icon: Star, text: "Priorytetowa dostawa" },
            { icon: Shield, text: "Ekskluzywne smaki" },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              className="glass-card rounded-full px-4 py-2 text-beer-foam/60 text-sm flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55 + i * 0.1 }}
              whileHover={{ scale: 1.05, borderColor: "hsl(var(--beer-gold) / 0.3)" }}
            >
              <item.icon className="h-3.5 w-3.5 text-beer-gold" />
              {item.text}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          <Link to="/vip">
            <motion.button
              className="btn-beer inline-flex items-center gap-3 px-12 py-4.5 rounded-2xl font-bold text-lg glow-amber relative overflow-hidden"
              whileHover={{ scale: 1.05, gap: "16px" }}
              whileTap={{ scale: 0.97 }}
            >
              Sprawdź VIP
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          {["🔒 Bezpieczne płatności", "🔄 Anuluj kiedy chcesz", "🍺 Nowe piwa co tydzień"].map(
            (badge) => (
              <span
                key={badge}
                className="glass-card rounded-full px-4 py-2 text-beer-foam/40 text-xs"
              >
                {badge}
              </span>
            )
          )}
        </motion.div>
      </div>
    </div>
  </section>
);

export default PromoBanner;
