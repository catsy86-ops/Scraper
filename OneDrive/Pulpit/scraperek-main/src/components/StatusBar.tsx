import { motion } from "framer-motion";
import { Activity, Clock, Zap, BarChart3, TrendingUp } from "lucide-react";
import { useScraperStore } from "@/store/scraperStore";
import { useMemo } from "react";

const StatusBar = () => {
  const { history, totalRequests, lastTime, isLoading } = useScraperStore();

  const stats = useMemo(() => {
    const successHistory = history.filter(e => e.status === 'success');
    return {
      avgTime: successHistory.length > 0
        ? Math.round(successHistory.reduce((a, e) => a + e.duration, 0) / successHistory.length)
        : 0,
      successRate: history.length > 0
        ? Math.round((successHistory.length / history.length) * 100)
        : 100,
    };
  }, [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap items-center gap-3 md:gap-5 px-4 py-2.5 glass-strong rounded-lg text-xs font-mono"
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-2 h-2 rounded-full ${isLoading ? 'bg-primary animate-pulse' : 'bg-neon-green'}`}
        />
        <span className="text-muted-foreground">
          {isLoading ? "Przetwarzanie..." : "Połączono"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <Zap className="w-3 h-3 text-primary/60" />
        <span>Zapytań: <span className="text-foreground">{totalRequests}</span></span>
      </div>

      {lastTime !== undefined && (
        <motion.div
          key={lastTime}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Clock className="w-3 h-3 text-primary/60" />
          <span>Ostatni: <span className="text-foreground">{lastTime}ms</span></span>
        </motion.div>
      )}

      {stats.avgTime > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="w-3 h-3 text-primary/60" />
          <span>Średnio: <span className="text-foreground">{stats.avgTime}ms</span></span>
        </div>
      )}

      {history.length > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="w-3 h-3 text-neon-green/60" />
          <span className={stats.successRate >= 80 ? 'text-neon-green' : 'text-destructive'}>
            {stats.successRate}%
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-muted-foreground ml-auto">
        <Activity className="w-3 h-3 text-primary/60" />
        <span>Firecrawl v1</span>
      </div>
    </motion.div>
  );
};

export default StatusBar;
