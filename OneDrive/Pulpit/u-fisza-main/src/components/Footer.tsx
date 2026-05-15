import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Beer, ExternalLink, Heart, Instagram, Facebook, ShieldCheck, Award, Star } from "lucide-react";
import logoImg from "@/assets/logo-u-fisza.png";
import FridayCountdown from "@/components/FridayCountdown";

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const Footer = () => (
  <footer id="o-nas" className="relative bg-beer-gradient text-beer-foam/80 overflow-hidden">
    <div className="section-divider" />

    {/* Decorative */}
    <motion.div
      className="absolute top-0 right-0 w-[30rem] h-[30rem] rounded-full bg-beer-amber/4 blur-[100px]"
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-beer-gold/4 blur-[80px]"
      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />

    <div className="relative container mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-3 gap-12 md:gap-8 mb-16">
        {/* Brand */}
        <motion.div
          className="text-center md:text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
          variants={sectionVariants}
        >
          <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
            <motion.div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-beer-gold/20 blur-xl scale-[2]"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.img
                src={logoImg}
                alt="U Fisza"
                className="relative h-14 w-14 rounded-full ring-2 ring-beer-gold/25 shadow-[0_0_20px_hsl(var(--beer-gold)/0.15)]"
                whileHover={{ scale: 1.1, rotate: 5 }}
              />
            </motion.div>
            <div>
              <h3 className="font-display text-2xl font-bold text-gradient-beer">U Fisza</h3>
              <p className="text-beer-foam/30 text-xs tracking-[0.2em] uppercase">Sklep Piwny ✦ 2024</p>
            </div>
          </div>
          <p className="text-beer-foam/50 text-sm leading-relaxed max-w-xs mx-auto md:mx-0 mb-8">
            Fisz od lat dostarcza najlepszy alkohol w mieście. Każda butelka ręcznie
            wybrana przez naszego eksperta-rybę. Na zdrowie! 🍻
          </p>
          {/* Stats */}
          <div className="flex gap-6 justify-center md:justify-start">
            {[
              { val: "1000+", label: "Klientów" },
              { val: "50+", label: "Rodzajów piw" },
              { val: "24h", label: "Dostawa" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
              >
                <p className="text-beer-gold font-bold text-2xl font-display">{s.val}</p>
                <p className="text-[11px] text-beer-foam/35 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          className="text-center md:text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={1}
          variants={sectionVariants}
        >
          <h4 className="font-display text-lg font-bold text-beer-gold mb-6 flex items-center gap-2 justify-center md:justify-start">
            <Beer className="h-5 w-5" />
            Kontakt
          </h4>
          <div className="space-y-4">
            <a
              href="https://maps.google.com/?q=Łucznicza+Szczecin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 text-sm hover:text-beer-gold transition-colors group justify-center md:justify-start"
            >
              <MapPin className="h-4 w-4 mt-0.5 text-beer-amber shrink-0 group-hover:scale-110 transition-transform" />
              <span>ul. Łucznicza<br />70-001 Szczecin</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
            </a>
            <a href="tel:+48910000000" className="flex items-center gap-3 text-sm hover:text-beer-gold transition-colors justify-center md:justify-start group">
              <Phone className="h-4 w-4 text-beer-amber shrink-0 group-hover:scale-110 transition-transform" />
              <span>+48 91 000 00 00</span>
            </a>
            <a href="mailto:kontakt@ufisza.pl" className="flex items-center gap-3 text-sm hover:text-beer-gold transition-colors justify-center md:justify-start group">
              <Mail className="h-4 w-4 text-beer-amber shrink-0 group-hover:scale-110 transition-transform" />
              <span>kontakt@ufisza.pl</span>
            </a>
          </div>

          {/* Social icons */}
          <div className="flex gap-3 mt-6 justify-center md:justify-start">
            {[
              { icon: Instagram, label: "Instagram" },
              { icon: Facebook, label: "Facebook" },
            ].map(({ icon: Icon, label }) => (
              <motion.a
                key={label}
                href="#"
                className="p-2.5 rounded-xl bg-beer-foam/[0.04] border border-beer-foam/[0.06] hover:border-beer-gold/20 hover:bg-beer-gold/10 text-beer-foam/40 hover:text-beer-gold transition-all"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-4 w-4" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Hours */}
        <motion.div
          className="text-center md:text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={2}
          variants={sectionVariants}
        >
          <h4 className="font-display text-lg font-bold text-beer-gold mb-6 flex items-center gap-2 justify-center md:justify-start">
            <Clock className="h-5 w-5" />
            Godziny otwarcia
          </h4>
          <div className="space-y-3 text-sm">
            {[
              { day: "Pon – Pt", hrs: "10:00 – 22:00", open: true },
              { day: "Sobota", hrs: "10:00 – 23:00", open: true },
              { day: "Niedziela", hrs: "Zamknięte", open: false },
            ].map((r) => (
              <div key={r.day} className="flex justify-between items-center max-w-[240px] mx-auto md:mx-0 py-1.5 border-b border-beer-foam/[0.04] last:border-0">
                <span className="text-beer-foam/60">{r.day}</span>
                <span className={`font-semibold flex items-center gap-2 ${r.open ? "text-beer-foam" : "text-beer-foam/30"}`}>
                  {r.open && <span className="w-1.5 h-1.5 rounded-full bg-beer-hop animate-pulse" />}
                  {r.hrs}
                </span>
              </div>
            ))}
          </div>

          {/* Mini CTA */}
          <motion.div
            className="mt-8 p-4 rounded-xl glass-card text-center"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-beer-gold text-xs font-semibold mb-1">💡 Wiesz, że...</p>
            <p className="text-beer-foam/40 text-xs">Zamówienia online przyjmujemy 24/7!</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Map */}
      <motion.div
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <h4 className="font-display text-lg font-bold text-beer-gold mb-5 flex items-center gap-2 justify-center md:justify-start">
          <MapPin className="h-5 w-5" />
          Znajdź nas na mapie
        </h4>
        <div className="rounded-2xl overflow-hidden ring-1 ring-beer-gold/15 aspect-video max-h-[300px] animated-border shadow-[0_10px_40px_-10px_hsl(var(--beer-dark)/0.5)]">
          <iframe
            title="Lokalizacja U Fisza - ul. Łucznicza, Szczecin"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2377.5!2d14.55!3d53.43!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zTHVjem5pY3phLCBTemN6ZWNpbg!5e0!3m2!1spl!2spl!4v1700000000000!5m2!1spl!2spl&q=%C5%81ucznicza+Szczecin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </motion.div>

      {/* Bottom */}
      <div className="section-divider mb-8" />

      {/* Certificate badges */}
      <motion.div
        className="flex flex-wrap justify-center gap-3 mb-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {[
          { icon: ShieldCheck, text: "ISO 9001: Piwo", sub: "Norma jakości" },
          { icon: Award, text: "Atest Rybactwa", sub: "Fisz Approved™" },
          { icon: Star, text: "Towarzystwo Przyjaciół Pianki", sub: "Członek honorowy" },
          { icon: Beer, text: "Certyfikat Chmielu", sub: "100% naturalne" },
        ].map((cert, i) => (
          <motion.div
            key={cert.text}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, rotate: (i % 2 === 0 ? 2 : -2) }}
            className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 text-beer-foam/50 text-[11px] border border-beer-gold/10"
          >
            <cert.icon className="h-4 w-4 text-beer-gold/60 flex-shrink-0" />
            <div>
              <p className="font-semibold text-beer-gold/80 leading-tight">{cert.text}</p>
              <p className="text-beer-foam/30 text-[9px]">{cert.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Friday Countdown */}
      <div className="mb-6">
        <FridayCountdown />
      </div>

      <motion.div
        className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-beer-foam/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <p className="flex items-center gap-1.5">
          © 2026 Sklep Piwny U Fisza — zrobione z <Heart className="h-3 w-3 text-accent inline animate-pulse" /> w Szczecinie
        </p>
        <motion.p
          className="beer-badge px-4 py-2 rounded-full text-beer-gold/70 font-semibold"
          whileHover={{ scale: 1.05 }}
        >
          🔞 Sprzedaż tylko dla osób pełnoletnich (18+)
        </motion.p>
      </motion.div>
    </div>
  </footer>
);

export default Footer;
