import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart3, Megaphone, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCookieConsent, type ConsentState, type CookieCategory } from '@/hooks/useCookieConsent';

const CATEGORIES: { key: CookieCategory; title: string; description: string; icon: React.ElementType; required?: boolean }[] = [
  { key: 'necessary', title: 'Niezbędne', description: 'Wymagane do działania serwisu (logowanie, sesje, koszyk).', icon: Shield, required: true },
  { key: 'preferences', title: 'Preferencje', description: 'Zapamiętują Twoje ustawienia, np. motyw lub język.', icon: Settings2 },
  { key: 'analytics', title: 'Analityczne', description: 'Pomagają nam zrozumieć jak korzystasz z serwisu.', icon: BarChart3 },
  { key: 'marketing', title: 'Marketingowe', description: 'Pozwalają wyświetlać dopasowane treści i reklamy.', icon: Megaphone },
];

const CookieConsent = () => {
  const { consent, showBanner, showSettings, acceptAll, rejectAll, savePartial, openSettings, closeSettings } = useCookieConsent();
  const [draft, setDraft] = useState<ConsentState>(consent);

  useEffect(() => { setDraft(consent); }, [consent, showSettings]);

  const toggle = (key: CookieCategory, value: boolean) => {
    if (key === 'necessary') return;
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && !showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed bottom-0 inset-x-0 z-[100] p-3 sm:p-4 pointer-events-none"
            role="dialog"
            aria-live="polite"
            aria-label="Zgoda na pliki cookies"
          >
            <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-black/20 overflow-hidden">
              <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="shrink-0 h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Cookie className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground text-base sm:text-lg">Szanujemy Twoją prywatność</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Używamy plików cookies, aby zapewnić działanie serwisu, analizować ruch i personalizować treści.
                      Szczegóły znajdziesz w{' '}
                      <Link to="/privacy" className="text-primary hover:underline underline-offset-4">polityce prywatności</Link>.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 sm:items-center">
                  <Button variant="ghost" size="sm" onClick={openSettings} className="rounded-xl gap-2">
                    <Settings2 className="h-4 w-4" /> Ustawienia
                  </Button>
                  <Button variant="outline" size="sm" onClick={rejectAll} className="rounded-xl">
                    Tylko niezbędne
                  </Button>
                  <Button size="sm" onClick={acceptAll} className="rounded-xl shadow-lg shadow-primary/25">
                    Akceptuj wszystkie
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSettings} onOpenChange={(o) => { if (!o) closeSettings(); }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Ustawienia cookies
            </DialogTitle>
            <DialogDescription>
              Zarządzaj zgodami zgodnie z RODO. Możesz je zmienić w dowolnej chwili.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[55vh] overflow-y-auto pr-1">
            {CATEGORIES.map(({ key, title, description, icon: Icon, required }) => (
              <div key={key} className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 hover:border-border transition-colors">
                <div className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm text-foreground">{title}</p>
                    <Switch
                      checked={required ? true : draft[key]}
                      disabled={required}
                      onCheckedChange={(v) => toggle(key, v)}
                      aria-label={title}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                  {required && <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wide">Zawsze aktywne</p>}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={rejectAll} className="rounded-xl">Odrzuć wszystkie</Button>
            <Button variant="outline" size="sm" onClick={() => savePartial(draft)} className="rounded-xl">Zapisz wybrane</Button>
            <Button size="sm" onClick={acceptAll} className="rounded-xl">Akceptuj wszystkie</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;