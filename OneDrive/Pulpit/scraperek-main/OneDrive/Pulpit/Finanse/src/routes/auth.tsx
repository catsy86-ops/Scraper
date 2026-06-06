import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/fiszu/Logo";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success("Link do resetu hasła wysłany na podany e-mail");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Konto utworzone! Zaloguj się.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Zalogowano");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Nie udało się zalogować przez Google");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="bg-orb bg-orb-1" aria-hidden />
      <div className="bg-orb bg-orb-2" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card relative z-10 w-full max-w-md p-8"
      >
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size={56} withText={false} />
          <h1 className="font-display text-2xl font-bold">
            {mode === "login" ? "Zaloguj się do " : mode === "signup" ? "Dołącz do " : "Reset hasła — "}
            <span className="text-gradient-brand">FISZU</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "reset" ? "Wyślemy Ci link do zresetowania hasła" : "Twoje finanse pod kontrolą"}
          </p>
        </div>

        {mode !== "reset" && (
          <>
            <button
              onClick={google}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2c-.4.4 6.7-4.9 6.7-14.8 0-1.3-.1-2.3-.4-3.5z"/></svg>
              Kontynuuj z Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> lub e-mail <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        {resetSent ? (
          <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-center text-sm text-success">
            Sprawdź skrzynkę e-mail — wysłaliśmy link do resetu hasła.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">E-mail</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
                  placeholder="ty@example.com"
                />
              </div>
            </label>
            {mode !== "reset" && (
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Hasło</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
              </label>
            )}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.78_0.17_165)] to-[oklch(0.72_0.15_200)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Zaloguj się" : mode === "signup" ? "Utwórz konto" : "Wyślij link resetujący"}
            </button>
          </form>
        )}

        {mode === "login" && (
          <p className="mt-3 text-center text-xs">
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              Zapomniałeś hasła?
            </button>
          </p>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? "Nie masz konta? " : mode === "signup" ? "Masz już konto? " : "Wróć do "}
          <button
            type="button"
            onClick={() => { setMode(mode === "signup" ? "login" : mode === "reset" ? "login" : "signup"); setResetSent(false); }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>
        <p className="mt-2 text-center text-xs">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            ← Wróć
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
