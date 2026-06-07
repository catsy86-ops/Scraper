/**
 * BottomNav — native-style bottom navigation bar for mobile.
 * On desktop it transforms into a compact sidebar-style top bar addition.
 * Uses safe-area-inset-bottom for notch phones.
 */
import { NavLink, useLocation } from "react-router-dom";
import { Home, Navigation, TrainFront, Map } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { to: "/",          label: "Start",       icon: Home },
  { to: "/polaczenia", label: "Połączenia",  icon: Navigation },
  { to: "/linie",      label: "Linie",       icon: TrainFront },
  { to: "/mapa",       label: "Mapa",        icon: Map },
] as const;

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* blur glass background */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative min-w-0 select-none"
                aria-label={label}
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                  <Icon
                    size={22}
                    className={active ? "text-primary" : "text-muted-foreground"}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                </motion.div>
                <span className={`text-[10px] font-medium leading-tight ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
