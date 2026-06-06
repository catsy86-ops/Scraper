import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import logoUFisza from '@/assets/logo-u-fisza.png';

function getPolishAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Nieprawidłowy email lub hasło.';
  if (lower.includes('email not confirmed')) return 'Email nie został potwierdzony. Sprawdź skrzynkę pocztową.';
  if (lower.includes('user already registered')) return 'Użytkownik z tym adresem email już istnieje.';
  if (lower.includes('password should be at least')) return 'Hasło jest za krótkie (min. 6 znaków).';
  if (lower.includes('unable to validate email')) return 'Nieprawidłowy format adresu email.';
  if (lower.includes('rate limit')) return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.';
  return message;
}

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/profile');
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      toast({ title: 'Błąd', description: 'Hasła nie są identyczne.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/profile');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          navigate('/profile');
        } else {
          toast({ title: 'Sprawdź email', description: 'Link aktywacyjny został wysłany.' });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
      toast({ title: 'Błąd', description: getPolishAuthErrorMessage(message), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result?.error) throw result.error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
      toast({ title: 'Błąd', description: getPolishAuthErrorMessage(message), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Powrót
        </Button>

        <div className="text-center">
          <img src={logoUFisza} alt="u Fisza" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </h1>
        </div>

        <Button
          variant="outline"
          className="w-full gap-3 h-12"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Kontynuuj z Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">lub</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
              minLength={6}
            />
          </div>
          {!isLogin && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Potwierdź hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          )}
          <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
            {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
          <button onClick={() => { setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); }} className="text-primary font-medium hover:underline">
            {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
