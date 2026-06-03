import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Send, Loader2, Equal, AlertTriangle, FileText, Code, ExternalLink } from "lucide-react";
import { firecrawlApi } from "@/lib/api/firecrawl";
import MarkdownRenderer from "./MarkdownRenderer";

interface ScrapeResult {
  url: string;
  data: any;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  duration?: number;
}

interface DiffStat {
  totalCharsA: number;
  totalCharsB: number;
  charDiff: number;
  linksA: number;
  linksB: number;
  commonLinks: number;
  uniqueA: string[];
  uniqueB: string[];
  titleA: string;
  titleB: string;
}

const PageComparator = () => {
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [resultA, setResultA] = useState<ScrapeResult>({ url: '', data: null, status: 'idle' });
  const [resultB, setResultB] = useState<ScrapeResult>({ url: '', data: null, status: 'idle' });
  const [viewMode, setViewMode] = useState<'summary' | 'markdown' | 'links'>('summary');

  const scrapeUrl = useCallback(async (url: string, setter: (r: ScrapeResult) => void) => {
    setter({ url, data: null, status: 'loading' });
    const start = Date.now();
    try {
      const response = await firecrawlApi.scrape(url, { formats: ['markdown', 'links'], onlyMainContent: true });
      const duration = Date.now() - start;
      if (response.success === false) {
        setter({ url, data: null, status: 'error', error: response.error || 'Błąd', duration });
      } else {
        setter({ url, data: response.data || response, status: 'success', duration });
      }
    } catch {
      setter({ url, data: null, status: 'error', error: 'Błąd połączenia', duration: Date.now() - start });
    }
  }, []);

  const compare = async () => {
    if (!urlA.trim() || !urlB.trim()) return;
    await Promise.all([
      scrapeUrl(urlA.trim(), setResultA),
      scrapeUrl(urlB.trim(), setResultB),
    ]);
  };

  const isLoading = resultA.status === 'loading' || resultB.status === 'loading';
  const hasResults = resultA.status === 'success' && resultB.status === 'success';

  const getDiffStats = (): DiffStat | null => {
    if (!hasResults) return null;
    const a = resultA.data;
    const b = resultB.data;
    const linksA = a?.links || [];
    const linksB = b?.links || [];
    const setA = new Set(linksA);
    const setB = new Set(linksB);
    const commonLinks = linksA.filter((l: string) => setB.has(l));

    return {
      totalCharsA: a?.markdown?.length || 0,
      totalCharsB: b?.markdown?.length || 0,
      charDiff: Math.abs((a?.markdown?.length || 0) - (b?.markdown?.length || 0)),
      linksA: linksA.length,
      linksB: linksB.length,
      commonLinks: commonLinks.length,
      uniqueA: linksA.filter((l: string) => !setB.has(l)),
      uniqueB: linksB.filter((l: string) => !setA.has(l)),
      titleA: a?.metadata?.title || urlA,
      titleB: b?.metadata?.title || urlB,
    };
  };

  const stats = getDiffStats();

  return (
    <div className="space-y-6">
      {/* Input section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-lg p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
          <ArrowLeftRight className="w-4 h-4" /> Porównywarka stron
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <input
            type="text"
            value={urlA}
            onChange={(e) => setUrlA(e.target.value)}
            placeholder="https://strona-a.com"
            className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            disabled={isLoading}
          />
          <ArrowLeftRight className="w-5 h-5 text-muted-foreground/30 mx-auto hidden md:block" />
          <input
            type="text"
            value={urlB}
            onChange={(e) => setUrlB(e.target.value)}
            placeholder="https://strona-b.com"
            className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            disabled={isLoading}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={compare}
          disabled={isLoading || !urlA.trim() || !urlB.trim()}
          className="w-full px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
          {isLoading ? "Porównywanie..." : "Porównaj strony"}
        </motion.button>
      </motion.div>

      {/* Error display */}
      {(resultA.status === 'error' || resultB.status === 'error') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-4 border border-destructive/30">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            {resultA.status === 'error' && <span>Strona A: {resultA.error}</span>}
            {resultB.status === 'error' && <span>Strona B: {resultB.error}</span>}
          </div>
        </motion.div>
      )}

      {/* Results */}
      {hasResults && stats && (
        <>
          {/* View mode tabs */}
          <div className="flex gap-1 bg-muted/30 rounded-md p-0.5 w-fit">
            {[
              { key: 'summary' as const, label: 'Podsumowanie' },
              { key: 'markdown' as const, label: 'Treść' },
              { key: 'links' as const, label: 'Linki' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                  viewMode === tab.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'summary' && (
              <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Znaki (A)', value: stats.totalCharsA.toLocaleString(), icon: FileText },
                    { label: 'Znaki (B)', value: stats.totalCharsB.toLocaleString(), icon: FileText },
                    { label: 'Różnica', value: stats.charDiff.toLocaleString(), icon: AlertTriangle },
                    { label: 'Wspólne linki', value: `${stats.commonLinks}`, icon: Equal },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-lg p-3 text-center"
                    >
                      <stat.icon className="w-4 h-4 text-primary/40 mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground font-mono">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Side by side metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'A', title: stats.titleA, url: urlA, chars: stats.totalCharsA, links: stats.linksA, duration: resultA.duration },
                    { label: 'B', title: stats.titleB, url: urlB, chars: stats.totalCharsB, links: stats.linksB, duration: resultB.duration },
                  ].map(side => (
                    <div key={side.label} className="glass rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{side.label}</span>
                        <span className="text-sm font-semibold text-foreground truncate">{side.title}</span>
                      </div>
                      <a href={side.url} target="_blank" rel="noopener" className="text-xs text-primary/60 font-mono truncate flex items-center gap-1 hover:text-primary">
                        {side.url} <ExternalLink className="w-3 h-3" />
                      </a>
                      <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
                        <span>{side.chars?.toLocaleString()} znaków</span>
                        <span>{side.links} linków</span>
                        <span>{side.duration}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {viewMode === 'markdown' && (
              <motion.div key="markdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'A', data: resultA.data, url: urlA },
                    { label: 'B', data: resultB.data, url: urlB },
                  ].map(side => (
                    <div key={side.label} className="glass rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
                        <Code className="w-3 h-3" /> Strona {side.label}
                      </div>
                      <div className="max-h-[500px] overflow-auto">
                        {side.data?.markdown ? (
                          <MarkdownRenderer content={side.data.markdown.slice(0, 5000)} />
                        ) : (
                          <span className="text-muted-foreground text-sm">Brak treści</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {viewMode === 'links' && (
              <motion.div key="links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Unique links */}
                {stats.uniqueA.length > 0 && (
                  <div className="glass rounded-lg p-4 space-y-2">
                    <div className="text-xs font-mono text-primary uppercase tracking-wider">
                      Unikalne dla A ({stats.uniqueA.length})
                    </div>
                    <div className="max-h-48 overflow-auto space-y-1">
                      {stats.uniqueA.slice(0, 50).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener" className="block text-xs font-mono text-primary/60 hover:text-primary truncate">
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {stats.uniqueB.length > 0 && (
                  <div className="glass rounded-lg p-4 space-y-2">
                    <div className="text-xs font-mono text-accent uppercase tracking-wider">
                      Unikalne dla B ({stats.uniqueB.length})
                    </div>
                    <div className="max-h-48 overflow-auto space-y-1">
                      {stats.uniqueB.slice(0, 50).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener" className="block text-xs font-mono text-accent/60 hover:text-accent truncate">
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {stats.commonLinks > 0 && (
                  <div className="glass rounded-lg p-4">
                    <div className="text-xs font-mono text-muted-foreground">
                      <Equal className="w-3 h-3 inline mr-1" />
                      {stats.commonLinks} wspólnych linków
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Empty state */}
      {!hasResults && !isLoading && resultA.status === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center py-12 space-y-3">
          <ArrowLeftRight className="w-8 h-8 text-muted-foreground/20 mx-auto" />
          <p className="text-sm text-muted-foreground/40 font-mono">Podaj dwa URL-e, aby porównać ich treść</p>
          <p className="text-[10px] text-muted-foreground/20 font-mono max-w-sm mx-auto">
            Porównywarka analizuje znaki, linki i strukturę stron obok siebie
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default PageComparator;
