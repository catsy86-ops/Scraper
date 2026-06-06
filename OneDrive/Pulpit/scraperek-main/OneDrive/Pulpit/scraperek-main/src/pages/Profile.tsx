import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, ArrowLeft, LogOut, UserPlus, Chrome, Settings, Loader2, Check, X, Lock, Eye, EyeOff, Clock, AlertTriangle, Send, History, RefreshCw, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import type { Session } from "@supabase/supabase-js";
import ThemeToggle from "@/components/ThemeToggle";
import LinkAccountBanner from "@/components/LinkAccountBanner";
import { toast } from "sonner";

const Profile = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Settings state
  const [activeSection, setActiveSection] = useState<"overview" | "email" | "password" | "providers" | "activity" | "report" | "session">("overview");
  const [sessionRefreshing, setSessionRefreshing] = useState(false);
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);
  const [reportSubject, setReportSubject] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [activityLog, setActivityLog] = useState<Array<{ event: string; timestamp: string; icon: typeof Clock; color: string }>>([]);
  const [resendLoading, setResendLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unlinkGoogleLoading, setUnlinkGoogleLoading] = useState(false);
  const [unlinkEmailLoading, setUnlinkEmailLoading] = useState(false);

  // Build activity log from session metadata
  useEffect(() => {
    if (!session) return;
    const u = session.user;
    const events: Array<{ event: string; timestamp: string; icon: typeof Clock; color: string }> = [];
    
    events.push({ event: "Konto utworzone", timestamp: u.created_at, icon: UserPlus, color: "text-green-500" });
    
    if (u.last_sign_in_at) {
      events.push({ event: "Ostatnie logowanie", timestamp: u.last_sign_in_at, icon: Clock, color: "text-primary" });
    }
    if (u.updated_at && u.updated_at !== u.created_at) {
      events.push({ event: "Profil zaktualizowany", timestamp: u.updated_at, icon: Settings, color: "text-blue-500" });
    }
    if (u.email_confirmed_at) {
      events.push({ event: "Email potwierdzony", timestamp: u.email_confirmed_at, icon: Mail, color: "text-green-500" });
    }
    if (u.confirmed_at && u.confirmed_at !== u.email_confirmed_at) {
      events.push({ event: "Konto potwierdzone", timestamp: u.confirmed_at, icon: Check, color: "text-green-500" });
    }

    // Load stored activity from localStorage
    const stored = localStorage.getItem(`activity_log_${u.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Array<{ event: string; timestamp: string }>;
        parsed.forEach(e => events.push({ ...e, icon: History, color: "text-muted-foreground" }));
      } catch {}
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivityLog(events);
  }, [session]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    navigate("/auth");
    return null;
  }

  const user = session.user;
  const isAnonymous = !!user.is_anonymous;
  const email = user.email;
  const provider = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers as string[] | undefined;
  const hasGoogle = providers?.includes("google") || provider === "google";
  const hasEmail = providers?.includes("email") || provider === "email";
  const createdAt = new Date(user.created_at).toLocaleDateString("pl-PL", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const getAuthMethod = () => {
    if (isAnonymous) return { label: "Gość (anonimowy)", icon: User, color: "text-yellow-500" };
    if (hasGoogle && hasEmail) return { label: "Email + Google", icon: Chrome, color: "text-primary" };
    if (hasGoogle) return { label: "Google", icon: Chrome, color: "text-blue-500" };
    return { label: "Email / Hasło", icon: Mail, color: "text-primary" };
  };

  const authMethod = getAuthMethod();

  // Email validation helpers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailTouched = newEmail.length > 0;
  const emailFormatValid = emailRegex.test(newEmail.trim());
  const emailSameAsCurrent = newEmail.trim().toLowerCase() === (email ?? "").toLowerCase();
  const emailTooLong = newEmail.trim().length > 255;
  const emailError = emailTouched
    ? !emailFormatValid ? "Nieprawidłowy format adresu email."
    : emailTooLong ? "Adres email nie może przekraczać 255 znaków."
    : emailSameAsCurrent ? "To jest Twój obecny adres email."
    : null
    : null;
  const emailValid = emailTouched && !emailError;

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("Link potwierdzający wysłany na nowy adres email.");
      setNewEmail("");
      setActiveSection("overview");
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("same")) {
        toast.error("To jest Twój obecny adres email.");
      } else if (msg.includes("already")) {
        toast.error("Ten adres email jest już używany przez inne konto.");
      } else {
        toast.error(msg || "Nie udało się zaktualizować adresu email.");
      }
    } finally {
      setEmailLoading(false);
    }
  };

  // Password validation helpers
  const pwTouched = newPassword.length > 0;
  const pwMinLength = newPassword.length >= 6;
  const pwHasUpper = /[A-Z]/.test(newPassword);
  const pwHasLower = /[a-z]/.test(newPassword);
  const pwHasDigit = /\d/.test(newPassword);
  const pwHasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const pwStrengthChecks = [pwMinLength, pwHasUpper, pwHasLower, pwHasDigit, pwHasSpecial];
  const pwStrengthScore = pwStrengthChecks.filter(Boolean).length; // 0-5
  const pwStrengthLabel = pwStrengthScore <= 1 ? "Bardzo słabe" : pwStrengthScore === 2 ? "Słabe" : pwStrengthScore === 3 ? "Średnie" : pwStrengthScore === 4 ? "Silne" : "Bardzo silne";
  const pwStrengthColor = pwStrengthScore <= 1 ? "bg-destructive" : pwStrengthScore === 2 ? "bg-orange-500" : pwStrengthScore === 3 ? "bg-yellow-500" : pwStrengthScore === 4 ? "bg-green-500" : "bg-green-400";
  const pwMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const pwMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const pwValid = pwMinLength && pwMatch;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwValid) return;
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Hasło zostało zmienione.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setActiveSection("overview");
    } catch (error: any) {
      toast.error(error?.message || "Nie udało się zmienić hasła.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Use Supabase OAuth flow for Google linking
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/profile",
          scopes: "profile email"
        }
      });
      if (error) throw error;
      toast.success("Konto Google powiązane!");
    } catch (error: any) {
      toast.error(error?.message || "Nie udało się powiązać Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!hasEmail) {
      toast.error("Musisz mieć powiązany email, zanim odłączysz Google.");
      return;
    }
    setUnlinkGoogleLoading(true);
    try {
      const { error } = await supabase.auth.unlinkIdentity(
        (user.identities ?? []).find(i => i.provider === "google")!
      );
      if (error) throw error;
      toast.success("Konto Google zostało odłączone.");
      // Refresh session to get updated providers
      await supabase.auth.refreshSession();
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("single identity")) {
        toast.error("Nie można odłączyć jedynego dostawcy logowania.");
      } else {
        toast.error(msg || "Nie udało się odłączyć Google.");
      }
    } finally {
      setUnlinkGoogleLoading(false);
    }
  };

  const handleUnlinkEmail = async () => {
    if (!hasGoogle) {
      toast.error("Musisz mieć powiązane Google, zanim odłączysz email.");
      return;
    }
    setUnlinkEmailLoading(true);
    try {
      const emailIdentity = (user.identities ?? []).find(i => i.provider === "email");
      if (!emailIdentity) throw new Error("Nie znaleziono tożsamości email.");
      const { error } = await supabase.auth.unlinkIdentity(emailIdentity);
      if (error) throw error;
      toast.success("Metoda email/hasło została odłączona.");
      await supabase.auth.refreshSession();
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("single identity")) {
        toast.error("Nie można odłączyć jedynego dostawcy logowania.");
      } else {
        toast.error(msg || "Nie udało się odłączyć email.");
      }
    } finally {
      setUnlinkEmailLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject || !reportMessage) return;
    setReportLoading(true);
    try {
      // Store report locally (could be sent to backend)
      const reports = JSON.parse(localStorage.getItem(`reports_${user.id}`) || "[]");
      reports.push({ subject: reportSubject, message: reportMessage, timestamp: new Date().toISOString() });
      localStorage.setItem(`reports_${user.id}`, JSON.stringify(reports));
      
      // Also log this as activity
      const stored = JSON.parse(localStorage.getItem(`activity_log_${user.id}`) || "[]");
      stored.push({ event: `Zgłoszenie: ${reportSubject}`, timestamp: new Date().toISOString() });
      localStorage.setItem(`activity_log_${user.id}`, JSON.stringify(stored));

      toast.success("Zgłoszenie zostało wysłane. Dziękujemy!");
      setReportSubject("");
      setReportMessage("");
      setActiveSection("overview");
    } catch {
      toast.error("Nie udało się wysłać zgłoszenia.");
    } finally {
      setReportLoading(false);
    }
  };

  const sections = [
    { key: "overview" as const, label: "Przegląd", icon: User },
    { key: "session" as const, label: "Sesja", icon: Monitor },
    { key: "activity" as const, label: "Aktywność", icon: History },
    ...(!isAnonymous ? [
      { key: "email" as const, label: "Email", icon: Mail },
      ...(hasEmail ? [{ key: "password" as const, label: "Hasło", icon: Lock }] : []),
      { key: "providers" as const, label: "Dostawcy", icon: Settings },
    ] : []),
    { key: "report" as const, label: "Zgłoś", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg glass border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Ustawienia konta</h1>
        </motion.div>

        {/* Section tabs */}
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1 bg-muted/30 rounded-lg p-1 overflow-x-auto">
            {sections.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeSection === s.key
                    ? "bg-primary/20 text-primary neon-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <s.icon className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </motion.div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-xl border border-border/50 p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {isAnonymous ? "Użytkownik gość" : email}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">ID: {user.id.slice(0, 8)}…</p>
                </div>
              </div>

              <div className="h-px bg-border/50" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Status konta
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isAnonymous
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      : "bg-green-500/10 text-green-500 border border-green-500/20"
                  }`}>
                    {isAnonymous ? "Gość" : "Pełne konto"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <authMethod.icon className="w-3.5 h-3.5" /> Metoda logowania
                  </span>
                  <span className={`text-xs font-semibold ${authMethod.color}`}>
                    {authMethod.label}
                  </span>
                </div>

                {email && !isAnonymous && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="text-xs text-foreground font-mono">{email}</span>
                  </div>
                )}

                {providers && providers.length > 0 && !isAnonymous && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">Dostawcy</span>
                    <div className="flex gap-1.5">
                      {providers.map((p) => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 border border-border/50 text-muted-foreground font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">Utworzono</span>
                  <span className="text-xs text-muted-foreground font-mono">{createdAt}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* SESSION */}
          {activeSection === "session" && (
            <motion.div key="session" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-xl border border-border/50 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" /> Sesja
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Sesja utworzona
                  </span>
                  <span className="text-xs text-foreground font-mono">
                    {session.expires_at
                      ? new Date((session.expires_at - 3600) * 1000).toLocaleDateString("pl-PL", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })
                      : new Date(user.last_sign_in_at || user.created_at).toLocaleDateString("pl-PL", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Wygasa
                  </span>
                  <span className="text-xs text-foreground font-mono">
                    {session.expires_at
                      ? new Date(session.expires_at * 1000).toLocaleDateString("pl-PL", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Token
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    …{session.access_token?.slice(-12)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border/50" />

              <div className="space-y-2">
                <button
                  onClick={async () => {
                    setSessionRefreshing(true);
                    try {
                      const { error } = await supabase.auth.refreshSession();
                      if (error) throw error;
                      toast.success("Sesja odświeżona pomyślnie.");
                    } catch (err: any) {
                      toast.error(err?.message || "Nie udało się odświeżyć sesji.");
                    } finally {
                      setSessionRefreshing(false);
                    }
                  }}
                  disabled={sessionRefreshing}
                  className="w-full py-2 rounded-lg glass border border-primary/20 text-primary text-xs font-mono flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-40"
                >
                  {sessionRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Odśwież sesję
                </button>

                <button
                  onClick={async () => {
                    setSignOutAllLoading(true);
                    try {
                      const { error } = await supabase.auth.signOut({ scope: "global" });
                      if (error) throw error;
                      toast.success("Wylogowano ze wszystkich urządzeń.");
                      navigate("/");
                    } catch (err: any) {
                      toast.error(err?.message || "Nie udało się wylogować ze wszystkich urządzeń.");
                    } finally {
                      setSignOutAllLoading(false);
                    }
                  }}
                  disabled={signOutAllLoading}
                  className="w-full py-2 rounded-lg glass border border-destructive/20 text-destructive text-xs font-mono flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors disabled:opacity-40"
                >
                  {signOutAllLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  Wyloguj ze wszystkich urządzeń
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground/70">
                „Wyloguj ze wszystkich urządzeń" unieważni wszystkie aktywne sesje, włącznie z tą bieżącą.
              </p>
            </motion.div>
          )}

          {activeSection === "email" && !isAnonymous && (
            <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-xl border border-border/50 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Email
              </h2>

              {/* Verification status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">Status weryfikacji</span>
                </div>
                {user.email_confirmed_at ? (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Potwierdzony
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Niepotwierdzony
                  </span>
                )}
              </div>

              {user.email_confirmed_at && (
                <p className="text-[10px] text-muted-foreground/70">
                  Potwierdzono: {new Date(user.email_confirmed_at).toLocaleDateString("pl-PL", {
                    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}

              {/* Resend verification */}
              {!user.email_confirmed_at && email && (
                <button
                  onClick={async () => {
                    setResendLoading(true);
                    try {
                      const { error } = await supabase.auth.resend({ type: "signup", email });
                      if (error) throw error;
                      toast.success("Link weryfikacyjny został wysłany ponownie na " + email);
                    } catch (err: any) {
                      const msg = err?.message ?? "";
                      if (msg.includes("rate") || msg.includes("limit")) {
                        toast.error("Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.");
                      } else {
                        toast.error(msg || "Nie udało się wysłać linku weryfikacyjnego.");
                      }
                    } finally {
                      setResendLoading(false);
                    }
                  }}
                  disabled={resendLoading}
                  className="w-full py-2 rounded-lg glass border border-primary/20 text-primary text-xs font-mono flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-40"
                >
                  {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Wyślij ponownie link weryfikacyjny
                </button>
              )}

              <div className="h-px bg-border/50" />

              <h3 className="text-xs font-semibold text-foreground">Zmień adres email</h3>
              <p className="text-xs text-muted-foreground">
                Obecny email: <span className="text-foreground font-mono">{email}</span>
              </p>
              <form onSubmit={handleUpdateEmail} className="space-y-3">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Nowy adres email"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted/50 border text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none transition-all ${
                        emailError ? "border-destructive/50 focus:border-destructive" : emailValid ? "border-green-500/50 focus:border-green-500" : "border-border/50 focus:border-primary/50"
                      }`}
                      maxLength={255}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                      <X className="w-3 h-3" /> {emailError}
                    </p>
                  )}
                  {emailValid && (
                    <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" /> Poprawny format email
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={emailLoading || !emailValid}
                    className="flex-1 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {emailLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Zmień email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewEmail(""); setActiveSection("overview"); }}
                    className="px-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-muted-foreground text-xs font-mono hover:text-foreground transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
              <p className="text-[10px] text-muted-foreground/70">
                Na nowy adres zostanie wysłany link potwierdzający. Zmiana nastąpi po kliknięciu w link.
              </p>
            </motion.div>
          )}

          {/* PASSWORD CHANGE */}
          {activeSection === "password" && !isAnonymous && hasEmail && (
            <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-xl border border-border/50 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Zmień hasło
              </h2>
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nowe hasło"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-lg bg-muted/50 border text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none transition-all ${
                        pwTouched && !pwMinLength ? "border-destructive/50" : pwTouched && pwMinLength ? "border-green-500/50" : "border-border/50 focus:border-primary/50"
                      }`}
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {pwTouched && !pwMinLength && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                      <X className="w-3 h-3" /> Hasło musi mieć minimum 6 znaków
                    </p>
                  )}
                </div>

                {/* Password strength meter */}
                {pwTouched && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrengthScore ? pwStrengthColor : "bg-muted/50"}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono ${pwStrengthScore <= 2 ? "text-destructive" : pwStrengthScore === 3 ? "text-yellow-500" : "text-green-500"}`}>
                        {pwStrengthLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { ok: pwMinLength, label: "Min. 6 znaków" },
                        { ok: pwHasUpper, label: "Wielka litera" },
                        { ok: pwHasLower, label: "Mała litera" },
                        { ok: pwHasDigit, label: "Cyfra" },
                        { ok: pwHasSpecial, label: "Znak specjalny" },
                      ].map(r => (
                        <span key={r.label} className={`text-[9px] font-mono flex items-center gap-1 ${r.ok ? "text-green-500" : "text-muted-foreground/60"}`}>
                          {r.ok ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />} {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Potwierdź nowe hasło"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted/50 border text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none transition-all ${
                        pwMismatch ? "border-destructive/50" : pwMatch ? "border-green-500/50" : "border-border/50 focus:border-primary/50"
                      }`}
                      minLength={6}
                    />
                  </div>
                  {pwMismatch && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                      <X className="w-3 h-3" /> Hasła nie są identyczne
                    </p>
                  )}
                  {pwMatch && (
                    <p className="text-[10px] text-green-500 flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" /> Hasła są identyczne
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={passwordLoading || !pwValid}
                    className="flex-1 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {passwordLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Zmień hasło
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewPassword(""); setConfirmPassword(""); setActiveSection("overview"); }}
                    className="px-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-muted-foreground text-xs font-mono hover:text-foreground transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* PROVIDERS */}
          {activeSection === "providers" && !isAnonymous && (
            <motion.div key="providers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-xl border border-border/50 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" /> Dostawcy logowania
              </h2>
              <p className="text-xs text-muted-foreground">
                Zarządzaj metodami logowania powiązanymi z Twoim kontem.
              </p>

              <div className="space-y-3">
                {/* Email provider */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Email / Hasło</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {hasEmail ? email : "Nie powiązano"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      hasEmail
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : "bg-muted/50 text-muted-foreground border border-border/50"
                    }`}>
                      {hasEmail ? "Aktywny" : "Brak"}
                    </span>
                    {hasEmail && hasGoogle && (
                      <button
                        onClick={handleUnlinkEmail}
                        disabled={unlinkEmailLoading}
                        className="text-[10px] px-3 py-1 rounded-md bg-destructive/10 text-destructive font-mono hover:bg-destructive/20 transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        {unlinkEmailLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                        Odłącz
                      </button>
                    )}
                  </div>
                </div>

                {/* Google provider */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Google</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {hasGoogle ? "Powiązano" : "Nie powiązano"}
                      </p>
                    </div>
                  </div>
                  {hasGoogle ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-green-500/10 text-green-500 border border-green-500/20">
                        Aktywny
                      </span>
                      {hasEmail && (
                        <button
                          onClick={handleUnlinkGoogle}
                          disabled={unlinkGoogleLoading}
                          className="text-[10px] px-3 py-1 rounded-md bg-destructive/10 text-destructive font-mono hover:bg-destructive/20 transition-colors disabled:opacity-40 flex items-center gap-1"
                        >
                          {unlinkGoogleLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          Odłącz
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleLinkGoogle}
                      disabled={googleLoading}
                      className="text-[10px] px-3 py-1 rounded-md bg-primary/10 text-primary font-mono hover:bg-primary/20 transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      {googleLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      Powiąż
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ACTIVITY LOG */}
          {activeSection === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-xl border border-border/50 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Historia aktywności
              </h2>
              <p className="text-xs text-muted-foreground">
                Ostatnie zdarzenia powiązane z Twoim kontem.
              </p>

              {activityLog.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 text-center py-4 font-mono">Brak zdarzeń</p>
              ) : (
                <div className="space-y-1">
                  {activityLog.map((entry, i) => {
                    const Icon = entry.icon;
                    const date = new Date(entry.timestamp).toLocaleDateString("pl-PL", {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    });
                    return (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                        <div className={`mt-0.5 w-6 h-6 rounded-md bg-muted/30 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-3 h-3 ${entry.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{entry.event}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* REPORT PROBLEM */}
          {activeSection === "report" && (
            <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-xl border border-border/50 p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" /> Zgłoś problem
              </h2>
              <p className="text-xs text-muted-foreground">
                Opisz problem lub prześlij sugestię — postaramy się pomóc.
              </p>

              <form onSubmit={handleReport} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    placeholder="Temat zgłoszenia"
                    className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary/50 transition-all"
                    required
                  />
                </div>
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Opisz problem szczegółowo..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary/50 transition-all resize-none"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={reportLoading || !reportSubject || !reportMessage}
                    className="flex-1 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {reportLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Wyślij zgłoszenie
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReportSubject(""); setReportMessage(""); setActiveSection("overview"); }}
                    className="px-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-muted-foreground text-xs font-mono hover:text-foreground transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </form>

              <div className="h-px bg-border/50" />
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Możesz też napisać na: support@scraperek.app
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Link account banner for guests */}
        {isAnonymous && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <LinkAccountBanner isAnonymous={true} />
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
          {isAnonymous && (
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-2.5 rounded-lg glass border border-primary/20 text-primary text-xs font-mono flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Utwórz pełne konto
            </button>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
            className="w-full py-2.5 rounded-lg glass border border-destructive/20 text-destructive text-xs font-mono flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Wyloguj się
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
