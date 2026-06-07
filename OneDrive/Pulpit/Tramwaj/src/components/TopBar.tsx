/**
 * TopBar — mobile-first header bar.
 * - Mobile: just logo + theme toggle (nav is in BottomNav)
 * - Desktop: logo + full nav links + theme toggle
 */
import { NavLink, Link, useLocation } from "react-router-dom";
import { Home, Navigation, TrainFront, Map, ArrowLeftRight } from "lucide-react";
import duckLogo from "@/assets/duck-logo.png";
import ThemeToggle from "@/components/ThemeToggle";

const desktopTabs = [
  { to: "/",           label: "Start",       icon: Home },
  { to: "/polaczenia", label: "Połączenia",  icon: Navigation },
  { to: "/linie",      label: "Linie",       icon: TrainFront },
  { to: "/mapa",       label: "Mapa",        icon: Map },
] as const;

interface TopBarProps {
  /** Optional title override (e.g. on route detail pages) */
  title?: string;
  /** Show back button */
  backTo?: string;
}

export default function TopBar({ title, backTo }: TopBarProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/60"
      style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Back button */}
        {backTo && (
          <Link to={backTo}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted transition-colors text-foreground -ml-1 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}

        {/* Logo / title */}
        {title ? (
          <h1 className="font-heading font-bold text-base text-foreground flex-1 truncate">{title}</h1>
        ) : (
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={duckLogo} alt="KaczTransit" width={32} height={32} className="rounded-lg" />
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              Kacz<span className="text-primary">Transit</span>
            </span>
          </Link>
        )}

        {/* Desktop nav (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {desktopTabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <NavLink key={to} to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </NavLink>
            );
          })}
          <NavLink to="/compare"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === "/compare" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}>
            <ArrowLeftRight size={16} /> Porównaj
          </NavLink>
        </nav>

        <div className="flex-1 md:flex-none" />
        <ThemeToggle />
      </div>
    </header>
  );
}
