/**
 * LinesPage — "Linie" tab.
 * Searchable list of all tram + bus routes with filter tabs.
 */
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrainFront, Bus, Star, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import RouteCard from "@/components/RouteCard";
import TimetableDialog from "@/components/TimetableDialog";
import { loadGtfsData, type GtfsRoute, type GtfsData } from "@/data/gtfs";
import { useFavorites } from "@/hooks/use-favorites";

type Filter = "all" | "tram" | "bus" | "fav";

export default function LinesPage() {
  const [data,      setData]      = useState<GtfsData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState("");
  const [selected,  setSelected]  = useState<GtfsRoute | null>(null);
  const [searchParams] = useSearchParams();

  const initFilter = (searchParams.get("type") as Filter) ?? "all";
  const [filter, setFilter] = useState<Filter>(initFilter);

  const { favorites, toggle, isFavorite } = useFavorites();

  useEffect(() => {
    loadGtfsData().then(d => { setData(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let routes = data.routes;
    if (filter === "tram") routes = routes.filter(r => r.type === "tram");
    else if (filter === "bus") routes = routes.filter(r => r.type === "bus");
    else if (filter === "fav") routes = routes.filter(r => favorites.includes(r.id));
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      routes = routes.filter(r =>
        r.num.includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q),
      );
    }
    return routes;
  }, [data, filter, query, favorites]);

  const tabs: { id: Filter; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "all",  label: "Wszystkie", icon: null,
      count: data?.routes.length },
    { id: "tram", label: "Tramwaje",  icon: <TrainFront size={14} />,
      count: data?.routes.filter(r => r.type === "tram").length },
    { id: "bus",  label: "Autobusy",  icon: <Bus size={14} />,
      count: data?.routes.filter(r => r.type === "bus").length },
    { id: "fav",  label: "Ulubione",  icon: <Star size={14} />,
      count: favorites.length },
  ];

  return (
    <AppLayout title="Linie">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj linii, przystanku…"
            className="w-full bg-muted/60 rounded-2xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none border-2 border-transparent focus:border-primary/30 focus:bg-background transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground p-1">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs — horizontal scroll */}
      <div className="px-4 pb-3 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}>
              {tab.icon}
              {tab.label}
              {tab.count != null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === tab.id ? "bg-white/20" : "bg-muted-foreground/15"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Search size={24} className="text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Brak wyników</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {filter === "fav" ? "Nie masz jeszcze ulubionych linii" : "Spróbuj zmienić filtry lub zapytanie"}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={filter + query}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 grid gap-2 pb-4"
          >
            {filtered.map((route, i) => (
              <RouteCard
                key={route.id}
                route={route}
                onClick={() => setSelected(route)}
                isFavorite={isFavorite(route.id)}
                onToggleFavorite={toggle}
                animationDelay={Math.min(i * 30, 300)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {selected && <TimetableDialog route={selected} onClose={() => setSelected(null)} />}
    </AppLayout>
  );
}
