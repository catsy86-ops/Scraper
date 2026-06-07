import { useEffect, useRef, useState, useCallback } from "react";
import type { ServiceAlert } from "@/data/gtfs-rt";

export type AlertHistoryKind = "alert" | "cancel" | "delay";

export interface AlertHistoryEntry {
  id: string;
  kind: AlertHistoryKind;
  title: string;
  description?: string;
  ts: number;
  delaySec?: number;
}

const CANCEL_EFFECTS = new Set(["Brak usługi"]);
const DELAY_JUMP_SEC = 120;
const DELAY_HIGH_SEC = 300;
const MAX_ENTRIES = 100;

const storageKey = (routeId: string) => `kacztrans:alert-history:${routeId}`;

/** Records alerts/cancellations/delay events per route into localStorage. */
export function useAlertHistory(
  routeId: string | undefined,
  alerts: ServiceAlert[],
  delay: number | null,
) {
  const [entries, setEntries] = useState<AlertHistoryEntry[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const lastDelay = useRef<number | null>(null);
  const initialized = useRef(false);
  const lastRoute = useRef<string | undefined>(undefined);

  // Load on route change
  useEffect(() => {
    if (!routeId) return;
    if (lastRoute.current === routeId) return;
    lastRoute.current = routeId;
    seen.current = new Set();
    lastDelay.current = null;
    initialized.current = false;
    try {
      const raw = localStorage.getItem(storageKey(routeId));
      setEntries(raw ? (JSON.parse(raw) as AlertHistoryEntry[]) : []);
    } catch {
      setEntries([]);
    }
  }, [routeId]);

  // Persist
  useEffect(() => {
    if (!routeId) return;
    try {
      localStorage.setItem(storageKey(routeId), JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    } catch {
      /* ignore quota */
    }
  }, [routeId, entries]);

  // Record new events
  useEffect(() => {
    if (!routeId) return;

    if (!initialized.current) {
      alerts.forEach((a) => seen.current.add(a.id));
      lastDelay.current = delay;
      initialized.current = true;
      return;
    }

    const additions: AlertHistoryEntry[] = [];

    for (const a of alerts) {
      if (seen.current.has(a.id)) continue;
      seen.current.add(a.id);
      const isCancel = CANCEL_EFFECTS.has(a.effect);
      additions.push({
        id: `${a.id}-${Date.now()}`,
        kind: isCancel ? "cancel" : "alert",
        title: a.headerText || a.effect || "Nowy alert",
        description: a.descriptionText || (isCancel ? a.effect : undefined),
        ts: Date.now(),
      });
    }

    if (delay != null) {
      const prev = lastDelay.current;
      if (prev != null) {
        const jump = delay - prev;
        if (jump >= DELAY_JUMP_SEC) {
          additions.push({
            id: `delay-jump-${Date.now()}`,
            kind: "delay",
            title: `Wzrost opóźnienia o ${Math.round(jump / 60)} min`,
            description: `Aktualnie ~${Math.round(delay / 60)} min.`,
            ts: Date.now(),
            delaySec: delay,
          });
        } else if (prev < DELAY_HIGH_SEC && delay >= DELAY_HIGH_SEC) {
          additions.push({
            id: `delay-high-${Date.now()}`,
            kind: "delay",
            title: `Znaczne opóźnienie (~${Math.round(delay / 60)} min)`,
            description: "Przekroczono próg 5 min.",
            ts: Date.now(),
            delaySec: delay,
          });
        }
      }
      lastDelay.current = delay;
    }

    if (additions.length) {
      setEntries((prev) => [...additions, ...prev].slice(0, MAX_ENTRIES));
    }
  }, [alerts, delay, routeId]);

  const clear = useCallback(() => {
    if (!routeId) return;
    setEntries([]);
    try {
      localStorage.removeItem(storageKey(routeId));
    } catch {
      /* ignore */
    }
  }, [routeId]);

  return { entries, clear };
}
