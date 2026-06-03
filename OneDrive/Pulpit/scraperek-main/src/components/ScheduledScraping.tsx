import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Square, Clock, Zap, RotateCw, Trash2, Bell, BellOff, GitCompare } from "lucide-react";
import { useScraperStore } from "@/store/scraperStore";
import { type ScrapeMode } from "./ScrapeModeSelector";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { toast } from "sonner";

interface JobResult {
  timestamp: number;
  status: 'success' | 'error';
  duration: number;
  contentHash: string;
  changed: boolean;
}

interface ScheduledJob {
  id: string;
  input: string;
  mode: ScrapeMode;
  options: Record<string, any>;
  intervalMs: number;
  isActive: boolean;
  lastRun: number | null;
  nextRun: number | null;
  runCount: number;
  maxRuns: number | null;
  results: JobResult[];
  lastContentHash: string | null;
  notifyOnChange: boolean;
  changeCount: number;
}

const INTERVAL_OPTIONS = [
  { label: "30s", value: 30_000 },
  { label: "1 min", value: 60_000 },
  { label: "5 min", value: 300_000 },
  { label: "15 min", value: 900_000 },
  { label: "30 min", value: 1_800_000 },
  { label: "1h", value: 3_600_000 },
];

// Simple hash to detect content changes
const hashContent = async (content: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const extractContent = (result: any): string => {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (result.data?.markdown) return result.data.markdown;
  if (result.data?.content) return result.data.content;
  if (result.data?.html) return result.data.html;
  if (Array.isArray(result.data)) return JSON.stringify(result.data);
  return JSON.stringify(result);
};

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

const sendNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/placeholder.svg' });
  }
  toast.info(title, { description: body });
};

const ScheduledScraping = () => {
  const { mode, lastInput, submitRequest } = useScraperStore();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [selectedInterval, setSelectedInterval] = useState(60_000);
  const [maxRuns, setMaxRuns] = useState<string>("");
  const [customInput, setCustomInput] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const runJob = useCallback(async (job: ScheduledJob) => {
    const start = Date.now();
    try {
      // Run scraping via the API directly to get the result
      let apiResult: any;
      if (job.mode === 'scrape') {
        apiResult = await firecrawlApi.scrape(job.input, job.options);
      } else if (job.mode === 'search') {
        apiResult = await firecrawlApi.search(job.input, job.options);
      } else if (job.mode === 'map') {
        apiResult = await firecrawlApi.map(job.input, job.options);
      } else {
        apiResult = await firecrawlApi.crawl(job.input, job.options);
      }

      const duration = Date.now() - start;
      const content = extractContent(apiResult);
      const contentHash = await hashContent(content);
      const changed = job.lastContentHash !== null && job.lastContentHash !== contentHash;

      if (changed && job.notifyOnChange) {
        sendNotification(
          '🔄 Wykryto zmiany!',
          `Strona "${job.input}" zmieniła się od ostatniego scanu.`
        );
      }

      setJobs(prev => prev.map(j => j.id === job.id ? {
        ...j,
        lastRun: Date.now(),
        nextRun: j.isActive ? Date.now() + j.intervalMs : null,
        runCount: j.runCount + 1,
        lastContentHash: contentHash,
        changeCount: j.changeCount + (changed ? 1 : 0),
        results: [...j.results, { timestamp: Date.now(), status: 'success' as const, duration, contentHash, changed }].slice(-20),
      } : j));
    } catch {
      const duration = Date.now() - start;
      setJobs(prev => prev.map(j => j.id === job.id ? {
        ...j,
        lastRun: Date.now(),
        nextRun: j.isActive ? Date.now() + j.intervalMs : null,
        runCount: j.runCount + 1,
        results: [...j.results, { timestamp: Date.now(), status: 'error' as const, duration, contentHash: '', changed: false }].slice(-20),
      } : j));
    }
  }, []);

  useEffect(() => {
    jobs.forEach(job => {
      if (job.isActive && job.maxRuns && job.runCount >= job.maxRuns) {
        stopJob(job.id);
      }
    });
  }, [jobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const startJob = useCallback((job: ScheduledJob) => {
    runJob(job);
    const interval = setInterval(() => {
      setJobs(prev => {
        const current = prev.find(j => j.id === job.id);
        if (current && current.isActive) {
          runJob(current);
        }
        return prev;
      });
    }, job.intervalMs);
    intervalsRef.current.set(job.id, interval);
  }, [runJob]);

  const stopJob = useCallback((jobId: string) => {
    const interval = intervalsRef.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(jobId);
    }
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isActive: false, nextRun: null } : j));
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    stopJob(jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }, [stopJob]);

  const addJob = async () => {
    const input = customInput.trim() || lastInput;
    if (!input) return;

    if (notifyEnabled) {
      await requestNotificationPermission();
      setNotifPermission('Notification' in window ? Notification.permission : 'denied');
    }

    const job: ScheduledJob = {
      id: crypto.randomUUID(),
      input,
      mode,
      options: {},
      intervalMs: selectedInterval,
      isActive: true,
      lastRun: null,
      nextRun: Date.now() + selectedInterval,
      runCount: 0,
      maxRuns: maxRuns ? parseInt(maxRuns) : null,
      results: [],
      lastContentHash: null,
      notifyOnChange: notifyEnabled,
      changeCount: 0,
    };

    setJobs(prev => [...prev, job]);
    startJob(job);
    setCustomInput("");
  };

  const toggleJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    if (job.isActive) {
      stopJob(jobId);
    } else {
      const updated = { ...job, isActive: true, nextRun: Date.now() + job.intervalMs };
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
      startJob(updated);
    }
  };

  const toggleJobNotify = (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, notifyOnChange: !j.notifyOnChange } : j));
  };

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  const formatInterval = (ms: number) => {
    const opt = INTERVAL_OPTIONS.find(o => o.value === ms);
    return opt?.label || `${ms / 1000}s`;
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("pl-PL");
  };

  return (
    <div className="space-y-6">
      {/* Add new job */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-lg p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
          <Timer className="w-4 h-4" /> Nowe zaplanowane zadanie
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={lastInput || "URL lub zapytanie..."}
            className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground font-mono uppercase">Interwał</label>
              <div className="flex gap-1">
                {INTERVAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedInterval(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                      selectedInterval === opt.value
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-muted/30 text-muted-foreground border border-border/30 hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground font-mono uppercase">Max powtórzeń</label>
              <input
                type="number"
                value={maxRuns}
                onChange={(e) => setMaxRuns(e.target.value)}
                placeholder="∞"
                min="1"
                max="1000"
                className="w-20 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Notification toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono">Tryb: <span className="text-primary">{mode}</span></span>
            <button
              onClick={() => setNotifyEnabled(!notifyEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                notifyEnabled
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-muted/30 text-muted-foreground border border-border/30"
              }`}
            >
              {notifyEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {notifyEnabled ? "Powiadomienia ON" : "Powiadomienia OFF"}
            </button>
          </div>

          {notifyEnabled && notifPermission === 'denied' && (
            <div className="text-[10px] text-destructive/70 font-mono bg-destructive/10 rounded-md px-3 py-2">
              ⚠ Powiadomienia push są zablokowane w przeglądarce. Włącz je w ustawieniach.
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addJob}
            disabled={!customInput.trim() && !lastInput}
            className="w-full px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" /> Uruchom scheduled scraping
          </motion.button>
        </div>
      </motion.div>

      {/* Active jobs */}
      <AnimatePresence>
        {jobs.map(job => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`glass rounded-lg p-4 space-y-3 border ${job.isActive ? 'border-primary/30' : 'border-border/30'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2 h-2 rounded-full ${job.isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <span className="text-sm font-mono text-foreground truncate">{job.input}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary/60 flex-shrink-0">
                  {job.mode}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleJobNotify(job.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    job.notifyOnChange ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted/30'
                  }`}
                  title={job.notifyOnChange ? 'Powiadomienia włączone' : 'Powiadomienia wyłączone'}
                >
                  {job.notifyOnChange ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleJob(job.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    job.isActive ? 'text-destructive hover:bg-destructive/10' : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  {job.isActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteJob(job.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> Co {formatInterval(job.intervalMs)}</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {job.runCount}{job.maxRuns ? `/${job.maxRuns}` : ''} uruchomień</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ostatnio: {formatTime(job.lastRun)}</span>
              {job.changeCount > 0 && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <GitCompare className="w-3 h-3" /> {job.changeCount} zmian
                </span>
              )}
              {job.nextRun && job.isActive && (
                <span className="flex items-center gap-1 text-primary/60">Następne: {formatTime(job.nextRun)}</span>
              )}
            </div>

            {/* Mini results bar with change indicators */}
            {job.results.length > 0 && (
              <div className="flex gap-0.5 h-3">
                {job.results.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className={`flex-1 rounded-sm ${
                      r.status === 'error'
                        ? 'bg-destructive/60'
                        : r.changed
                          ? 'bg-yellow-500/80'
                          : 'bg-green-500/60'
                    }`}
                    title={`${new Date(r.timestamp).toLocaleTimeString()} - ${r.duration}ms - ${r.status}${r.changed ? ' - ZMIANA!' : ''}`}
                  />
                ))}
              </div>
            )}

            {/* Legend */}
            {job.results.length > 0 && (
              <div className="flex gap-3 text-[9px] font-mono text-muted-foreground/50">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/60 inline-block" /> bez zmian</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500/80 inline-block" /> zmiana</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive/60 inline-block" /> błąd</span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {jobs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 space-y-3"
        >
          <Timer className="w-8 h-8 text-muted-foreground/20 mx-auto" />
          <p className="text-sm text-muted-foreground/40 font-mono">
            Brak zaplanowanych zadań
          </p>
          <p className="text-[10px] text-muted-foreground/20 font-mono max-w-sm mx-auto">
            Dodaj zadanie powyżej, aby automatycznie powtarzać scraping w określonych interwałach.
            Otrzymasz powiadomienie gdy treść strony się zmieni!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ScheduledScraping;
