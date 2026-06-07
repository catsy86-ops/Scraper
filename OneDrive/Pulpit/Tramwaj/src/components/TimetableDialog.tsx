import { useState, useEffect } from "react";
import { X, Clock, TrainFront, Bus, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Radio } from "lucide-react";
import type { GtfsRoute } from "@/data/gtfs";
import { fetchGtfsRt, getRouteDelay, getRouteVehicles, getRouteAlerts, type GtfsRtData } from "@/data/gtfs-rt";

interface TimetableDialogProps {
  route: GtfsRoute;
  onClose: () => void;
}

const TimetableDialog = ({ route, onClose }: TimetableDialogProps) => {
  const [expandedStop, setExpandedStop] = useState<number>(0);
  const [rtData, setRtData] = useState<GtfsRtData | null>(null);
  const isTram = route.type === "tram";

  useEffect(() => {
    fetchGtfsRt().then(setRtData);
  }, []);

  const delay = rtData ? getRouteDelay(route.id, rtData.tripUpdates) : null;
  const vehicles = rtData ? getRouteVehicles(route.id, rtData.vehicles) : [];
  const alerts = rtData ? getRouteAlerts(route.id, rtData.alerts) : [];

  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const getNextDepartures = (departures: string[]) => {
    return departures.filter((d) => d >= currentTimeStr).slice(0, 6);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className={`p-5 border-b ${isTram ? "bg-tram/5" : "bg-bus/5"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-xl font-heading font-bold text-xl"
                style={{ backgroundColor: `#${route.color}`, color: '#fff' }}
              >
                {route.num}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isTram ? <TrainFront size={16} className="text-tram" /> : <Bus size={16} className="text-bus" />}
                  <span className="font-heading font-bold text-foreground text-lg leading-tight">{route.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {route.stops.length} przystanków
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X size={20} />
            </button>
          </div>
          {route.url && (
            <a href={route.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary mt-3 hover:underline">
              <ExternalLink size={12} /> Oficjalny rozkład ZDiTM
            </a>
          )}

          {/* Real-time info strip */}
          {rtData && (
            <div className="flex flex-wrap gap-2 mt-3">
              {vehicles.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-md font-medium">
                  <Radio size={10} className="animate-pulse" /> {vehicles.length} {vehicles.length === 1 ? "pojazd" : "pojazdów"} na trasie
                </span>
              )}
              {delay !== null && delay > 60 && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md font-medium">
                  <Clock size={10} /> Opóźnienie ~{Math.floor(delay / 60)} min
                </span>
              )}
              {delay !== null && delay <= 60 && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/10 text-green-700 px-2 py-1 rounded-md font-medium">
                  <Clock size={10} /> Punktualnie
                </span>
              )}
            </div>
          )}

          {/* Alerts for this route */}
          {alerts.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {alerts.slice(0, 2).map((alert) => (
                <div key={alert.id} className="flex gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2">
                  <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground line-clamp-2">{alert.headerText}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stops list */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-0.5">
            {route.stops.map((stop, idx) => {
              const isExpanded = expandedStop === idx;
              const nextDeps = getNextDepartures(stop.d);
              const isFirst = idx === 0;
              const isLast = idx === route.stops.length - 1;

              return (
                <div key={`${stop.n}-${idx}`} className="relative">
                  {!isLast && (
                    <div className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${isTram ? "bg-tram/20" : "bg-bus/20"}`} />
                  )}

                  <button
                    onClick={() => setExpandedStop(isExpanded ? -1 : idx)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`relative z-10 w-[10px] h-[10px] rounded-full border-2 shrink-0 ${
                      isFirst || isLast
                        ? isTram ? "bg-tram border-tram" : "bg-bus border-bus"
                        : "bg-card border-muted-foreground/40"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${isFirst || isLast ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {stop.n}
                      </span>
                      {nextDeps.length > 0 && !isExpanded && (
                        <span className="text-xs text-muted-foreground ml-2">→ {nextDeps[0]}</span>
                      )}
                    </div>
                    {stop.d.length > 0 && (
                      isExpanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && stop.d.length > 0 && (
                    <div className="ml-10 mr-2 mb-2 mt-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Najbliższe odjazdy</span>
                      </div>
                      {nextDeps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {nextDeps.map((dep, i) => (
                            <span
                              key={dep}
                              className={`text-sm font-mono px-2.5 py-1 rounded-md font-medium ${
                                i === 0
                                  ? "text-primary-foreground"
                                  : "bg-card text-foreground border"
                              }`}
                              style={i === 0 ? { backgroundColor: `#${route.color}` } : undefined}
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Brak odjazdów na dziś</p>
                      )}

                      <details className="mt-3">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                          Pełny rozkład jazdy
                        </summary>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {Object.entries(
                            stop.d.reduce<Record<string, string[]>>((acc, dep) => {
                              const [hour, min] = dep.split(":");
                              if (!acc[hour]) acc[hour] = [];
                              acc[hour].push(min);
                              return acc;
                            }, {})
                          ).map(([hour, mins]) => (
                            <div key={hour} className="flex gap-2 text-xs">
                              <span className="font-bold text-foreground w-6 text-right">{hour}</span>
                              <span className="text-muted-foreground font-mono">{mins.join(" ")}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableDialog;
