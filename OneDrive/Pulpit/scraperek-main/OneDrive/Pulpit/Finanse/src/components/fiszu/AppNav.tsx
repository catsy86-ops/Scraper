import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogIn, LogOut, Search } from "lucide-react";
import { Logo } from "@/components/fiszu/Logo";
import { ThemeToggle } from "@/components/fiszu/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { GlobalSearch } from "@/components/fiszu/GlobalSearch";

const NAV_LINKS = [
  { to: "/", label: "Pulpit" },
  { to: "/symulator", label: "Symulator" },
  { to: "/transakcje", label: "Transakcje" },
  { to: "/budzet", label: "Budżet" },
  { to: "/cele", label: "Cele" },
  { to: "/raporty", label: "Raporty" },
] as const;

export function AppNav() {
  const { user } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "FS";
  const [searchOpen, setSearchOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Wylogowano");
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/50 px-1.5 py-1.5 md:flex">
            {NAV_LINKS.map(({ to, label }) => {
              const active = currentPath === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground sm:flex"
              aria-label="Szukaj (Ctrl+K)"
              title="Szukaj (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </button>

            <ThemeToggle />

            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
              aria-label="Powiadomienia"
            >
              <Bell className="h-4 w-4" />
            </button>

            {user ? (
              <>
                <div
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.78_0.17_165)] to-[oklch(0.72_0.15_200)] font-display text-sm font-bold text-primary-foreground"
                  title={user.email ?? ""}
                >
                  {initials}
                </div>
                <button
                  onClick={signOut}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Wyloguj"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[oklch(0.78_0.17_165)] to-[oklch(0.72_0.15_200)] px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <LogIn className="h-3.5 w-3.5" />
                Zaloguj
              </Link>
            )}
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
