/**
 * HomePage — "Start" tab.
 * Mobile-first hero + quick stats + realtime overview + favorites.
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrainFront, Bus, Star, Radio, AlertTriangle,
  Clock, MapPin, ChevronRight, Loader2, RefreshCw, Navigation,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import AnimatedRouteGrid from "@/components/AnimatedRouteGrid";
import TimetableDialog from "@/components/TimetableDialog";
import NotificationToggle from "@/components/NotificationToggle";
import DataFreshness from "@/components/DataFreshness";
import { loadGtfsData, type GtfsRoute, type GtfsData } from "@/data/gtfs";
import { fetchGtfsRt, type GtfsRtData } from "@/data/gtfs-rt";
import { useFavorites } from "@/hooks/use-favorites";

export default function HomePage() {
  const [data,     setData]     = useState<GtfsData | null>(null);
  const [rtData,   setRtData]   = useState<GtfsRtData | null>(null);
  const [rtLoad,   setRtLoad]   = useState(true);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<GtfsRoute | null>(null);

  const { favorites, toggle, isFavorite } = useFavorites();

  useEffect(() => {
    loadGtfsData().then(d => { setData(d); setLoading(false); });
  }, []);

  const refreshRt = async () => {
    setRtLoad(true);
    try { setRtData(await fetchGtfsRt()); } finally { setRtLoad(false); }
  };

  useEffect(() => {
    refreshRt();
    const iv = setInterval(refreshRt, 30_000);
    return () => clearInterval(iv);
  }, []);

  const favoriteRoutes = useMemo(
    () => data?.routes.filter(r => favorites.includes(r.id)) ?? [],
    [data, favorites],
  );
  const routeNames = useMemo(
    () => Object.fromEntries(data?.routes.map(r => [r.id, `Linia ${r.num}`]) ?? []),
    [data],
  );

  // RT quick stats
  const vehicles   = rtData?.vehicles.length ?? 0;
  const alerts     = rtData?.alerts.filter(a => {
    const now = Date.now() / 1000;
    return !a.activePeriods.length || a.activePeriods.some(p => now >= p.start && (!p.end || now <= p.end));
  }) ?? [];
  const avgDelaySec = rtData?.tripUpdates.length
    ? Math.round(
        rtData.tripUpdates
          .flatMap(t => t.stopUpdates.map(s => s.departureDelay))
          .filter(d => d > 0)
          .reduce((sum, d, _, arr) => sum + d / arr.length, 0),
      )
    : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-muted-foreground text-sm">Ładowanie rozkładów ZDiTM…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5 px-4 pt-6 pb-8">
        <motion.div className="flex items-start justify-between"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
              🚊 ZDiTM Szczecin
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-foreground leading-tight">
              Cześć! 👋<br />
              <span className="text-primary">Dokąd jedziesz?</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Rozkłady tramwajów i autobusów w Szczecinie na żywo.
            </p>
          </div>
          <motion.div
            className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl shrink-0"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            🦆
          </motion.div>
        </motion.div>

        {/* Quick action buttons */}
        <motion.div className="flex gap-3 mt-5"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link to="/polaczenia"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 font-heading font-semibold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <Navigation size={18} /> Znajdź połączenie
          </Link>
          <Link to="/linie"
            className="flex items-center justify-center gap-2 bg-card border border-border text-foreground rounded-2xl px-4 py-3.5 font-medium text-sm active:scale-95 transition-transform">
            <TrainFront size={18} />
          </Link>
        </motion.div>

        {/* Decorative blob */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ── RT STATS STRIP ── */}
      <section className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inset-0 rounded-full bg-emerald-500 opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-foreground">Na żywo</span>
            {rtData && (
              <span className="text-[10px] text-muted-foreground">
                · {rtData.lastUpdated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <button onClick={refreshRt} disabled={rtLoad}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40">
            <RefreshCw size={13} className={rtLoad ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={<MapPin size={16} className="text-primary" />}
            value={rtLoad ? "…" : String(vehicles)}
            label="Pojazdów"
            bg="bg-primary/8"
          />
          <StatCard
            icon={<Clock size={16} className={avgDelaySec > 120 ? "text-destructive" : "text-emerald-600"} />}
            value={rtLoad ? "…" : avgDelaySec > 60 ? `+${Math.floor(avgDelaySec / 60)}m` : "OK"}
            label="Opóźnienie"
            bg={avgDelaySec > 120 ? "bg-destructive/8" : "bg-emerald-500/8"}
          />
          <StatCard
            icon={<AlertTriangle size={16} className={alerts.length > 0 ? "text-amber-500" : "text-emerald-600"} />}
            value={rtLoad ? "…" : String(alerts.length)}
            label="Alertów"
            bg={alerts.length > 0 ? "bg-amber-500/8" : "bg-emerald-500/8"}
          />
        </div>

        {/* Active alerts preview */}
        {alerts.length > 0 && (
          <div className="mt-2 space-y-2">
            {alerts.slice(0, 2).map(a => (
              <div key={a.id} className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground line-clamp-2">{a.headerText}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FAVORITES ── */}
      {favoriteRoutes.length > 0 && (
        <section className="px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <h2 className="font-heading font-semibold text-foreground">Ulubione</h2>
              <span className="text-xs text-muted-foreground">({favoriteRoutes.length})</span>
            </div>
            <NotificationToggle favoriteRouteIds={favorites} routeNames={routeNames} />
          </div>
          <AnimatedRouteGrid
            routes={favoriteRoutes}
            onRouteSelect={setSelected}
            onToggleFavorite={toggle}
            allFavorite
          />
        </section>
      )}

      {/* ── QUICK ACCESS ── */}
      <section className="px-4 pt-6">
        <h2 className="font-heading font-semibold text-foreground mb-3">Szybki dostęp</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLink to="/linie?type=tram" icon={<TrainFront size={20} className="text-tram" />}
            label="Tramwaje" sublabel={`${data?.routes.filter(r => r.type === "tram").length ?? 0} linii`}
            color="bg-tram/8 border-tram/20" />
          <QuickLink to="/linie?type=bus" icon={<Bus size={20} className="text-bus" />}
            label="Autobusy" sublabel={`${data?.routes.filter(r => r.type === "bus").length ?? 0} linii`}
            color="bg-bus/8 border-bus/20" />
          <QuickLink to="/polaczenia" icon={<Navigation size={20} className="text-primary" />}
            label="Wyszukaj" sublabel="Połączenia" color="bg-primary/8 border-primary/20" />
          <QuickLink to="/mapa" icon={<MapPin size={20} className="text-emerald-600" />}
            label="Mapa" sublabel="Pojazdy na żywo" color="bg-emerald-500/8 border-emerald-500/20" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-4 pt-8 pb-4">
        <div className="flex flex-col items-center gap-2">
          <DataFreshness generatedAt={data?.generatedAt} />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            © 2026 KaczTransit · Dane: ZDiTM Szczecin (GTFS) · CC0 1.0
          </p>
        </div>
      </footer>

      {selected && <TimetableDialog route={selected} onClose={() => setSelected(null)} />}
    </AppLayout>
  );
}

function StatCard({ icon, value, label, bg }: { icon: React.ReactNode; value: string; label: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-3 flex flex-col gap-1`}>
      {icon}
      <p className="font-heading font-bold text-lg text-foreground leading-none mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function QuickLink({ to, icon, label, sublabel, color }: {
  to: string; icon: React.ReactNode; label: string; sublabel: string; color: string;
}) {
  return (
    <Link to={to}
      className={`${color} border rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="font-heading font-semibold text-sm text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
      </div>
      <ChevronRight size={14} className="text-muted-foreground/40 ml-auto shrink-0" />
    </Link>
  );
}
