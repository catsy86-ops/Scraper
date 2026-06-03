import { motion } from "framer-motion";
import { Globe, Loader2, CheckCircle2, XCircle, Clock, Coins } from "lucide-react";
import type { CrawlProgress as CrawlProgressType } from "@/store/scraperStore";

interface Props {
  progress: CrawlProgressType;
}

const CrawlProgress = ({ progress }: Props) => {
  const { status, completed, total, creditsUsed, startedAt, currentUrl, jobId } = progress;
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  const rate = elapsed > 0 ? completed / elapsed : 0;
  const remaining = rate > 0 && total > completed ? Math.round((total - completed) / rate) : null;

  const statusConfig = {
    starting:  { label: "Inicjalizacja...", icon: Loader2, color: "text-primary",     spin: true  },
    scraping:  { label: "Scrapowanie",      icon: Globe,   color: "text-primary",     spin: false },
    completed: { label: "Ukończono",        icon: CheckCircle2, color: "text-neon-green", spin: false },
    failed:    { label: "Błąd",             icon: XCircle, color: "text-destructive", spin: false },
    cancelled: { label: "Anulowano",        icon: XCircle, color: "text-muted-foreground", spin: false },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass rounded-lg p-4 space-y-3 border border-primary/20"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${statusConfig.color} ${statusConfig.spin ? 'animate-spin' : ''}`} />
          <span className={`text-xs font-mono uppercase tracking-wider ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {elapsed}s
          </span>
          {remaining !== null && status === 'scraping' && (
            <span>ETA: ~{remaining}s</span>
          )}
          {creditsUsed !== undefined && (
            <span className="flex items-center gap-1 text-accent">
              <Coins className="w-3 h-3" /> {creditsUsed}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs font-mono">
          <span className="text-foreground">
            <span className="text-primary font-bold text-base">{completed}</span>
            <span className="text-muted-foreground"> / {total} URL</span>
          </span>
          <span className="text-primary font-mono">{pct}%</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {status === 'scraping' && (
            <motion.div
              className="absolute inset-y-0 w-12 bg-white/20"
              animate={{ left: ["-10%", "110%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-muted-foreground/70">
        <div className="flex items-center gap-3">
          <span>✓ {completed} przetworzonych</span>
          <span>⧗ {Math.max(0, total - completed)} w kolejce</span>
        </div>
        {jobId && (
          <span className="text-muted-foreground/40 truncate max-w-[120px]" title={jobId}>
            #{jobId.slice(0, 8)}
          </span>
        )}
      </div>

      {currentUrl && status === 'scraping' && (
        <motion.div
          key={currentUrl}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-mono text-primary/60 truncate border-t border-border/20 pt-2"
          title={currentUrl}
        >
          → {currentUrl}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CrawlProgress;
