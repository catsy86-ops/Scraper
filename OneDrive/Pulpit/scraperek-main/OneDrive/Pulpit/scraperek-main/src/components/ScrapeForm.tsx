import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Settings2, Keyboard, Camera, Palette, Brain, FileJson } from "lucide-react";
import { type ScrapeMode } from "./ScrapeModeSelector";
import { useEffect } from "react";

interface Props {
  mode: ScrapeMode;
  onSubmit: (input: string, options: Record<string, any>) => void;
  isLoading: boolean;
  initialInput?: string;
}

const placeholders: Record<ScrapeMode, string> = {
  scrape: "https://example.com",
  search: "najlepsze frameworki JavaScript 2026",
  map: "https://example.com",
  crawl: "https://example.com",
};

type ScrapeFormat = 'markdown' | 'html' | 'links' | 'rawHtml' | 'screenshot' | 'branding' | 'summary';

const formatOptions: { id: ScrapeFormat; label: string; icon?: typeof Camera; description: string }[] = [
  { id: 'markdown', label: 'Markdown', description: 'Treść w formacie MD' },
  { id: 'html', label: 'HTML', description: 'Przetworzony HTML' },
  { id: 'links', label: 'Linki', description: 'Wszystkie URL' },
  { id: 'rawHtml', label: 'Raw HTML', description: 'Oryginalny HTML' },
  { id: 'screenshot', label: 'Screenshot', icon: Camera, description: 'Zrzut ekranu strony' },
  { id: 'branding', label: 'Branding', icon: Palette, description: 'Kolory, fonty, logo' },
  { id: 'summary', label: 'Podsumowanie AI', icon: Brain, description: 'AI podsumowanie treści' },
];

const ScrapeForm = ({ mode, onSubmit, isLoading, initialInput = "" }: Props) => {
  const [input, setInput] = useState(initialInput);
  const [showOptions, setShowOptions] = useState(false);
  const [limit, setLimit] = useState("10");
  const [maxDepth, setMaxDepth] = useState("3");
  const [formats, setFormats] = useState<ScrapeFormat[]>(['markdown', 'links']);
  const [onlyMainContent, setOnlyMainContent] = useState(true);
  const [includeSubdomains, setIncludeSubdomains] = useState(false);
  const [jsonExtract, setJsonExtract] = useState(false);
  const [jsonPrompt, setJsonPrompt] = useState("");
  const [waitFor, setWaitFor] = useState("");
  const [lang, setLang] = useState("");
  const [country, setCountry] = useState("");
  const [timeFilter, setTimeFilter] = useState("");

  useEffect(() => {
    if (initialInput) setInput(initialInput);
  }, [initialInput]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.trim() && !isLoading) {
        e.preventDefault();
        handleSubmit(new Event('submit') as any);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [input, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFormat = (f: ScrapeFormat) => {
    setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const options: Record<string, any> = {};
    if (mode === 'scrape') {
      const fmts: any[] = [...formats];
      if (jsonExtract && jsonPrompt.trim()) {
        fmts.push({ type: 'json', prompt: jsonPrompt.trim() });
      }
      options.formats = fmts;
      options.onlyMainContent = onlyMainContent;
      if (waitFor) options.waitFor = parseInt(waitFor);
    }
    if (mode === 'search') {
      options.limit = parseInt(limit);
      if (lang) options.lang = lang;
      if (country) options.country = country;
      if (timeFilter) options.tbs = timeFilter;
    }
    if (mode === 'map') {
      options.limit = parseInt(limit);
      options.includeSubdomains = includeSubdomains;
    }
    if (mode === 'crawl') {
      options.limit = parseInt(limit);
      options.maxDepth = parseInt(maxDepth);
    }

    onSubmit(input.trim(), options);
  };

  const inputClasses = "w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50 transition-all";

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholders[mode]}
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              disabled={isLoading}
            />
            {isLoading && (
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 8, ease: "linear" }}
              />
            )}
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOptions(!showOptions)}
            className={`px-3 py-3 rounded-lg border transition-colors ${showOptions ? "glass neon-border text-primary" : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"}`}
          >
            <Settings2 className="w-5 h-5" />
          </motion.button>
          <motion.button
            type="submit"
            disabled={isLoading || !input.trim()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isLoading ? "Scraping..." : "Start"}
          </motion.button>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/40 font-mono">
          <Keyboard className="w-3 h-3" />
          <span>Ctrl+Enter aby uruchomić</span>
        </div>
      </div>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-lg p-4 space-y-4">
              <div className="text-xs font-mono text-primary uppercase tracking-wider">Zaawansowane opcje</div>

              {mode === 'scrape' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Formaty wyjściowe:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {formatOptions.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFormat(f.id)}
                          className={`px-2.5 py-2 rounded-md text-xs font-mono transition-all text-left ${
                            formats.includes(f.id)
                              ? "bg-primary/20 text-primary border border-primary/40"
                              : "bg-muted/30 text-muted-foreground border border-border/30 hover:border-primary/30"
                          }`}
                        >
                          <div className="font-semibold">{f.label}</div>
                          <div className="text-[9px] opacity-60 mt-0.5">{f.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* JSON Extract */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={jsonExtract}
                        onChange={(e) => setJsonExtract(e.target.checked)}
                        className="rounded border-border accent-primary"
                      />
                      <FileJson className="w-3 h-3 text-primary" />
                      Ekstrakcja JSON (AI)
                    </label>
                    <AnimatePresence>
                      {jsonExtract && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <textarea
                            value={jsonPrompt}
                            onChange={(e) => setJsonPrompt(e.target.value)}
                            placeholder="Opisz jakie dane chcesz wyekstrahować, np. 'Wyciągnij nazwę produktu, cenę i opis'"
                            className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-xs focus:outline-none focus:border-primary/50 transition-all resize-none h-16"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyMainContent}
                        onChange={(e) => setOnlyMainContent(e.target.checked)}
                        className="rounded border-border accent-primary"
                      />
                      Tylko główna treść
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Czekaj (ms):</label>
                      <input
                        type="number"
                        value={waitFor}
                        onChange={(e) => setWaitFor(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="30000"
                        className="w-20 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-xs focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === 'search' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground min-w-[50px]">Limit:</label>
                    <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} min="1" max="100" className={inputClasses + " w-20"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground min-w-[50px]">Język:</label>
                    <input type="text" value={lang} onChange={(e) => setLang(e.target.value)} placeholder="pl" className={inputClasses + " w-20"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground min-w-[50px]">Kraj:</label>
                    <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="PL" className={inputClasses + " w-20"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground min-w-[50px]">Okres:</label>
                    <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className={inputClasses + " w-28"}>
                      <option value="">Dowolny</option>
                      <option value="qdr:h">Godzina</option>
                      <option value="qdr:d">Dzień</option>
                      <option value="qdr:w">Tydzień</option>
                      <option value="qdr:m">Miesiąc</option>
                      <option value="qdr:y">Rok</option>
                    </select>
                  </div>
                </div>
              )}

              {mode === 'map' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground min-w-[60px]">Limit:</label>
                    <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} min="1" max="5000" className={inputClasses + " w-24"} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={includeSubdomains} onChange={(e) => setIncludeSubdomains(e.target.checked)} className="rounded border-border accent-primary" />
                    Uwzględnij subdomeny
                  </label>
                </div>
              )}

              {mode === 'crawl' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground min-w-[60px]">Limit:</label>
                    <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} min="1" max="100" className={inputClasses + " w-24"} />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground min-w-[60px]">Głębokość:</label>
                    <input type="number" value={maxDepth} onChange={(e) => setMaxDepth(e.target.value)} min="1" max="10" className={inputClasses + " w-24"} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
};

export default ScrapeForm;
