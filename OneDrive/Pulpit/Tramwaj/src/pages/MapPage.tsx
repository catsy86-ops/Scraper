/**
 * MapPage — "Mapa" tab.
 * Full-screen live transit map.
 */
import AppLayout from "@/components/AppLayout";
import TransitMap from "@/components/TransitMap";

export default function MapPage() {
  return (
    <AppLayout title="Mapa na żywo">
      {/* Make map fill the viewport height minus top bar + bottom nav */}
      <div className="h-[calc(100dvh-56px-80px)] md:h-[calc(100dvh-56px)]">
        <TransitMap />
      </div>
    </AppLayout>
  );
}
