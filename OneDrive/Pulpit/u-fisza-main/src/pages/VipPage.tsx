import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Lock, Star, Sparkles, Fish, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { vipProducts } from "@/data/vipProducts";
import { useCartStore } from "@/stores/cartStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { toast } from "sonner";

const VipPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Musisz być zalogowany, aby wykupić subskrypcję VIP!");
      navigate("/auth");
      return;
    }
    // Mock subscription
    setSubscribed(true);
    toast.success("🎉 Witaj w strefie VIP! Subskrypcja aktywna (5 zł/tydzień)");
  };

  const handleAddToCart = (product: typeof vipProducts[0]) => {
    if (!subscribed) {
      toast.error("Wykup subskrypcję VIP, aby dodać te produkty do koszyka!");
      return;
    }
    addItem(product);
    toast.success(`${product.name} dodano do koszyka! 🐟`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />

      {/* Hero VIP */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-beer-dark via-beer-brown/40 to-beer-dark" />
        <div className="absolute inset-0 bg-grain opacity-30" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-beer-gold/30"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2 text-beer-gold text-xs tracking-widest uppercase mb-6">
              <Crown className="h-4 w-4" />
              Strefa VIP
              <Crown className="h-4 w-4" />
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-black text-beer-foam mb-4">
              Sekretny Składnik{" "}
              <span className="text-gradient-beer">Fisza</span>{" "}
              <Fish className="inline h-8 w-8 md:h-12 md:w-12 text-beer-gold" />
            </h1>

            <p className="text-beer-foam/60 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-body">
              Ekskluzywne piwa z tajemniczym dodatkiem, dostępne tylko dla członków VIP.
              Odkryj smak, którego nie znajdziesz nigdzie indziej!
            </p>
          </motion.div>

          {/* Subscription card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-md mx-auto"
          >
            <div className="glass-card rounded-2xl p-8 border border-beer-gold/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-beer-gold via-beer-amber to-beer-gold" />
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <ShieldCheck className="h-6 w-6 text-beer-gold" />
                <h3 className="font-display text-xl font-bold text-beer-foam">
                  Subskrypcja VIP
                </h3>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-black text-gradient-beer">5 zł</span>
                <span className="text-beer-foam/50 text-lg"> / tydzień</span>
              </div>

              <ul className="text-left space-y-3 mb-8 text-beer-foam/70 text-sm">
                {[
                  "Dostęp do piw z sekretnym składnikiem Fisza",
                  "Ekskluzywne limitowane edycje",
                  "Priorytetowa dostawa",
                  "Badge VIP przy profilu",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-beer-gold flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {subscribed ? (
                <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-semibold">
                  <Sparkles className="h-5 w-5" />
                  Subskrypcja aktywna!
                </div>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  className="w-full bg-gradient-to-r from-beer-gold to-beer-amber text-beer-dark font-bold text-lg py-6 rounded-xl hover:shadow-lg hover:shadow-beer-gold/20 transition-all"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Dołącz do VIP
                </Button>
              )}

              <p className="text-beer-foam/30 text-xs mt-4">
                * Integracja płatności Stripe wkrótce
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VIP Products */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-beer-dark to-beer-brown/20" />
        <div className="relative container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold text-beer-foam text-center mb-12"
          >
            Ekskluzywne Piwa <span className="text-gradient-beer">VIP</span> 🍺
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <AnimatePresence>
              {vipProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -8 }}
                  className="relative group"
                >
                  <div className="glass-card rounded-2xl overflow-hidden border border-beer-gold/20 hover:border-beer-gold/40 transition-all">
                    {/* Lock overlay */}
                    {!subscribed && (
                      <div className="absolute inset-0 z-10 bg-beer-dark/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                          <Lock className="h-10 w-10 text-beer-gold mx-auto mb-2" />
                          <p className="text-beer-foam/70 text-sm font-semibold">
                            Wymagana subskrypcja VIP
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative h-56 overflow-hidden bg-gradient-to-b from-beer-amber/10 to-transparent">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-beer-gold/90 text-beer-dark text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Crown className="h-3 w-3" /> VIP
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold text-beer-foam mb-1">
                        {product.name}
                      </h3>
                      <p className="text-beer-foam/50 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-beer-gold font-bold text-xl">
                          {product.price.toFixed(2)} zł
                        </span>
                        <span className="text-beer-foam/40 text-xs bg-beer-amber/10 px-2 py-1 rounded-full">
                          {product.abv}% ABV
                        </span>
                      </div>

                      <div className="text-beer-foam/40 text-xs italic mb-4 flex items-start gap-1">
                        <Sparkles className="h-3 w-3 flex-shrink-0 mt-0.5 text-beer-gold/50" />
                        {product.funFact}
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={!subscribed}
                        className="w-full bg-gradient-to-r from-beer-gold to-beer-amber text-beer-dark font-bold rounded-xl hover:shadow-lg hover:shadow-beer-gold/20 transition-all disabled:opacity-50"
                      >
                        Do koszyka 🐟
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VipPage;
