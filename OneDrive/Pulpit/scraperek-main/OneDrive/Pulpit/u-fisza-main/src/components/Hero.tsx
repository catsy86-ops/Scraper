import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo-u-fisza.png";
import { MapPin, Clock, Phone, ChevronDown } from "lucide-react";

const BeerDrop = ({ delay, left, size = 6 }: { delay: number; left: string; size?: number }) => (
  <motion.div
    className="absolute rounded-full bg-beer-gold/40"
    style={{ left, width: size, height: size * 1.4, top: -10 }}
    animate={{ y: [0, 400, 800], opacity: [0, 0.7, 0], scale: [0.5, 1, 0.3] }}
    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay, ease: "easeIn" }}
  />
);

const FoamBubble = ({ delay, left, bottom }: { delay: number; left: string; bottom: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full bg-beer-foam/20 backdrop-blur-sm"
    style={{ left, bottom }}
    animate={{ y: [0, -120, -250], x: [0, Math.random() > 0.5 ? 15 : -15, 0], opacity: [0, 0.6, 0], scale: [0.3, 1, 0.5] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: "easeOut" }}
  />
);

const Hero = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [0.7, 0.95]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax background */}
      <motion.img
        src={heroBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ y: bgY, scale: bgScale }}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 2, ease: "easeOut" }}
        width={1920}
        height={800}
      />
      <motion.div className="absolute inset-0 bg-hero-overlay" style={{ opacity: overlayOpacity }} />

      {/* Beer drops */}
      {[
        { delay: 0, left: "10%" }, { delay: 1.2, left: "25%" }, { delay: 0.5, left: "45%" },
        { delay: 2, left: "65%" }, { delay: 1.5, left: "80%" }, { delay: 0.8, left: "92%" },
        { delay: 2.5, left: "35%" }, { delay: 1.8, left: "55%" },
      ].map((p, i) => (
        <BeerDrop key={`drop-${i}`} {...p} size={4 + Math.random() * 4} />
      ))}

      {/* Foam bubbles */}
      {[
        { delay: 0, left: "15%", bottom: 20 }, { delay: 1, left: "30%", bottom: 40 },
        { delay: 2, left: "50%", bottom: 10 }, { delay: 0.5, left: "70%", bottom: 30 },
        { delay: 1.5, left: "85%", bottom: 15 },
      ].map((p, i) => (
        <FoamBubble key={`foam-${i}`} {...p} />
      ))}

      {/* Decorative orbs */}
      <motion.div
        className="absolute top-20 left-10 w-40 h-40 rounded-full bg-beer-gold/8 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-32 right-10 w-56 h-56 rounded-full bg-beer-amber/6 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Content with parallax */}
      <motion.div
        className="relative z-10 text-center px-4 max-w-4xl mx-auto will-change-transform"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* Logo */}
        <motion.div
          className="relative inline-block mb-8"
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 150 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-beer-gold/15 blur-2xl"
            animate={{ scale: [1.5, 2.2, 1.5], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-beer-gold/20"
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const r = 85;
            return (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-beer-gold/50"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * r}px - 3px)`,
                  top: `calc(50% + ${Math.sin(angle) * r}px - 3px)`,
                }}
                animate={{ scale: [0, 1.5, 0], opacity: [0, 0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
              />
            );
          })}
          <motion.img
            src={logoImg}
            alt="U Fisza logo"
            className="relative mx-auto h-32 w-32 md:h-40 md:w-40 drop-shadow-2xl rounded-full ring-4 ring-beer-gold/30"
            width={512} height={512}
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="absolute text-2xl"
            style={{ top: "50%", left: "50%" }}
            animate={{ x: [80, 0, -80, 0, 80], y: [0, -80, 0, 80, 0], rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            🍺
          </motion.span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-beer-gold/60 text-sm md:text-base font-semibold tracking-[0.3em] uppercase mb-4 font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          🍺 Sklep piwny & alkoholowy 🍺
        </motion.p>

        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-beer-foam mb-6 drop-shadow-lg leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, type: "spring" }}
        >
          U <span className="shimmer-text">Fisza</span>
        </motion.h1>

        {/* Beer wave */}
        <motion.div
          className="flex justify-center gap-1 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              className="text-lg"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            >
              🍻
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className="text-beer-foam/75 text-lg md:text-xl font-body mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Najlepszy alkohol w mieście — craft piwa, whisky, likiery i nie tylko.
          <br className="hidden md:block" />
          Zamów online i ciesz się dostawą prosto pod drzwi! 🐟
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <motion.a
            href="#produkty"
            className="btn-beer inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg glow-amber"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Zobacz ofertę 🍻
          </motion.a>
          <motion.a
            href="#o-nas"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl glass-card text-beer-foam/90 font-semibold hover:text-beer-gold transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            O nas 📍
          </motion.a>
        </motion.div>

        {/* Info pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 md:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          {[
            { icon: MapPin, text: "ul. Łucznicza, Szczecin" },
            { icon: Clock, text: "Pon–Sob 10:00–22:00" },
            { icon: Phone, text: "+48 91 000 00 00" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="glass-card rounded-full px-5 py-2.5 flex items-center gap-2.5 text-beer-foam/80 text-sm hover:border-beer-gold/30 transition-colors"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <item.icon className="h-4 w-4 text-beer-gold" />
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{ opacity: contentOpacity }}
      >
        <span className="text-beer-foam/40 text-xs font-body tracking-widest uppercase">Przewiń</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-beer-gold/50" />
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
