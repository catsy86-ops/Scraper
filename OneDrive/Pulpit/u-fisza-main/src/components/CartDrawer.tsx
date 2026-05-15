import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, CreditCard, Gift, Sparkles, Tag, BadgePercent, AlertTriangle, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AVAILABLE_COUPONS } from "@/stores/cartStore";
import CouponTimer from "@/components/CouponTimer";
import { getOrderWisdom } from "@/lib/fiszWisdoms";
import { addStamp } from "@/stores/loyaltyStore";

const FREE_DELIVERY_THRESHOLD = 100;

const CartDrawer = () => {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, clearCart, subtotal, discount, total, coupon, applyCoupon, removeCoupon, lastInvalidated, dismissInvalidated, reapplyLastInvalidated, markCouponUsed } =
    useCartStore();
  const validateCoupon = useCartStore((s) => s.validateCoupon);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [showCoupons, setShowCoupons] = useState(false);

  // Reactive safety net: re-validate the active coupon whenever cart contents
  // change while the drawer is mounted. Covers any edge case where items are
  // mutated outside the store's add/remove/update actions.
  useEffect(() => {
    if (coupon) validateCoupon();
  }, [items, coupon, validateCoupon]);

  // One-click reapply prompt: when a coupon was invalidated due to minTotal
  // and the user later reaches the threshold again, surface a toast with an
  // action button — even if the inline banner was dismissed.
  const [promptedReapplyKey, setPromptedReapplyKey] = useState<string | null>(null);
  useEffect(() => {
    if (!lastInvalidated || coupon) return;
    if (lastInvalidated.reason !== "minTotal") return;
    const c = lastInvalidated.coupon;
    if (c.expiresAt && Date.now() >= c.expiresAt) return;
    const sub = subtotal();
    if (!c.minTotal || sub < c.minTotal) return;
    const key = `${c.code}:${lastInvalidated.at}`;
    if (promptedReapplyKey === key) return;
    setPromptedReapplyKey(key);
    toast.success(`Próg ${c.minTotal} zł osiągnięty — przywróć kod ${c.code}?`, {
      action: {
        label: "Przywróć",
        onClick: () => {
          const r = reapplyLastInvalidated();
          if (r.ok) toast.success(r.message);
          else toast.error(r.message);
        },
      },
      duration: 8000,
    });
  }, [items, lastInvalidated, coupon, subtotal, reapplyLastInvalidated, promptedReapplyKey]);

  if (!isOpen) return null;

  const cartSubtotal = subtotal();
  const cartDiscount = discount();
  const cartTotal = total();

  const handleApplyCoupon = (codeOverride?: string) => {
    const code = codeOverride ?? couponInput;
    const result = applyCoupon(code);
    if (result.ok) {
      toast.success(result.message);
      setCouponInput("");
      setShowCoupons(false);
    } else {
      toast.error(result.message);
    }
  };

  const deliveryProgress = Math.min((cartTotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const freeDelivery = cartTotal >= FREE_DELIVERY_THRESHOLD;


  const handleOrder = async () => {
    if (items.length === 0) { toast.error("Koszyk jest pusty! 🐟"); return; }
    if (!user) { toast.error("Musisz być zalogowany!"); toggleCart(); navigate("/auth"); return; }
    if (!address.trim()) { toast.error("Podaj adres dostawy!"); return; }

    // Twarda re-walidacja kuponu tuż przed złożeniem zamówienia.
    // Chroni przed sytuacją, gdy koszyk leżał otwarty długo (kupon wygasł)
    // lub minimum przestało być spełnione bez interakcji z koszykiem.
    if (coupon) {
      if (coupon.expiresAt && Date.now() >= coupon.expiresAt) {
        validateCoupon();
        toast.error(`Kod ${coupon.code} wygasł ⏰ — sprawdź podsumowanie i spróbuj ponownie`);
        return;
      }
      if (coupon.minTotal && cartSubtotal < coupon.minTotal) {
        validateCoupon();
        const missing = (coupon.minTotal - cartSubtotal).toFixed(2);
        toast.error(
          `Kod ${coupon.code} wymaga min. ${coupon.minTotal} zł (brakuje ${missing} zł) — nie można złożyć zamówienia`
        );
        return;
      }
    }

    setOrdering(true);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ user_id: user.id, total: cartTotal, delivery_address: address, delivery_city: city, delivery_postal_code: postalCode })
      .select().single();

    if (orderError || !order) { toast.error("Błąd zamówienia 😢"); setOrdering(false); return; }

    const orderItems = items.map((item) => ({
      order_id: order.id, product_id: item.product.id, product_name: item.product.name,
      quantity: item.quantity, price: item.product.price,
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) { toast.error("Błąd zapisu produktów 😢"); setOrdering(false); return; }

    const wisdom = getOrderWisdom();
    // Mark coupon as used and add loyalty stamp
    if (coupon) markCouponUsed();
    const milestone = addStamp();
    toast.success(
      coupon
        ? `Zamówienie złożone z rabatem ${cartDiscount.toFixed(2)} zł! 📦🐟`
        : "Zamówienie złożone! Fisz pakuje paczkę 📦🐟",
      { description: `🐟 Mądrość Fisza: ${wisdom}`, duration: 6000 }
    );
    if (milestone) {
      setTimeout(() => {
        toast(`${milestone.emoji} ${milestone.title}!`, {
          description: `${milestone.description}\nNagroda: ${milestone.reward}`,
          duration: 8000,
        });
      }, 1500);
    }
    clearCart(); setAddress(""); setCity(""); setPostalCode(""); setOrdering(false); toggleCart();
  };


  return (
    <>
      <motion.div
        className="fixed inset-0 bg-beer-dark/60 backdrop-blur-md z-50"
        onClick={toggleCart}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card" />
        <div className="absolute inset-0 border-l border-beer-gold/10" />

        {/* Decorative glow */}
        <motion.div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-beer-gold/8 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2.5 rounded-xl bg-gradient-to-br from-beer-amber/15 to-beer-gold/10 border border-beer-gold/10"
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              <ShoppingBag className="h-5 w-5 text-beer-amber" />
            </motion.div>
            <div>
              <h2 className="font-display text-xl font-bold">Koszyk</h2>
              <AnimatePresence mode="wait">
                {items.length > 0 && (
                  <motion.p
                    key={items.length}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-xs text-muted-foreground"
                  >
                    {items.length} {items.length === 1 ? "produkt" : items.length < 5 ? "produkty" : "produktów"}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <motion.button
            onClick={toggleCart}
            className="p-2 rounded-xl hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Free delivery progress */}
        {items.length > 0 && (
          <motion.div
            className="relative px-5 py-3 border-b border-border/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {freeDelivery ? (
                  <>
                    <Gift className="h-3.5 w-3.5 text-beer-hop" />
                    <span className="text-beer-hop font-semibold">Darmowa dostawa! 🎉</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-3.5 w-3.5 text-beer-amber" />
                    Brakuje <span className="font-bold text-foreground">{(FREE_DELIVERY_THRESHOLD - cartTotal).toFixed(0)} zł</span> do darmowej dostawy
                  </>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${freeDelivery ? "bg-beer-hop" : "bg-gradient-to-r from-beer-amber to-beer-gold"}`}
                initial={{ width: 0 }}
                animate={{ width: `${deliveryProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        <div className="relative flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <motion.div
              className="text-center text-muted-foreground py-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
            >
              <motion.div
                className="relative inline-block mb-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-beer-amber/10 rounded-full blur-2xl scale-[2]" />
                <span className="relative text-7xl block">🐟</span>
              </motion.div>
              <p className="font-display text-xl mb-2 text-foreground">Koszyk jest pusty!</p>
              <p className="text-sm max-w-[200px] mx-auto">Fisz czeka na Twoje zamówienie...</p>
              <motion.button
                onClick={toggleCart}
                className="mt-6 px-6 py-2.5 rounded-xl btn-beer font-semibold text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Przeglądaj produkty 🍺
              </motion.button>
            </motion.div>
          ) : (
            <>
              <AnimatePresence>
                {items.map((item, index) => {
                  const lineTotal = item.product.price * item.quantity;
                  const lineShare = cartSubtotal > 0 ? lineTotal / cartSubtotal : 0;
                  const lineDiscount = cartDiscount * lineShare;
                  const lineFinal = lineTotal - lineDiscount;
                  return (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, x: 60, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -60, scale: 0.9, height: 0, marginBottom: 0, padding: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                    className="group flex gap-4 bg-card/80 p-4 rounded-2xl border border-border/40 hover:border-beer-gold/20 hover:bg-card transition-all duration-300 hover:shadow-[0_4px_20px_-4px_hsl(var(--beer-gold)/0.1)]"
                  >
                    <div className="h-20 w-16 rounded-xl bg-gradient-to-b from-beer-foam/50 to-muted/30 flex items-center justify-center shrink-0 border border-border/30 overflow-hidden group-hover:border-beer-gold/15 transition-colors">
                      <motion.img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-16 w-auto object-contain"
                        whileHover={{ scale: 1.1, rotate: 3 }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground truncate text-sm group-hover:text-beer-amber transition-colors">{item.product.name}</h3>
                      <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                        {lineDiscount > 0 ? (
                          <>
                            <span className="text-beer-hop font-bold text-sm">{lineFinal.toFixed(2)} zł</span>
                            <span className="text-muted-foreground line-through text-xs">{lineTotal.toFixed(2)} zł</span>
                          </>
                        ) : (
                          <span className="text-beer-amber font-bold text-sm">{lineTotal.toFixed(2)} zł</span>
                        )}
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground font-normal text-[11px]">
                            ({item.product.price.toFixed(2)} × {item.quantity})
                          </span>
                        )}
                      </div>
                      {lineDiscount > 0 && coupon && (
                        <motion.p
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] text-beer-hop font-medium mt-0.5 flex items-center gap-1"
                        >
                          <BadgePercent className="h-2.5 w-2.5" />
                          −{lineDiscount.toFixed(2)} zł rabatu z {coupon.code}
                        </motion.p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <motion.button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 rounded-lg bg-muted/70 hover:bg-beer-amber/15 hover:text-beer-amber border border-transparent hover:border-beer-amber/20 transition-all"
                          whileTap={{ scale: 0.75 }}
                        >
                          <Minus className="h-3 w-3" />
                        </motion.button>
                        <motion.span
                          key={item.quantity}
                          initial={{ scale: 1.5, color: "hsl(var(--beer-amber))" }}
                          animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                          className="font-bold text-sm w-7 text-center"
                        >
                          {item.quantity}
                        </motion.span>
                        <motion.button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1.5 rounded-lg bg-muted/70 hover:bg-beer-amber/15 hover:text-beer-amber border border-transparent hover:border-beer-amber/20 transition-all"
                          whileTap={{ scale: 0.75 }}
                        >
                          <Plus className="h-3 w-3" />
                        </motion.button>
                        <motion.button
                          onClick={() => removeItem(item.product.id)}
                          className="ml-auto p-1.5 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-transparent hover:border-destructive/15"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.8 }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </AnimatePresence>

              <motion.div
                className="border-t border-border/40 pt-5 space-y-3 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 text-foreground">
                  <Truck className="h-4 w-4 text-beer-amber" />
                  <h3 className="font-display font-bold text-sm">Adres dostawy</h3>
                </div>
                <input type="text" placeholder="Ulica i numer" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background/80 text-foreground text-sm focus:ring-2 focus:ring-beer-amber/30 focus:border-beer-amber/40 outline-none transition-all" />
                <div className="flex gap-2">
                  <input type="text" placeholder="Miasto" value={city} onChange={(e) => setCity(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-input bg-background/80 text-foreground text-sm focus:ring-2 focus:ring-beer-amber/30 focus:border-beer-amber/40 outline-none transition-all" />
                  <input type="text" placeholder="Kod" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                    className="w-24 px-4 py-3 rounded-xl border border-input bg-background/80 text-foreground text-sm focus:ring-2 focus:ring-beer-amber/30 focus:border-beer-amber/40 outline-none transition-all" />
                </div>
              </motion.div>

              {/* Checkout summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-t border-border/40 pt-5 mt-4"
              >
                <div className="flex items-center gap-2 text-foreground mb-3">
                  <CreditCard className="h-4 w-4 text-beer-amber" />
                  <h3 className="font-display font-bold text-sm">Podsumowanie zamówienia</h3>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-card via-muted/30 to-card border border-border/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Suma częściowa</span>
                    <span className="font-semibold text-foreground">{cartSubtotal.toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      Dostawa
                    </span>
                    <span className={`font-semibold ${freeDelivery ? "text-beer-hop" : "text-foreground"}`}>
                      {freeDelivery ? "GRATIS" : "wg cennika"}
                    </span>
                  </div>
                  <AnimatePresence>
                    {coupon && cartDiscount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-sm overflow-hidden"
                      >
                        <span className="flex items-center gap-1 text-beer-hop font-medium">
                          <BadgePercent className="h-3.5 w-3.5" />
                          Rabat ({coupon.code})
                        </span>
                        <span className="font-bold text-beer-hop">−{cartDiscount.toFixed(2)} zł</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {coupon && cartDiscount === 0 && coupon.minTotal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-2"
                    >
                      Kod {coupon.code} wymaga min. {coupon.minTotal} zł — dodaj jeszcze {(coupon.minTotal - cartSubtotal).toFixed(2)} zł
                    </motion.div>
                  )}
                  <div className="flex justify-between items-end pt-3 border-t border-border/50">
                    <span className="font-display font-bold text-foreground">Do zapłaty</span>
                    <motion.div
                      key={cartTotal}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-right"
                    >
                      <span className="font-display text-2xl font-bold text-beer-amber">{cartTotal.toFixed(2)}</span>
                      <span className="text-beer-amber font-bold ml-1">zł</span>
                    </motion.div>
                  </div>
                  {cartDiscount > 0 && (
                    <p className="text-[11px] text-beer-hop text-right font-medium">
                      Oszczędzasz {cartDiscount.toFixed(2)} zł! 🎉
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Coupon section */}
              <motion.div
                className="border-t border-border/40 pt-5 space-y-3 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <BadgePercent className="h-4 w-4 text-beer-hop" />
                    <h3 className="font-display font-bold text-sm">Kod rabatowy</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {(coupon || lastInvalidated) && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          validateCoupon();
                          const { coupon: c, lastInvalidated: inv, reapplyLastInvalidated } =
                            useCartStore.getState();
                          if (c) {
                            toast.success(`Kod ${c.code} jest aktywny ✅`);
                            return;
                          }
                          if (inv) {
                            const r = reapplyLastInvalidated();
                            if (r.ok) toast.success(r.message);
                            else toast.info(r.message);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-beer-hop hover:text-beer-hop/80 font-medium"
                        title="Odśwież walidację i spróbuj przywrócić kod"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Odśwież kupon
                      </motion.button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCoupons((v) => !v)}
                      className="text-[11px] text-beer-amber hover:underline font-medium"
                    >
                      {showCoupons ? "Ukryj" : "Zobacz dostępne"}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {lastInvalidated && !coupon && (() => {
                    const inv = lastInvalidated;
                    const sub = cartSubtotal;
                    const minTotal = inv.coupon.minTotal;
                    const expiredNow = inv.reason === "expired" || (!!inv.coupon.expiresAt && Date.now() >= inv.coupon.expiresAt);
                    const canReapply =
                      !expiredNow &&
                      sub > 0 &&
                      (!minTotal || sub >= minTotal);
                    const missing = minTotal ? Math.max(0, minTotal - sub) : 0;

                    const title =
                      inv.reason === "expired"
                        ? `Kod ${inv.coupon.code} wygasł`
                        : inv.reason === "emptyCart"
                        ? `Kod ${inv.coupon.code} usunięty`
                        : `Kod ${inv.coupon.code} unieważniony`;

                    const detail =
                      inv.reason === "expired"
                        ? "Czas na wykorzystanie tego kodu minął ⏰"
                        : inv.reason === "emptyCart"
                        ? "Koszyk został opróżniony, kod nie jest już aktywny."
                        : minTotal
                        ? canReapply
                          ? `Warunek ${minTotal} zł jest teraz spełniony — możesz przywrócić kod!`
                          : `Wymaga min. ${minTotal} zł — brakuje jeszcze ${missing.toFixed(2)} zł.`
                        : "Warunki kodu nie są już spełnione.";

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className={`overflow-hidden rounded-xl border p-3 ${
                          canReapply
                            ? "bg-beer-hop/5 border-beer-hop/30"
                            : "bg-destructive/5 border-destructive/25"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                              canReapply ? "bg-beer-hop/15 text-beer-hop" : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {expiredNow ? <Clock className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-xs font-bold ${canReapply ? "text-beer-hop" : "text-destructive"}`}>
                                {title}
                              </p>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  inv.reason === "expired"
                                    ? "bg-beer-gold/20 text-beer-gold"
                                    : inv.reason === "emptyCart"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-destructive/15 text-destructive"
                                }`}
                                title="Powód unieważnienia kuponu"
                              >
                                {inv.reason === "expired"
                                  ? "expired"
                                  : inv.reason === "emptyCart"
                                  ? "emptyCart"
                                  : "minTotal"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60">
                                <span className="opacity-70">Koszyk w chwili unieważnienia:</span>
                                <strong className="text-foreground tabular-nums">
                                  {inv.subtotalAtInvalidation.toFixed(2)} zł
                                </strong>
                              </span>
                              {minTotal && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60">
                                  <span className="opacity-70">Wymagane:</span>
                                  <strong className="text-foreground tabular-nums">{minTotal.toFixed(2)} zł</strong>
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60">
                                <span className="opacity-70">Teraz:</span>
                                <strong className="text-foreground tabular-nums">{sub.toFixed(2)} zł</strong>
                              </span>
                            </div>

                            {!canReapply && !expiredNow && minTotal && (
                              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-destructive/60 rounded-full"
                                  initial={false}
                                  animate={{ width: `${Math.min((sub / minTotal) * 100, 100)}%` }}
                                  transition={{ duration: 0.4 }}
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2.5">
                              {canReapply && (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const r = reapplyLastInvalidated();
                                    if (r.ok) toast.success(r.message);
                                    else toast.error(r.message);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-beer-hop text-beer-dark text-[11px] font-bold hover:bg-beer-hop/90 transition-colors"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Przywróć kod
                                </motion.button>
                              )}
                              <button
                                onClick={dismissInvalidated}
                                className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                              >
                                Zamknij
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {coupon ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-beer-hop/10 border border-beer-hop/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="h-4 w-4 text-beer-hop shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground">{coupon.code}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{coupon.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { removeCoupon(); toast.info("Kod usunięty"); }}
                        className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {coupon.expiresAt && (
                      <CouponTimer expiresAt={coupon.expiresAt} variant="card" />
                    )}
                    {coupon.minTotal && (() => {
                      const missing = coupon.minTotal - cartSubtotal;
                      const progress = Math.min((cartSubtotal / coupon.minTotal) * 100, 100);
                      const ok = missing <= 0;
                      return (
                        <motion.div
                          layout
                          className={`p-2.5 rounded-xl border text-[11px] ${
                            ok
                              ? "bg-beer-hop/5 border-beer-hop/20 text-beer-hop"
                              : "bg-destructive/5 border-destructive/20 text-destructive"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 font-medium">
                            <span>
                              {ok
                                ? `✓ Warunek spełniony (min. ${coupon.minTotal} zł)`
                                : `Brakuje ${missing.toFixed(2)} zł do aktywacji`}
                            </span>
                            <span className="tabular-nums">
                              {cartSubtotal.toFixed(2)} / {coupon.minTotal} zł
                            </span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${ok ? "bg-beer-hop" : "bg-destructive/60"}`}
                              initial={false}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Wpisz kod (np. FISZ10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="flex-1 px-4 py-3 rounded-xl border border-input bg-background/80 text-foreground text-sm focus:ring-2 focus:ring-beer-hop/30 focus:border-beer-hop/40 outline-none transition-all uppercase"
                    />
                    <motion.button
                      onClick={() => handleApplyCoupon()}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-3 rounded-xl bg-beer-hop/15 hover:bg-beer-hop/25 text-beer-hop font-bold text-sm border border-beer-hop/30 transition-colors"
                    >
                      Aktywuj
                    </motion.button>
                  </div>
                )}

                <AnimatePresence>
                  {showCoupons && !coupon && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1.5"
                    >
                      {AVAILABLE_COUPONS.map((c) => {
                        const expired = !!c.expiresAt && Date.now() >= c.expiresAt;
                        const eligible = !expired && (!c.minTotal || cartSubtotal >= c.minTotal);
                        const missing = c.minTotal ? c.minTotal - cartSubtotal : 0;
                        return (
                          <button
                            key={c.code}
                            onClick={() => handleApplyCoupon(c.code)}
                            disabled={!eligible}
                            className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-lg border text-left group transition-all ${
                              eligible
                                ? "bg-muted/40 hover:bg-beer-hop/10 border-border/30 hover:border-beer-hop/30"
                                : "bg-muted/20 border-border/20 opacity-70 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Tag className="h-3.5 w-3.5 text-beer-hop shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-xs text-foreground">{c.code}</p>
                                  {c.expiresAt && <CouponTimer expiresAt={c.expiresAt} variant="inline" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{c.description}</p>
                              </div>
                            </div>
                            {eligible ? (
                              <span className="text-[10px] text-beer-amber font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Użyj →</span>
                            ) : (
                              <span className="text-[10px] text-destructive/80 font-semibold whitespace-nowrap">
                                +{missing.toFixed(2)} zł
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <motion.div
            className="relative p-5 border-t border-border/40 space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {/* Glow above footer */}
            <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Suma częściowa</span>
                <span className="font-semibold text-foreground">{cartSubtotal.toFixed(2)} zł</span>
              </div>
              {cartDiscount > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="flex items-center gap-1 text-beer-hop">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Rabat ({coupon?.code})
                  </span>
                  <span className="font-semibold text-beer-hop">−{cartDiscount.toFixed(2)} zł</span>
                </motion.div>
              )}
              <div className="flex justify-between items-end pt-1.5 border-t border-border/40">
                <div>
                  <span className="text-xs text-muted-foreground block">Do zapłaty</span>
                  <span className="font-display text-lg font-bold">Razem:</span>
                </div>
                <motion.div
                  key={cartTotal}
                  initial={{ scale: 1.3, y: -5 }}
                  animate={{ scale: 1, y: 0 }}
                  className="text-right"
                >
                  <span className="font-display text-3xl font-bold text-beer-amber">{cartTotal.toFixed(2)}</span>
                  <span className="text-beer-amber font-bold text-lg ml-1">zł</span>
                </motion.div>
              </div>
            </div>

            <motion.button
              onClick={handleOrder}
              disabled={ordering}
              className="w-full py-4 rounded-xl btn-beer font-bold text-lg disabled:opacity-50 glow-amber flex items-center justify-center gap-2 relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {ordering ? (
                <>
                  <motion.div
                    className="h-5 w-5 border-2 border-beer-dark/30 border-t-beer-dark rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Składanie zamówienia...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Zamów teraz! 🎉
                  <motion.div
                    className="absolute right-4"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                </>
              )}
            </motion.button>

            <p className="text-center text-[11px] text-muted-foreground/60">
              🔒 Bezpieczne płatności • Dostawa 24h
            </p>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default CartDrawer;
