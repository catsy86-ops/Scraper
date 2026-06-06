import { useMemo, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, CheckCircle, XCircle, TrendingUp, Activity, FileDown, Filter, Zap } from "lucide-react";
import { useScraperStore } from "@/store/scraperStore";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, LineChart, Line, Legend,
} from "recharts";

const CHART_COLORS = {
  primary: "hsl(174, 100%, 50%)",
  success: "hsl(150, 100%, 50%)",
  error: "hsl(0, 84%, 60%)",
  accent: "hsl(280, 100%, 65%)",
  muted: "hsl(220, 10%, 50%)",
  warn: "hsl(45, 100%, 55%)",
};

const tooltipStyle = {
  background: 'hsl(220,20%,7%)',
  border: '1px solid hsl(220,20%,14%)',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'JetBrains Mono',
};

type TimeFilter = 'all' | '1h' | '24h' | '7d';

const Dashboard = () => {
  const { history, totalRequests } = useScraperStore();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const filteredHistory = useMemo(() => {
    if (timeFilter === 'all') return history;
    const now = Date.now();
    const ms: Record<string, number> = { '1h': 3600000, '24h': 86400000, '7d': 604800000 };
    return history.filter(h => now - h.timestamp < ms[timeFilter]);
  }, [history, timeFilter]);

  const exportToPdf = useCallback(async () => {
    if (!dashboardRef.current) return;
    const toastId = toast.loading("Generowanie PDF...");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(dashboardRef.current, { backgroundColor: "#0a0f1a", scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`scraper-kaczy-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF wyeksportowany!", { id: toastId });
    } catch {
      toast.error("Nie udało się wygenerować PDF", { id: toastId });
    }
  }, []);

  const stats = useMemo(() => {
    const successes = filteredHistory.filter(h => h.status === 'success');
    const errors = filteredHistory.filter(h => h.status === 'error');
    const avgTime = successes.length ? Math.round(successes.reduce((a, h) => a + h.duration, 0) / successes.length) : 0;
    const successRate = filteredHistory.length ? Math.round((successes.length / filteredHistory.length) * 100) : 0;
    const fastest = successes.length ? Math.min(...successes.map(h => h.duration)) : 0;
    const slowest = successes.length ? Math.max(...successes.map(h => h.duration)) : 0;
    return { successes: successes.length, errors: errors.length, avgTime, successRate, fastest, slowest };
  }, [filteredHistory]);

  const modeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredHistory.forEach(h => { counts[h.mode] = (counts[h.mode] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredHistory]);

  const timelineData = useMemo(() => {
    const last30 = filteredHistory.slice(0, 30).reverse();
    return last30.map((h, i) => ({
      idx: i + 1,
      duration: h.duration,
      status: h.status,
      mode: h.mode,
      time: new Date(h.timestamp).toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [filteredHistory]);

  const hourlyData = useMemo(() => {
    const hours: Record<number, { total: number; success: number; error: number }> = {};
    filteredHistory.forEach(h => {
      const hour = new Date(h.timestamp).getHours();
      if (!hours[hour]) hours[hour] = { total: 0, success: 0, error: 0 };
      hours[hour].total++;
      hours[hour][h.status === 'success' ? 'success' : 'error']++;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      success: hours[i]?.success || 0,
      error: hours[i]?.error || 0,
    }));
  }, [filteredHistory]);

  const performanceData = useMemo(() => {
    const byMode: Record<string, number[]> = {};
    filteredHistory.filter(h => h.status === 'success').forEach(h => {
      if (!byMode[h.mode]) byMode[h.mode] = [];
      byMode[h.mode].push(h.duration);
    });
    return Object.entries(byMode).map(([mode, durations]) => ({
      mode,
      avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      min: Math.min(...durations),
      max: Math.max(...durations),
    }));
  }, [filteredHistory]);

  const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.accent, CHART_COLORS.success, CHART_COLORS.muted];
  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'Wszystko' },
    { key: '1h', label: '1h' },
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
  ];

  const statCards = [
    { label: "Zapytania", value: filteredHistory.length, icon: Activity, color: "text-primary" },
    { label: "Sukces", value: `${stats.successRate}%`, icon: CheckCircle, color: "text-neon-green" },
    { label: "Śr. czas", value: `${stats.avgTime}ms`, icon: Clock, color: "text-accent" },
    { label: "Błędy", value: stats.errors, icon: XCircle, color: "text-destructive" },
    { label: "Najszybszy", value: `${stats.fastest}ms`, icon: Zap, color: "text-primary" },
    { label: "Najwolniejszy", value: `${stats.slowest}ms`, icon: TrendingUp, color: "text-accent" },
  ];

  if (history.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-3">
        <BarChart3 className="w-8 h-8 text-muted-foreground/20 mx-auto" />
        <p className="text-sm text-muted-foreground/40 font-mono">Brak danych do wyświetlenia</p>
        <p className="text-[10px] text-muted-foreground/20 font-mono">Wykonaj kilka zapytań, aby zobaczyć statystyki</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
          {timeFilters.map(f => (
            <button key={f.key} onClick={() => setTimeFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${timeFilter === f.key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={exportToPdf} className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-xs font-mono text-primary hover:bg-primary/10 transition-colors">
          <FileDown className="w-4 h-4" /> Eksport PDF
        </button>
      </div>

      <div ref={dashboardRef} className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</span>
              </div>
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Response time timeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" /> Czas odpowiedzi (ostatnie 30)
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="gradDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,20%,14%)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: CHART_COLORS.muted }} />
                <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.muted }} unit="ms" />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: CHART_COLORS.primary }} />
                <Area type="monotone" dataKey="duration" stroke={CHART_COLORS.primary} fill="url(#gradDuration)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Mode distribution */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" /> Rozkład trybów
            </div>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={modeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3} stroke="none">
                    {modeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {modeData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </motion.div>

          {/* Hourly activity with success/error stacked */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Aktywność godzinowa
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,20%,14%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 8, fill: CHART_COLORS.muted }} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.muted }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="success" stackId="a" fill={CHART_COLORS.success} radius={[0, 0, 0, 0]} name="Sukces" />
                  <Bar dataKey="error" stackId="a" fill={CHART_COLORS.error} radius={[4, 4, 0, 0]} name="Błąd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Performance by mode */}
        {performanceData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" /> Wydajność wg trybu
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,20%,14%)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.muted }} unit="ms" />
                  <YAxis type="category" dataKey="mode" tick={{ fontSize: 11, fill: CHART_COLORS.muted }} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="min" fill={CHART_COLORS.success} name="Min" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="avg" fill={CHART_COLORS.primary} name="Średni" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="max" fill={CHART_COLORS.accent} name="Max" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
