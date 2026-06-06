import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, Trash2, RotateCcw, Globe, Search, Map, Bug, X,
  Star, Download, Filter, CheckCircle2, XCircle, Play,
} from "lucide-react";
import { useScraperStore, type HistoryEntry } from "@/store/scraperStore";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import type { ScrapeMode } from "./ScrapeModeSelector";

const modeIcons: Record<ScrapeMode, React.ReactNode> = {
  scrape: <Globe className="w-3.5 h-3.5" />,
  search: <Search className="w-3.5 h-3.5" />,
  map: <Map className="w-3.5 h-3.5" />,
  crawl: <Bug className="w-3.5 h-3.5" />,
};

const modeLabels: Record<ScrapeMode, string> = {
  scrape: "Scrape",
  search: "Search",
  map: "Map",
  crawl: "Crawl",
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 60000) return "przed chwilą";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function truncateInput(input: string, max = 24) {
  return input.length > max ? input.slice(0, max) + "…" : input;
}

type FilterType = 'all' | 'favorites' | 'success' | 'error';

export function HistorySidebar() {
  const {
    history, loadHistoryEntry, rerunHistoryEntry, clearHistory,
    deleteHistoryEntry, toggleFavorite, favorites, isLoading, exportHistory,
  } = useScraperStore();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredHistory = useMemo(() => {
    let items = history;
    if (filter === 'favorites') items = items.filter(e => favorites.includes(e.id));
    if (filter === 'success') items = items.filter(e => e.status === 'success');
    if (filter === 'error') items = items.filter(e => e.status === 'error');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(e => e.input.toLowerCase().includes(q) || e.mode.includes(q));
    }
    return items;
  }, [history, filter, favorites, searchQuery]);

  const stats = useMemo(() => ({
    total: history.length,
    success: history.filter(e => e.status === 'success').length,
    errors: history.filter(e => e.status === 'error').length,
    avgTime: history.length > 0
      ? Math.round(history.reduce((a, e) => a + e.duration, 0) / history.length)
      : 0,
  }), [history]);

  return (
    <Sidebar collapsible="icon" side="right" className="border-l border-border/30 bg-card/40 backdrop-blur-xl">
      <SidebarHeader className="px-3 py-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
                <History className="w-4 h-4" />
                Historia ({history.length})
              </div>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <>
                    <button
                      onClick={() => exportHistory('json')}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Eksport JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={clearHistory}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Wyczyść historię"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats mini bar */}
            {history.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                <div className="px-2 py-1 rounded bg-neon-green/10 text-center">
                  <div className="text-[10px] text-neon-green font-mono font-bold">{stats.success}</div>
                  <div className="text-[8px] text-muted-foreground/50 uppercase">OK</div>
                </div>
                <div className="px-2 py-1 rounded bg-destructive/10 text-center">
                  <div className="text-[10px] text-destructive font-mono font-bold">{stats.errors}</div>
                  <div className="text-[8px] text-muted-foreground/50 uppercase">Błędy</div>
                </div>
                <div className="px-2 py-1 rounded bg-primary/10 text-center">
                  <div className="text-[10px] text-primary font-mono font-bold">{stats.avgTime}ms</div>
                  <div className="text-[8px] text-muted-foreground/50 uppercase">Śr. czas</div>
                </div>
              </div>
            )}

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj w historii..."
              className="w-full px-2.5 py-1.5 rounded-md bg-muted/30 border border-border/30 text-foreground placeholder:text-muted-foreground/40 font-mono text-[11px] focus:outline-none focus:border-primary/40"
            />

            {/* Filters */}
            <div className="flex gap-1">
              {([
                { key: 'all', label: 'Wszystkie', icon: <Filter className="w-3 h-3" /> },
                { key: 'favorites', label: '★', icon: <Star className="w-3 h-3" /> },
                { key: 'success', label: '✓', icon: <CheckCircle2 className="w-3 h-3" /> },
                { key: 'error', label: '✗', icon: <XCircle className="w-3 h-3" /> },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center gap-1 ${
                    filter === f.key
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  }`}
                  title={f.label}
                >
                  {f.icon}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <History className="w-4 h-4 text-primary" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] text-muted-foreground/60 font-mono uppercase">
              {filter === 'favorites' ? 'Ulubione' : filter === 'success' ? 'Udane' : filter === 'error' ? 'Błędy' : 'Ostatnie zapytania'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <AnimatePresence>
                {filteredHistory.length === 0 && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 py-8 text-center text-xs text-muted-foreground/50"
                  >
                    {history.length === 0 ? "Brak historii zapytań" : "Brak wyników dla filtrów"}
                  </motion.div>
                )}

                {filteredHistory.map((entry, i) => (
                  <SidebarMenuItem key={entry.id}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    >
                      {collapsed ? (
                        <button
                          onClick={() => !isLoading && loadHistoryEntry(entry.id)}
                          disabled={isLoading}
                          className={`w-full flex justify-center py-2 transition-colors disabled:opacity-40 ${
                            entry.status === 'error' ? 'text-destructive/60 hover:text-destructive' : 'text-muted-foreground hover:text-primary'
                          }`}
                          title={`${modeLabels[entry.mode]}: ${entry.input}`}
                        >
                          {modeIcons[entry.mode]}
                        </button>
                      ) : (
                        <HistoryItem
                          entry={entry}
                          isFavorite={favorites.includes(entry.id)}
                          onLoad={() => loadHistoryEntry(entry.id)}
                          onRerun={() => rerunHistoryEntry(entry.id)}
                          onDelete={() => deleteHistoryEntry(entry.id)}
                          onToggleFavorite={() => toggleFavorite(entry.id)}
                          disabled={isLoading}
                        />
                      )}
                    </motion.div>
                  </SidebarMenuItem>
                ))}
              </AnimatePresence>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && history.length > 0 && (
        <SidebarFooter className="px-3 py-3 border-t border-border/20">
          <div className="flex gap-2">
            <button
              onClick={() => exportHistory('json')}
              className="flex-1 py-1.5 rounded-md bg-muted/30 text-[10px] font-mono text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all text-center"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportHistory('csv')}
              className="flex-1 py-1.5 rounded-md bg-muted/30 text-[10px] font-mono text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all text-center"
            >
              Export CSV
            </button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function HistoryItem({
  entry, isFavorite, onLoad, onRerun, onDelete, onToggleFavorite, disabled,
}: {
  entry: HistoryEntry;
  isFavorite: boolean;
  onLoad: () => void;
  onRerun: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  disabled: boolean;
}) {
  return (
    <div className="group px-2 py-2 rounded-md hover:bg-primary/5 transition-colors">
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 ${entry.status === 'error' ? 'text-destructive/60' : 'text-primary/50'}`}>
          {modeIcons[entry.mode]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className={`text-xs font-mono truncate ${entry.status === 'error' ? 'text-destructive/80' : 'text-foreground'}`}>
              {truncateInput(entry.input)}
            </div>
            {entry.status === 'error' && <XCircle className="w-3 h-3 text-destructive/60 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground/60">{formatTime(entry.timestamp)}</span>
            <span className="text-[10px] text-primary/40 font-mono">{entry.duration}ms</span>
            <span className="text-[10px] text-muted-foreground/40 font-mono uppercase">{modeLabels[entry.mode]}</span>
            {entry.crawlProgress && (
              <span
                className="text-[10px] font-mono px-1 rounded bg-primary/10 text-primary/80"
                title={`Crawl: ${entry.crawlProgress.completed}/${entry.crawlProgress.total} URL${entry.crawlProgress.creditsUsed != null ? ` • ${entry.crawlProgress.creditsUsed} kredytów` : ''}`}
              >
                {entry.crawlProgress.completed}/{entry.crawlProgress.total}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`p-0.5 rounded transition-colors ${isFavorite ? 'text-yellow-500' : 'text-muted-foreground/40 hover:text-yellow-500'}`}
            title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <Star className="w-3 h-3" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          {entry.status === 'success' && (
            <button
              onClick={(e) => { e.stopPropagation(); onLoad(); }}
              disabled={disabled}
              className="p-0.5 rounded text-muted-foreground/40 hover:text-primary transition-colors disabled:opacity-40"
              title="Załaduj wynik"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRerun(); }}
            disabled={disabled}
            className="p-0.5 rounded text-muted-foreground/40 hover:text-neon-green transition-colors disabled:opacity-40"
            title="Uruchom ponownie"
          >
            <Play className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
            title="Usuń"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistorySidebar;
