import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logoImg from "@/assets/logo-u-fisza.png";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Zalogowano! 🐟");
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Konto utworzone! Sprawdź email aby potwierdzić 📧");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImg} alt="U Fisza" className="mx-auto h-24 w-24 mb-4" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            {isLogin ? "Zaloguj się" : "Zarejestruj się"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Witaj z powrotem u Fisza! 🐟" : "Dołącz do rodziny Fisza! 🎉"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Imię i nazwisko</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                placeholder="Jan Kowalski"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              placeholder="fisz@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-beer-amber to-beer-gold text-beer-dark font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Ładowanie..." : isLogin ? "Zaloguj się 🍺" : "Zarejestruj się 🎉"}
          </button>
        </form>

        <p className="text-center text-muted-foreground mt-4">
          {isLogin ? "Nie masz konta?" : "Masz już konto?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-beer-amber font-semibold hover:underline"
          >
            {isLogin ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
