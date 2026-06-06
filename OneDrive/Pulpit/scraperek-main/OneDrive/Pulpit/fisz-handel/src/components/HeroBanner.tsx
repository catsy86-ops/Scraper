import { TrendingUp, Shield, Truck, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-mesh py-16 md:py-28">
      {/* Animated blobs */}
      <div className="absolute top-10 right-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-0 left-[5%] w-96 h-96 bg-primary-glow/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-rose-400/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center space-y-8"
        >
          {/* Tagline pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-primary/30 text-sm font-medium text-primary shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Tysiące ofert czeka na Ciebie
          </motion.div>

          <h1 className="text-4xl md:text-7xl font-bold text-foreground leading-[1.05] tracking-tight font-['Space_Grotesk']">
            Znajdź swoje{' '}
            <span className="relative inline-block">
              <span className="text-gradient">perełki</span>
              <svg className="absolute -bottom-2 left-0 w-full h-2 text-primary/40" viewBox="0 0 100 8" preserveAspectRatio="none">
                <path d="M0 7 Q 25 0, 50 5 Q 75 10, 100 3" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
            <br className="hidden md:block" />
            u&nbsp;Fisza
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Kupuj i sprzedawaj używane rzeczy w&nbsp;Twojej okolicy — szybko, wygodnie i bezpiecznie.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
          >
            <Button
              size="lg"
              className="text-base font-semibold px-8 h-12 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-[1.03] active:scale-[0.98] transition-bounce gap-2"
              onClick={() => document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Przeglądaj oferty
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base font-semibold px-8 h-12 rounded-2xl border-border/60 backdrop-blur-md bg-background/40 hover:bg-accent hover:scale-[1.03] active:scale-[0.98] transition-bounce"
              onClick={() => navigate('/add')}
            >
              Sprzedaj coś
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-6 mt-16 max-w-xl mx-auto"
        >
          {[
            { icon: Shield, label: 'Bezpieczne zakupy' },
            { icon: TrendingUp, label: 'Najlepsze ceny' },
            { icon: Truck, label: 'Szybka wysyłka' },
          ].map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex flex-col items-center gap-2.5 text-center group">
              <div className="w-14 h-14 rounded-2xl bg-background/60 backdrop-blur-md border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300 shadow-md">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;
