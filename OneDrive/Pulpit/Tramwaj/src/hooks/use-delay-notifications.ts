import { useState, useEffect, useCallback, useRef } from "react";
import { fetchGtfsRt, getRouteDelay, getRouteAlerts } from "@/data/gtfs-rt";

const STORAGE_KEY = "kacztransit-notifications-enabled";
const CHECK_INTERVAL = 60_000; // 1 minute
const DELAY_THRESHOLD = 120; // 2 min in seconds
const NOTIFIED_KEY = "kacztransit-notified-delays";

function readNotified(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(NOTIFIED_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeNotified(data: Record<string, number>) {
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify(data));
}

export function useDelayNotifications(
  favoriteRouteIds: string[],
  routeNames: Record<string, string> // routeId -> "Linia 3"
) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supported = typeof Notification !== "undefined";

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as const;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, [supported]);

  const toggle = useCallback(async () => {
    if (enabled) {
      setEnabled(false);
      localStorage.setItem(STORAGE_KEY, "false");
      return;
    }
    // Enable
    let perm = permission;
    if (perm !== "granted") {
      perm = await requestPermission();
    }
    if (perm === "granted") {
      setEnabled(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }
  }, [enabled, permission, requestPermission]);

  // Check delays periodically
  useEffect(() => {
    if (!enabled || permission !== "granted" || favoriteRouteIds.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const check = async () => {
      try {
        const rt = await fetchGtfsRt();
        const notified = readNotified();
        const now = Date.now();

        for (const routeId of favoriteRouteIds) {
          const delay = getRouteDelay(routeId, rt.tripUpdates);
          const alerts = getRouteAlerts(routeId, rt.alerts);
          const name = routeNames[routeId] || routeId;

          // Delay notification
          if (delay !== null && delay > DELAY_THRESHOLD) {
            const lastNotified = notified[`delay-${routeId}`] || 0;
            if (now - lastNotified > 5 * 60_000) { // max once per 5 min per route
              const mins = Math.round(delay / 60);
              new Notification(`🚌 ${name} – opóźnienie`, {
                body: `Średnie opóźnienie: +${mins} min`,
                icon: "/placeholder.svg",
                tag: `delay-${routeId}`,
              });
              notified[`delay-${routeId}`] = now;
            }
          }

          // Alert notification
          if (alerts.length > 0) {
            const lastNotified = notified[`alert-${routeId}`] || 0;
            if (now - lastNotified > 15 * 60_000) { // max once per 15 min
              new Notification(`⚠️ ${name} – alert`, {
                body: alerts[0].headerText || "Nowe utrudnienie na trasie",
                icon: "/placeholder.svg",
                tag: `alert-${routeId}`,
              });
              notified[`alert-${routeId}`] = now;
            }
          }
        }

        writeNotified(notified);
      } catch {
        // silently fail
      }
    };

    check();
    intervalRef.current = setInterval(check, CHECK_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, permission, favoriteRouteIds, routeNames]);

  return { enabled, supported, permission, toggle };
}
