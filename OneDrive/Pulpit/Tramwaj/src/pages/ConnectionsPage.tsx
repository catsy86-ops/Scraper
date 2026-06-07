/**
 * ConnectionsPage — "Połączenia" tab.
 * Full-screen connection search, JakDojade-style.
 */
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ConnectionSearch from "@/components/ConnectionSearch";
import TimetableDialog from "@/components/TimetableDialog";
import { loadGtfsData, type GtfsRoute, type GtfsData } from "@/data/gtfs";

export default function ConnectionsPage() {
  const [data,     setData]     = useState<GtfsData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<GtfsRoute | null>(null);

  useEffect(() => {
    loadGtfsData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <AppLayout title="Wyszukaj połączenie">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-muted-foreground text-sm">Ładowanie…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Wyszukaj połączenie">
      <ConnectionSearch
        routes={data?.routes ?? []}
        allStops={data?.allStops ?? []}
        onRouteSelect={setSelected}
      />
      {selected && <TimetableDialog route={selected} onClose={() => setSelected(null)} />}
    </AppLayout>
  );
}
