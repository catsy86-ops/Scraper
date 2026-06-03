import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { Terminal, Sparkles, AlertCircle, RefreshCw, History, Timer, ArrowLeftRight, BarChart3, LogOut, LogIn, UserPlus, Bell, FolderOpen, Webhook, X, Database, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import ThemeToggle from "@/components/ThemeToggle";
import Dashboard from "@/components/Dashboard";
import { useSearchParams } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import ScrapeModeSelector from "@/components/ScrapeModeSelector";
import ScrapeForm from "@/components/ScrapeForm";
import ResultsPanel from "@/components/ResultsPanel";
import StatusBar from "@/components/StatusBar";
import HistorySidebar from "@/components/HistorySidebar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import CrawlProgress from "@/components/CrawlProgress";
import ScheduledScraping from "@/components/ScheduledScraping";
import PageComparator from "@/components/PageComparator";
import LinkAccountBanner from "@/components/LinkAccountBanner";
import ScrapingTemplates from "@/components/ScrapingTemplates";
import ContentAlerts from "@/components/ContentAlerts";
import WebhookExport from "@/components/WebhookExport";
import { useToast } from "@/components/ui/use-toast";
import { useScraperStore } from "@/store/scraperStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type AppTab = 'scraper' | 'scheduled' | 'compare' | 'dashboard' | 'templates' | 'alerts' | 'webhooks';

const IndexContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as AppTab) || 'scraper';
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const {
    mode, result, isLoading, error, lastInput, lastFromCache, lastAttempts, crawlProgress,
    setMode, submitRequest, clearResult, retryLast, cancelRequest, clearCache,
  } = useScraperStore();
  const { toast } = useToast();

  const setActiveTab = (tab: AppTab) => {
    setSearchParams(tab === 'scraper' ? {} : { tab });
  };

  const handleSubmit = useCallback(
    async (input: string, options: Record<string, any>) => {
      clearResult();
      await submitRequest(input, options);

      const state = useScraperStore.getState();
      if (state.error) {
        toast({ title: "Błąd", description: state.error, variant: "destructive" });
      } else {
        toast({
          title: "✓ Sukces",
          description: `${mode.charAt(0).toUpperCase() + mode.slice(1)} zakończony w ${state.lastTime}ms`,
        });
      }
    },
    [mode, toast, submitRequest, clearResult]
  );

  const handleRetry = useCallback(async () => {
    clearResult();
    await retryLast();
    const state = useScraperStore.getState();
    if (state.error) {
      toast({ title: "Błąd", description: state.error, variant: "destructive" });
    } else {
      toast({ title: "✓ Ponownie", description: "Zapytanie wykonane ponownie" });
    }
  }, [retryLast, clearResult, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && result) {
        clearResult();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [result, clearResult]);

  const tabs: { key: AppTab; label: string; icon: typeof Terminal }[] = [
    { key: 'scraper', label: 'Scraper', icon: Terminal },
    { key: 'templates', label: 'Szablony', icon: FolderOpen },
    { key: 'alerts', label: 'Alerty', icon: Bell },
    { key: 'webhooks', label: 'Webhook', icon: Webhook },
    { key: 'scheduled', label: 'Scheduled', icon: Timer },
    { key: 'compare', label: 'Porównywarka', icon: ArrowLeftRight },
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-15" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
      </div>

      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        {session ? (
          <>
            {session.user?.is_anonymous && (
              <button
                onClick={() => navigate("/auth")}
                className="p-2 rounded-lg glass border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                title="Powiąż konto"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="p-2 rounded-lg glass border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
              title="Profil"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="p-2 rounded-lg glass border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              title="Wyloguj się"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="p-2 rounded-lg glass border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            title="Zaloguj się"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}
        <ThemeToggle />
        <SidebarTrigger className="p-2 rounded-lg glass neon-border text-primary hover:bg-primary/10 transition-colors">
          <History className="w-4 h-4" />
        </SidebarTrigger>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        <motion.header
          className="text-center space-y-4 pt-8 pb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="p-2.5 rounded-xl gradient-primary"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Terminal className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Scraper by <span className="text-primary neon-text">Kaczy</span>
            </h1>
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-primary/50" />
            </motion.div>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Potężne narzędzie do ekstrakcji danych z internetu. Scrape, szukaj, mapuj i crawluj.
          </p>
        </motion.header>

        <LinkAccountBanner isAnonymous={!!session?.user?.is_anonymous} />

        <StatusBar />

        {/* App tabs */}
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit mx-auto overflow-x-auto max-w-full">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-2 rounded-md text-[10px] sm:text-xs font-mono flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-primary/20 text-primary neon-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'scraper' && (
            <motion.div key="scraper" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <ScrapeModeSelector activeMode={mode} onModeChange={setMode} />
              <ScrapeForm mode={mode} onSubmit={handleSubmit} isLoading={isLoading} initialInput={lastInput} />

              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between glass rounded-lg px-3 py-2 -mt-4"
                  >
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                      Wykonywanie zapytania... (auto-retry, timeout 60s)
                    </span>
                    <button
                      onClick={cancelRequest}
                      className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[10px] font-mono flex items-center gap-1 hover:bg-destructive/20 transition-colors"
                    >
                      <X className="w-3 h-3" /> Anuluj
                    </button>
                  </motion.div>
                )}
                {!isLoading && result && (lastFromCache || lastAttempts > 1) && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between glass rounded-lg px-3 py-2 -mt-4 border border-primary/20"
                  >
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                      {lastFromCache ? (
                        <><Database className="w-3 h-3 text-primary" /> Wynik z cache (TTL 5 min)</>
                      ) : (
                        <><Zap className="w-3 h-3 text-primary" /> Sukces po {lastAttempts} próbach (auto-retry)</>
                      )}
                    </span>
                    {lastFromCache && (
                      <button
                        onClick={() => { clearCache(); toast({ title: "Cache wyczyszczony" }); }}
                        className="px-2 py-1 rounded-md bg-muted/40 text-muted-foreground text-[10px] font-mono hover:text-foreground transition-colors"
                      >
                        Wyczyść cache
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass rounded-lg p-4 border border-destructive/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      <span className="text-sm text-destructive">{error}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRetry}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-mono flex items-center gap-1.5 hover:bg-destructive/20 transition-colors disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3" /> Ponów
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isLoading && mode === 'crawl' && crawlProgress && (
                  <motion.div key="crawl-progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CrawlProgress progress={crawlProgress} />
                  </motion.div>
                )}
                {isLoading && mode !== 'crawl' && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingSkeleton />
                  </motion.div>
                )}
                {result && !isLoading && (
                  <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {mode === 'crawl' && crawlProgress?.status === 'completed' && (
                      <CrawlProgress progress={crawlProgress} />
                    )}
                    <ResultsPanel result={result} mode={mode} />
                  </motion.div>
                )}
              </AnimatePresence>


              {!result && !isLoading && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center space-y-3 py-8"
                >
                  <div className="text-muted-foreground/30 text-xs font-mono">
                    Wpisz URL lub zapytanie i naciśnij Start
                  </div>
                  <div className="flex justify-center gap-4 text-[10px] font-mono text-muted-foreground/20">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-muted/20 border border-border/20">Ctrl+Enter</kbd> Uruchom</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-muted/20 border border-border/20">Esc</kbd> Wyczyść</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ScrapingTemplates />
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ContentAlerts />
            </motion.div>
          )}

          {activeTab === 'webhooks' && (
            <motion.div key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <WebhookExport />
            </motion.div>
          )}

          {activeTab === 'scheduled' && (
            <motion.div key="scheduled" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ScheduledScraping />
            </motion.div>
          )}

          {activeTab === 'compare' && (
            <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <PageComparator />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center text-xs text-muted-foreground/50 font-mono pt-8 pb-4">
          Scraper by Kaczy • Powered by Firecrawl API
        </footer>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <IndexContent />
        <HistorySidebar />
      </div>
    </SidebarProvider>
  );
};

export default Index;
