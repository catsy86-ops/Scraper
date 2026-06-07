import { Bus, TrainFront, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { GtfsRoute } from "@/data/gtfs";

interface RouteCardProps {
  route: GtfsRoute;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (routeId: string) => void;
  animationDelay?: number;
}

const RouteCard = ({ route, onClick, isFavorite, onToggleFavorite, animationDelay = 0 }: RouteCardProps) => {
  const isTram = route.type === "tram";
  return (
    <div
      className="group bg-card rounded-lg border hover:shadow-lg transition-all duration-200 overflow-hidden w-full text-left relative opacity-0 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "forwards" }}
    >
      <Link
        to={`/route/${route.id}`}
        className="flex items-center gap-3 p-4 cursor-pointer"
        style={{ borderLeft: `4px solid #${route.color}` }}
        onClick={onClick}
      >
        <div
          className="flex items-center justify-center w-12 h-12 rounded-lg font-heading font-bold text-lg transition-transform group-hover:scale-110"
          style={{ backgroundColor: `#${route.color}20`, color: `#${route.color}` }}
        >
          {route.num}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isTram ? <TrainFront size={16} className="shrink-0" style={{ color: `#${route.color}` }} /> : <Bus size={16} className="shrink-0" style={{ color: `#${route.color}` }} />}
            <span className="font-heading font-semibold text-foreground truncate text-sm">{route.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {route.from} → {route.to}
          </p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
          {route.stops.length} przyst.
        </span>
      </Link>
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(route.id); }}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors shrink-0 z-10"
          aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        >
          <Star
            size={16}
            className={isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
          />
        </button>
      )}
    </div>
  );
};

export default RouteCard;
