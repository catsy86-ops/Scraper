import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Lock, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/components/ui/use-toast";

interface LinkAccountBannerProps {
  isAnonymous: boolean;
}

const LinkAccountBanner = ({ isAnonymous }: LinkAccountBannerProps) => {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  if (!isAnonymous || dismissed) return null;

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      toast({ title: "Błąd", description: "Hasło musi mieć min. 6 znaków", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;
      toast({ title: "Konto powiązane!", description: "Twoje konto gościa zostało powiązane z adresem email." });
      setExpanded(false);
    } catch (error: any) {
      const msg = error?.message ?? "";
      const code = error?.code ?? error?.status ?? "";
      let description = msg;
      let hint = "";

      if (msg.includes("hook") || msg.includes("confirm")) {
        description = "Błąd po stronie serwera (hook/confirm).";
        hint = "Sprawdź konfigurację Auth → Hooks i upewnij się, że auto-confirm jest włączony dla konwersji kont anonimowych.";
      } else if (msg.includes("already registered") || msg.includes("already been registered")) {
        description = "Ten adres email jest już zarejestrowany.";
        hint = "Zaloguj się na istniejące konto lub użyj innego adresu email.";
      } else if (msg.includes("email") && msg.includes("invalid")) {
        description = "Nieprawidłowy format adresu email.";
      } else if (msg.includes("password") || msg.includes("weak")) {
        description = "Hasło jest zbyt słabe lub nie spełnia wymagań.";
        hint = "Użyj hasła o min. 6 znakach z literami i cyframi.";
      } else if (msg.includes("rate") || msg.includes("limit")) {
        description = "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.";
      } else if (msg.includes("network") || msg.includes("fetch")) {
        description = "Brak połączenia z serwerem.";
        hint = "Sprawdź swoje połączenie internetowe.";
      }

      console.error("[LinkAccount] Błąd linkowania email:", { message: msg, code, raw: error });
      toast({
        title: "Błąd linkowania konta",
        description: `${description}${hint ? `\n💡 ${hint}` : ""}${code ? ` [${code}]` : ""}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      toast({ title: "Konto powiązane!", description: "Połączono z Google." });
    } catch (error: any) {
      const msg = error?.message ?? String(error);
      console.error("[LinkAccount] Błąd linkowania Google:", { message: msg, raw: error });

      let description = msg;
      if (msg.includes("popup") || msg.includes("closed")) {
        description = "Okno logowania Google zostało zamknięte. Spróbuj ponownie.";
      } else if (msg.includes("redirect") || msg.includes("origin")) {
        description = "Błąd konfiguracji przekierowania OAuth. Sprawdź dozwolone adresy URL.";
      }

      toast({ title: "Błąd linkowania Google", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-lg border border-primary/20 p-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <UserPlus className="w-3.5 h-3.5 text-primary" />
          <span>Jesteś zalogowany jako gość.</span>
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-primary hover:underline font-semibold"
            >
              Powiąż konto
            </button>
          )}
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              <form onSubmit={handleLinkEmail} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full pl-8 pr-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary/50 transition-all"
                      required
                    />
                  </div>
                  <div className="relative flex-1">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Hasło"
                      className="w-full pl-8 pr-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary/50 transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-md gradient-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Powiąż z email
                </button>
              </form>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-mono">lub</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={handleLinkGoogle}
                disabled={loading}
                className="w-full py-2 rounded-md bg-muted/50 border border-border/50 text-foreground text-xs font-mono flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-40"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Powiąż z Google
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LinkAccountBanner;
