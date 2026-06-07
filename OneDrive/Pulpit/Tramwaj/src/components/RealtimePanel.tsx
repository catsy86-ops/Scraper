import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Radio, MapPin, Clock, RefreshCw, Wifi, WifiOff, TrainFront, Bus, ChevronDown, ChevronUp } from "lucide-react";
import { fetchGtfsRt, type GtfsRtData, type ServiceAlert } from "@/data/gtfs-rt";

const RealtimePanel = () => {
  const [data, setData] = useState<GtfsRtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAlerts, setExpandedAlerts] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rt = await fetchGtfsRt();
      setData(rt);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [refresh]);

  if (!data && loading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-xl border p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  if (data?.errors && !data.vehicles.length && !data.tripUpdates.length && !data.alerts.length) {
    return (
      <section className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-xl border p-5 flex items-center gap-3 text-muted-foreground">
          <WifiOff size={20} />
          <span className="text-sm">Dane czasu rzeczywistego chwilowo niedostępne</span>
          <button onClick={refresh} className="ml-auto text-primary hover:underline text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> Ponów
          </button>
        </div>
      </section>
    );
  }

  const delayedTrips = data?.tripUpdates.filter((t) =>
    t.stopUpdates.some((s) => s.departureDelay > 120)
  ) || [];

  const avgDelay = data?.tripUpdates.length
    ? Math.round(
        data.tripUpdates
          .flatMap((t) => t.stopUpdates.map((s) => s.departureDelay))
          .filter((d) => d > 0)
          .reduce((sum, d, _, arr) => sum + d / arr.length, 0)
      )
    : 0;

  const activeAlerts = data?.alerts.filter((a) => {
    const now = Date.now() / 1000;
    return a.activePeriods.length === 0 || a.activePeriods.some((p) => now >= p.start && (p.end === 0 || now <= p.end));
  }) || [];

  const visibleAlerts = expandedAlerts ? activeAlerts : activeAlerts.slice(0, 3);

  return (
    <section id="realtime" className="container mx-auto px-4 py-6">
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary/5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Radio size={18} className="text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <h2 className="font-heading font-bold text-foreground text-lg">Dane na żywo</h2>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="text-xs text-muted-foreground">
                {data.lastUpdated.toLocaleTimeString("pl-PL")}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3 p-4">
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <MapPin className="text-primary" size={18} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{data?.vehicles.length || 0}</p>
              <p className="text-xs text-muted-foreground">Pojazdów na trasie</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${delayedTrips.length > 0 ? "bg-destructive/10" : "bg-green-500/10"}`}>
              <Clock className={delayedTrips.length > 0 ? "text-destructive" : "text-green-600"} size={18} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">
                {avgDelay > 0 ? `+${Math.floor(avgDelay / 60)} min` : "OK"}
              </p>
              <p className="text-xs text-muted-foreground">
                {delayedTrips.length > 0 ? `${delayedTrips.length} opóźnionych` : "Punktualnie"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${activeAlerts.length > 0 ? "bg-amber-500/10" : "bg-green-500/10"}`}>
              <AlertTriangle className={activeAlerts.length > 0 ? "text-amber-600" : "text-green-600"} size={18} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{activeAlerts.length}</p>
              <p className="text-xs text-muted-foreground">
                {activeAlerts.length === 1 ? "Alert" : activeAlerts.length > 1 && activeAlerts.length < 5 ? "Alerty" : "Alertów"}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts list */}
        {activeAlerts.length > 0 && (
          <div className="border-t px-4 py-3">
            <div className="space-y-2">
              {visibleAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
            {activeAlerts.length > 3 && (
              <button
                onClick={() => setExpandedAlerts(!expandedAlerts)}
                className="flex items-center gap-1.5 text-xs text-primary mt-2 hover:underline"
              >
                {expandedAlerts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expandedAlerts ? "Zwiń" : `Pokaż wszystkie (${activeAlerts.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const AlertCard = ({ alert }: { alert: ServiceAlert }) => (
  <div className="flex gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{alert.headerText}</p>
      {alert.descriptionText && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.descriptionText}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {alert.effect && (
          <span className="text-[10px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded font-medium">{alert.effect}</span>
        )}
        {alert.routeIds.slice(0, 5).map((id) => (
          <span key={id} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">{id}</span>
        ))}
      </div>
    </div>
  </div>
);

export default RealtimePanel;
