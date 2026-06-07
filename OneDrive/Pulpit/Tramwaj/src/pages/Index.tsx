import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ConnectionSearch from "@/components/ConnectionSearch";
import TransitMap from "@/components/TransitMap";
import TimetableDialog from "@/components/TimetableDialog";
import { loadGtfsData, type GtfsRoute, type GtfsData } from "@/data/gtfs";
import RealtimePanel from "@/components/RealtimePanel";
import DataFreshness from "@/components/DataFreshness";
import NotificationToggle from "@/components/NotificationToggle";
import AnimatedRouteGrid from "@/components/AnimatedRouteGrid";
import { useFavorites } from "@/hooks/use-favorites";
import { TrainFront, Bus, MapPin, Phone, Loader2, Star } from "lucide-react";

const Index = () => {
  const [data, setData] = useState<GtfsData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<GtfsRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGtfsData().then((d) => { setData(d); setLoading(false); });
  }, []);

  const { favorites, toggle, isFavorite } = useFavorites();

  const tramRoutes = useMemo(() => data?.routes.filter((r) => r.type === "tram") ?? [], [data]);
  const busRoutes = useMemo(() => data?.routes.filter((r) => r.type === "bus") ?? [], [data]);
  const favoriteRoutes = useMemo(
    () => data?.routes.filter((r) => favorites.includes(r.id)) ?? [],
    [data, favorites]
  );
  const routeNames = useMemo(
    () => Object.fromEntries(data?.routes.map((r) => [r.id, `Linia ${r.num}`]) ?? []),
    [data]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-primary" size={40} />
          <span className="ml-3 text-muted-foreground font-heading text-lg">Ładowanie rozkładów ZDiTM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ConnectionSearch routes={data?.routes ?? []} allStops={data?.allStops ?? []} onRouteSelect={setSelectedRoute} />
      <RealtimePanel />

      {/* Favorite Routes */}
      {favoriteRoutes.length > 0 && (
        <section id="ulubione" className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-400/10">
              <Star className="text-amber-400 fill-amber-400" size={22} />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Ulubione</h2>
            <span className="text-sm text-muted-foreground ml-1">({favoriteRoutes.length})</span>
            <div className="ml-auto">
              <NotificationToggle favoriteRouteIds={favorites} routeNames={routeNames} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Twoje zapisane linie – kliknij ★ na karcie, aby dodać lub usunąć</p>
          <AnimatedRouteGrid
            routes={favoriteRoutes}
            onRouteSelect={setSelectedRoute}
            onToggleFavorite={toggle}
            allFavorite
          />
        </section>
      )}

      {/* Tram Routes */}
      <section id="tramwaje" className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-tram/10">
            <TrainFront className="text-tram" size={22} />
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Tramwaje</h2>
          <span className="text-sm text-muted-foreground ml-1">({tramRoutes.length} linii)</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Kliknij linię, aby zobaczyć przystanki i rozkład jazdy</p>
        <AnimatedRouteGrid
          routes={tramRoutes}
          onRouteSelect={setSelectedRoute}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
        />
      </section>

      {/* Bus Routes */}
      <section id="autobusy" className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bus/10">
            <Bus className="text-bus" size={22} />
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Autobusy</h2>
          <span className="text-sm text-muted-foreground ml-1">({busRoutes.length} linii)</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Kliknij linię, aby zobaczyć przystanki i rozkład jazdy</p>
        <AnimatedRouteGrid
          routes={busRoutes}
          onRouteSelect={setSelectedRoute}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
        />
      </section>

      <TransitMap />

      {/* Contact */}
      <section id="kontakt" className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Kontakt ZDiTM</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 bg-card p-4 rounded-lg border">
              <MapPin className="text-primary mt-1 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-foreground">Adres</p>
                <p className="text-sm text-muted-foreground">ul. Klonowica 5, 71-241 Szczecin</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-card p-4 rounded-lg border">
              <Phone className="text-primary mt-1 shrink-0" size={20} />
              <div>
                <p className="font-semibold text-foreground">Telefon</p>
                <p className="text-sm text-muted-foreground">+48 91 311 22 33</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground/5 border-t py-6">
        <div className="container mx-auto px-4 flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <DataFreshness generatedAt={data?.generatedAt} />
          <div>
            © 2026 KaczTransit · Dane:{" "}
            <a href="https://www.zditm.szczecin.pl/pl/zditm/dla-programistow/gtfs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              ZDiTM Szczecin (GTFS)
            </a>
            {" "}· Licencja CC0 1.0
          </div>
        </div>
      </footer>

      {selectedRoute && (
        <TimetableDialog route={selectedRoute} onClose={() => setSelectedRoute(null)} />
      )}
    </div>
  );
};

export default Index;
