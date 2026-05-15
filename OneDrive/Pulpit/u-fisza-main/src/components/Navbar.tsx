import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@/assets/logo-u-fisza.png";
import { ShoppingCart, User, LogOut, Package, UserCircle, Menu, X, Crown, Sparkles, Beer } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { addSecretClick, getSecretClicks } from "@/data/secretProduct";
import { toast } from "sonner";

const navItems = [
  { href: "/#produkty", label: "Produkty", icon: Beer, isLink: false },
  { href: "/#o-nas", label: "O nas", icon: null, isLink: false },
  { href: "/quiz", label: "Quiz 🎲", icon: null, isLink: true },
  { href: "/alkomat", label: "Alkomat 🧪", icon: null, isLink: true },
  { href: "/fisz-vs-ai", label: "Fisz vs AI 🤖", icon: null, isLink: true },
  { href: "/dostawa", label: "Dostawa 🚚", icon: null, isLink: true },
  { href: "/vip", label: "VIP", icon: Crown, isLink: true, highlight: true },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const itemCount = useCartStore((s) => s.itemCount);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMobileOpen(false);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return location.pathname === "/";
    return location.pathname === href;
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-1 bg-beer-dark/90 backdrop-blur-2xl shadow-[0_4px_40px_-4px_hsl(var(--beer-dark)/0.9),0_1px_0_hsl(var(--beer-gold)/0.1)] border-b border-beer-gold/10"
          : "py-2.5 bg-gradient-to-b from-beer-dark/80 to-beer-dark/30 backdrop-blur-xl border-b border-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group" onClick={(e) => {
          const clicks = addSecretClick();
          const remaining = 10 - clicks;
          if (remaining <= 0) {
            window.dispatchEvent(new CustomEvent("fisz-secret-unlocked"));
            toast("👁️ Fisz wyczuł Twoją determinację...", {
              description: "Coś tajemniczego pojawiło się w ofercie...",
              duration: 5000,
            });
          } else if (remaining <= 5 && remaining > 0) {
            toast(`🐟 Jeszcze ${remaining} kliknięć do sekretu...`, {
              duration: 2000,
            });
          }
          closeMenu();
        }}>
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-beer-gold/25 blur-xl scale-[2]"
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.5, 2, 1.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <img
              src={logoImg}
              alt="U Fisza"
              className="relative h-10 w-10 rounded-full ring-2 ring-beer-gold/30 group-hover:ring-beer-gold/60 transition-all duration-300 shadow-[0_0_15px_hsl(var(--beer-gold)/0.2)]"
            />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-gradient-beer leading-none tracking-tight">
              U Fisza
            </span>
            <span className="text-[9px] text-beer-foam/25 tracking-[0.25em] uppercase font-body leading-none mt-0.5">
              Sklep piwny ✦ Szczecin
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5 bg-beer-foam/[0.03] rounded-2xl px-1.5 py-1 border border-beer-foam/[0.04]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Comp = item.isLink ? Link : "a";
            const props = item.isLink ? { to: item.href } : { href: item.href };
            return (
              <Comp
                key={item.href}
                {...(props as any)}
                className={`relative px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all duration-200 flex items-center gap-1.5 group
                  ${item.highlight
                    ? "text-beer-gold hover:text-beer-amber"
                    : active
                      ? "text-beer-foam"
                      : "text-beer-foam/50 hover:text-beer-foam/80"
                  }`}
              >
                {item.icon && <item.icon className="h-3.5 w-3.5" />}
                {item.label}
                {item.highlight && (
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sparkles className="h-3 w-3 text-beer-gold/70" />
                  </motion.div>
                )}
                {active && !item.highlight && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-beer-foam/[0.08] border border-beer-foam/[0.06]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Comp>
            );
          })}
          {user && (
            <>
              {[
                { href: "/zamowienia", label: "Zamówienia", icon: Package },
                { href: "/profil", label: "Profil", icon: UserCircle },
              ].map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`relative px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all duration-200 flex items-center gap-1.5
                      ${active ? "text-beer-foam" : "text-beer-foam/50 hover:text-beer-foam/80"}`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-beer-foam/[0.08] border border-beer-foam/[0.06]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="hidden md:block">
            <NotificationBell />
          </div>
          {/* Auth button — desktop */}
          <div className="hidden md:block">
            {user ? (
              <motion.button
                onClick={handleSignOut}
                className="p-2.5 rounded-xl bg-beer-foam/[0.04] hover:bg-beer-foam/[0.08] border border-beer-foam/[0.06] hover:border-beer-gold/20 transition-all duration-300 group"
                title="Wyloguj się"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="h-4 w-4 text-beer-foam/50 group-hover:text-beer-gold transition-colors" />
              </motion.button>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/auth"
                  className="p-2.5 rounded-xl bg-beer-foam/[0.04] hover:bg-beer-foam/[0.08] border border-beer-foam/[0.06] hover:border-beer-gold/20 transition-all duration-300 block group"
                  title="Zaloguj się"
                >
                  <User className="h-4 w-4 text-beer-foam/50 group-hover:text-beer-gold transition-colors" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* Cart */}
          <motion.button
            onClick={toggleCart}
            className="relative p-2.5 rounded-xl bg-beer-gold/10 hover:bg-beer-gold/20 border border-beer-gold/15 hover:border-beer-gold/30 transition-all duration-300 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart className="h-4.5 w-4.5 text-beer-gold group-hover:text-beer-amber transition-colors" />
            <AnimatePresence>
              {itemCount() > 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-accent text-accent-foreground border-2 border-beer-dark font-bold shadow-[0_0_10px_hsl(var(--accent)/0.5)]">
                    {itemCount()}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Mobile menu toggle */}
          <motion.button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 rounded-xl bg-beer-foam/[0.04] hover:bg-beer-foam/[0.08] border border-beer-foam/[0.06] transition-all"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="h-5 w-5 text-beer-gold" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="h-5 w-5 text-beer-gold" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden"
          >
            <div className="bg-beer-dark/98 backdrop-blur-2xl border-t border-beer-gold/10">
              <div className="container mx-auto px-4 py-6 flex flex-col gap-1">
                {navItems.map((item, i) => {
                  const Comp = item.isLink ? Link : "a";
                  const props = item.isLink ? { to: item.href } : { href: item.href };
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                    >
                      <Comp
                        {...(props as any)}
                        onClick={closeMenu}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                          item.highlight
                            ? "text-beer-gold bg-beer-gold/[0.06] font-bold border border-beer-gold/10"
                            : "text-beer-foam/70 hover:text-beer-foam hover:bg-beer-foam/[0.04]"
                        } font-body text-sm font-semibold`}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        {item.label}
                        {item.highlight && (
                          <motion.div
                            className="ml-auto"
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-beer-gold/60" />
                          </motion.div>
                        )}
                      </Comp>
                    </motion.div>
                  );
                })}
                {user && (
                  <>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.3 }}>
                      <Link to="/zamowienia" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-beer-foam/70 hover:text-beer-foam hover:bg-beer-foam/[0.04] font-body text-sm font-semibold transition-all">
                        <Package className="h-4 w-4" /> Zamówienia
                      </Link>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24, duration: 0.3 }}>
                      <Link to="/profil" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-beer-foam/70 hover:text-beer-foam hover:bg-beer-foam/[0.04] font-body text-sm font-semibold transition-all">
                        <UserCircle className="h-4 w-4" /> Profil
                      </Link>
                    </motion.div>
                  </>
                )}
                <div className="h-px bg-beer-gold/10 my-3" />
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
                  {user ? (
                    <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-beer-foam/40 hover:text-accent font-body text-sm font-semibold transition-all w-full">
                      <LogOut className="h-4 w-4" /> Wyloguj się
                    </button>
                  ) : (
                    <Link to="/auth" onClick={closeMenu} className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-beer-foam/70 hover:text-beer-foam hover:bg-beer-foam/[0.04] font-body text-sm font-semibold transition-all">
                      <User className="h-4 w-4" /> Zaloguj się
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
