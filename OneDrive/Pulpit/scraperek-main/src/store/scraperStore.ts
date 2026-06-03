import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ScrapeMode } from '@/components/ScrapeModeSelector';
import { firecrawlApi, clearFirecrawlCache } from '@/lib/api/firecrawl';

// Module-scope controller (non-serializable, kept outside store)
let currentController: AbortController | null = null;

export interface HistoryEntry {
  id: string;
  mode: ScrapeMode;
  input: string;
  result: any;
  options: Record<string, any>;
  timestamp: number;
  duration: number;
  status: 'success' | 'error';
  error?: string;
  fromCache?: boolean;
  attempts?: number;
  crawlProgress?: CrawlProgress;
}

export interface CrawlProgress {
  status: 'starting' | 'scraping' | 'completed' | 'failed' | 'cancelled';
  completed: number;
  total: number;
  creditsUsed?: number;
  startedAt: number;
  jobId?: string;
  currentUrl?: string;
}

interface ScraperState {
  mode: ScrapeMode;
  result: any;
  isLoading: boolean;
  totalRequests: number;
  lastTime: number | undefined;
  history: HistoryEntry[];
  error: string | null;
  favorites: string[];
  lastInput: string;
  lastFromCache: boolean;
  lastAttempts: number;
  crawlProgress: CrawlProgress | null;


  setMode: (mode: ScrapeMode) => void;
  setLastInput: (input: string) => void;
  submitRequest: (input: string, options: Record<string, any>) => Promise<void>;
  retryLast: () => Promise<void>;
  cancelRequest: () => void;
  clearCache: () => void;
  clearResult: () => void;
  loadHistoryEntry: (id: string) => void;
  rerunHistoryEntry: (id: string) => Promise<void>;
  clearHistory: () => void;
  deleteHistoryEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  exportHistory: (format: 'json' | 'csv') => void;
}

export const useScraperStore = create<ScraperState>()(
  persist(
    (set, get) => ({
      mode: 'scrape',
      result: null,
      isLoading: false,
      totalRequests: 0,
      lastTime: undefined,
      history: [],
      error: null,
      favorites: [],
      lastInput: '',
      lastFromCache: false,
      lastAttempts: 0,
      crawlProgress: null,



      setMode: (mode) => set({ mode }),
      setLastInput: (input) => set({ lastInput: input }),

      clearResult: () => set({ result: null, error: null }),

      loadHistoryEntry: (id) => {
        const entry = get().history.find((e) => e.id === id);
        if (entry) {
          set({
            mode: entry.mode,
            result: entry.result,
            lastTime: entry.duration,
            error: null,
            lastInput: entry.input,
            crawlProgress: entry.crawlProgress ?? null,
            lastFromCache: !!entry.fromCache,
            lastAttempts: entry.attempts ?? 1,
          });
        }
      },

      rerunHistoryEntry: async (id) => {
        const entry = get().history.find((e) => e.id === id);
        if (!entry) return;
        set({ mode: entry.mode, lastInput: entry.input });
        await get().submitRequest(entry.input, entry.options);
      },

      retryLast: async () => {
        const { history } = get();
        if (history.length === 0) return;
        const last = history[0];
        set({ mode: last.mode, lastInput: last.input });
        await get().submitRequest(last.input, last.options);
      },

      clearHistory: () => set({ history: [], favorites: [] }),

      deleteHistoryEntry: (id) =>
        set((state) => ({
          history: state.history.filter((e) => e.id !== id),
          favorites: state.favorites.filter((f) => f !== id),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),

      exportHistory: (format) => {
        const { history } = get();
        let content: string;
        let mimeType: string;
        let ext: string;

        if (format === 'json') {
          const exportData = history.map(({ id, mode, input, timestamp, duration, status }) => ({
            id, mode, input, timestamp: new Date(timestamp).toISOString(), duration, status,
          }));
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          ext = 'json';
        } else {
          const header = 'ID,Tryb,Zapytanie,Data,Czas (ms),Status';
          const rows = history.map((e) =>
            `"${e.id}","${e.mode}","${e.input.replace(/"/g, '""')}","${new Date(e.timestamp).toISOString()}",${e.duration},"${e.status}"`
          );
          content = [header, ...rows].join('\n');
          mimeType = 'text/csv';
          ext = 'csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scraper-kaczy-history.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },

      cancelRequest: () => {
        currentController?.abort();
        currentController = null;
        const { crawlProgress } = get();
        set({
          isLoading: false,
          crawlProgress: crawlProgress ? { ...crawlProgress, status: 'cancelled' } : null,
        });
      },


      clearCache: () => {
        clearFirecrawlCache();
      },

      submitRequest: async (input, options) => {
        const { mode } = get();
        currentController?.abort();
        const controller = new AbortController();
        currentController = controller;

        set({ isLoading: true, result: null, error: null, lastInput: input, crawlProgress: null });
        const start = Date.now();
        const callOpts = { signal: controller.signal };

        try {
          let response: any;
          switch (mode) {
            case 'scrape': response = await firecrawlApi.scrape(input, options, callOpts); break;
            case 'search': response = await firecrawlApi.search(input, options, callOpts); break;
            case 'map':    response = await firecrawlApi.map(input, options, callOpts); break;
            case 'crawl': {
              // Start crawl job (Firecrawl /v1/crawl returns { id } async)
              set({
                crawlProgress: {
                  status: 'starting',
                  completed: 0,
                  total: options?.limit || 20,
                  startedAt: Date.now(),
                },
              });
              const startRes = await firecrawlApi.crawl(input, options, callOpts);
              if (controller.signal.aborted) return;
              if (startRes?.success === false) {
                response = startRes;
                break;
              }
              const jobId = (startRes as any)?.id || (startRes as any)?.data?.id;
              if (!jobId) {
                // Synchronous response — already has data
                response = startRes;
                break;
              }
              set((s) => ({
                crawlProgress: s.crawlProgress
                  ? { ...s.crawlProgress, status: 'scraping', jobId }
                  : null,
              }));

              // Poll status until completed/failed
              let pollCount = 0;
              const maxPolls = 300; // 10 min @ 2s
              let allData: any[] = [];
              while (pollCount < maxPolls) {
                if (controller.signal.aborted) return;
                await new Promise((r) => setTimeout(r, 2000));
                if (controller.signal.aborted) return;
                pollCount++;

                let status: any;
                try {
                  status = await firecrawlApi.crawlStatus(jobId, controller.signal);
                } catch (e) {
                  if (controller.signal.aborted) return;
                  continue; // transient — retry next tick
                }

                const completed = status?.completed ?? 0;
                const total = status?.total ?? get().crawlProgress?.total ?? 0;
                const newData = Array.isArray(status?.data) ? status.data : [];
                if (newData.length > allData.length) allData = newData;
                const latestUrl = newData[newData.length - 1]?.metadata?.sourceURL;

                set((s) => ({
                  crawlProgress: s.crawlProgress
                    ? {
                        ...s.crawlProgress,
                        status: status?.status === 'completed' ? 'completed' : 'scraping',
                        completed,
                        total,
                        creditsUsed: status?.creditsUsed,
                        currentUrl: latestUrl || s.crawlProgress.currentUrl,
                      }
                    : null,
                }));

                if (status?.status === 'completed' || status?.status === 'failed') {
                  response = {
                    success: status?.status === 'completed',
                    status: status?.status,
                    completed,
                    total,
                    creditsUsed: status?.creditsUsed,
                    data: allData,
                    error: status?.status === 'failed' ? (status?.error || 'Crawl nie powiódł się') : undefined,
                  };
                  break;
                }
              }
              if (!response) {
                response = { success: false, error: 'Crawl trwa zbyt długo (timeout polling)' };
              }
              break;
            }
          }


          if (controller.signal.aborted) {
            set({ isLoading: false, error: null });
            return;
          }

          const duration = Date.now() - start;
          const fromCache = !!response?.fromCache;
          const attempts = response?.attempts ?? 1;

          if (response?.success === false) {
            const partialCrawl = mode === 'crawl' ? get().crawlProgress ?? undefined : undefined;
            const entry: HistoryEntry = {
              id: crypto.randomUUID(), mode, input, result: null, options,
              timestamp: Date.now(), duration, status: 'error',
              error: response.error || 'Nie udało się wykonać zapytania',
              attempts,
              crawlProgress: partialCrawl ? { ...partialCrawl, status: 'failed' } : undefined,
            };
            set((state) => ({
              error: entry.error!,
              isLoading: false,
              lastAttempts: attempts,
              lastFromCache: false,
              history: [entry, ...state.history].slice(0, 100),
            }));
            return;
          }

          const finalCrawlProgress = mode === 'crawl' ? get().crawlProgress ?? undefined : undefined;
          const entry: HistoryEntry = {
            id: crypto.randomUUID(), mode, input, result: response, options,
            timestamp: Date.now(), duration, status: 'success',
            fromCache, attempts,
            crawlProgress: finalCrawlProgress ? { ...finalCrawlProgress, status: 'completed' } : undefined,
          };

          set((state) => ({
            result: response,
            totalRequests: state.totalRequests + 1,
            lastTime: duration,
            lastFromCache: fromCache,
            lastAttempts: attempts,
            history: [entry, ...state.history].slice(0, 100),
            isLoading: false,
          }));
        } catch (error: any) {
          if (controller.signal.aborted) {
            set({ isLoading: false });
            return;
          }
          console.error('Scraper error:', error);
          const duration = Date.now() - start;
          const errMsg = error?.message || 'Nie udało się wykonać zapytania. Sprawdź połączenie.';
          const entry: HistoryEntry = {
            id: crypto.randomUUID(), mode, input, result: null, options,
            timestamp: Date.now(), duration, status: 'error', error: errMsg,
          };
          set((state) => ({
            error: errMsg,
            isLoading: false,
            history: [entry, ...state.history].slice(0, 100),
          }));
        } finally {
          if (currentController === controller) currentController = null;
        }
      },
    }),
    {
      name: 'webscraper-storage',
      partialize: (state) => ({
        history: state.history,
        totalRequests: state.totalRequests,
        favorites: state.favorites,
      }),
    }
  )
);
