import type { GtfsRoute } from "@/data/gtfs";
import RouteCard from "@/components/RouteCard";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface AnimatedRouteGridProps {
  routes: GtfsRoute[];
  onRouteSelect: (route: GtfsRoute) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  allFavorite?: boolean;
}

const AnimatedRouteGrid = ({
  routes,
  onRouteSelect,
  isFavorite,
  onToggleFavorite,
  allFavorite,
}: AnimatedRouteGridProps) => {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.05);

  return (
    <div
      ref={ref}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {routes.map((r, i) => (
        <RouteCard
          key={r.id}
          route={r}
          onClick={() => onRouteSelect(r)}
          isFavorite={allFavorite || isFavorite?.(r.id)}
          onToggleFavorite={onToggleFavorite}
          animationDelay={visible ? Math.min(i * 50, 500) : 0}
        />
      ))}
      {!visible && (
        <style>{`
          [data-pending-animation] { opacity: 0 !important; animation: none !important; }
        `}</style>
      )}
    </div>
  );
};

export default AnimatedRouteGrid;
