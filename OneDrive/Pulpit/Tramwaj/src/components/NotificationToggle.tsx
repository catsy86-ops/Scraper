import { Bell, BellOff, BellRing } from "lucide-react";
import { useDelayNotifications } from "@/hooks/use-delay-notifications";

interface NotificationToggleProps {
  favoriteRouteIds: string[];
  routeNames: Record<string, string>;
}

const NotificationToggle = ({ favoriteRouteIds, routeNames }: NotificationToggleProps) => {
  const { enabled, supported, permission, toggle } = useDelayNotifications(
    favoriteRouteIds,
    routeNames
  );

  if (!supported) return null;

  const denied = permission === "denied" && !enabled;

  return (
    <button
      onClick={toggle}
      disabled={denied}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
        enabled
          ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
          : denied
          ? "bg-muted border-border text-muted-foreground/40 cursor-not-allowed"
          : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
      }`}
      title={
        denied
          ? "Powiadomienia zablokowane w przeglądarce – zmień w ustawieniach"
          : enabled
          ? "Powiadomienia o opóźnieniach włączone"
          : "Włącz powiadomienia o opóźnieniach"
      }
    >
      {enabled ? (
        <BellRing size={16} className="animate-pulse" />
      ) : denied ? (
        <BellOff size={16} />
      ) : (
        <Bell size={16} />
      )}
      <span className="hidden sm:inline">
        {enabled ? "Powiadomienia ON" : denied ? "Zablokowane" : "Powiadomienia"}
      </span>
      {enabled && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" />
      )}
    </button>
  );
};

export default NotificationToggle;
