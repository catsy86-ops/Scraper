import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle, Clock, Ban, Bell } from "lucide-react";
import { createElement } from "react";
import type { ServiceAlert } from "@/data/gtfs-rt";

const CANCEL_EFFECTS = new Set(["Brak usługi"]);
const DELAY_JUMP_SEC = 120; // 2 min jump
const DELAY_HIGH_SEC = 300; // 5 min absolute

// Throttling / coalescing
const COALESCE_WINDOW_MS = 2500; // gather events arriving close together
const MIN_GAP_MS = 4000;          // min gap between toasts of the same kind
const SUMMARY_THRESHOLD = 3;      // collapse to a single summary toast above this

type Kind = "alert" | "cancel" | "delay";

interface Pending {
  kind: Kind;
  title: string;
  description?: string;
}

interface Args {
  routeId: string | undefined;
  routeNum: string | undefined;
  alerts: ServiceAlert[];
  delay: number | null;
  enabled?: boolean;
}

const iconFor = (kind: Kind) => {
  switch (kind) {
    case "cancel": return createElement(Ban, { size: 16 });
    case "delay":  return createElement(Clock, { size: 16 });
    default:       return createElement(AlertTriangle, { size: 16 });
  }
};

const fireToast = (kind: Kind, title: string, description: string) => {
  const opts = { description, icon: iconFor(kind), duration: 6000 } as const;
  if (kind === "cancel") toast.error(title, opts);
  else if (kind === "delay") toast.warning(title, opts);
  else toast.warning(title, opts);
};

/**
 * Watches GTFS-RT alerts and delay deltas; fires sonner toasts on meaningful changes.
 * Throttled & coalesced: bursts within ~2.5s collapse into one toast per kind,
 * and a global per-kind cooldown of 4s prevents spam during intensive updates.
 */
export function useRtAlerts({ routeId, routeNum, alerts, delay, enabled = true }: Args) {
  const seenAlerts = useRef<Set<string>>(new Set());
  const lastDelay = useRef<number | null>(null);
  const initialized = useRef(false);
  const lastRoute = useRef<string | undefined>(routeId);

  // Coalescing buffers
  const queue = useRef<Pending[]>([]);
  const flushTimer = useRef<number | null>(null);
  const lastFlushAt = useRef<Record<Kind, number>>({ alert: 0, cancel: 0, delay: 0 });

  // Reset when route changes
  useEffect(() => {
    if (lastRoute.current !== routeId) {
      seenAlerts.current = new Set();
      lastDelay.current = null;
      initialized.current = false;
      lastRoute.current = routeId;
      queue.current = [];
      if (flushTimer.current) {
        window.clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
      lastFlushAt.current = { alert: 0, cancel: 0, delay: 0 };
    }
  }, [routeId]);

  const flush = () => {
    flushTimer.current = null;
    const items = queue.current;
    queue.current = [];
    if (!items.length) return;

    const routeLabel = `Linia ${routeNum ?? routeId}`;
    const byKind: Record<Kind, Pending[]> = { alert: [], cancel: [], delay: [] };
    for (const it of items) byKind[it.kind].push(it);

    const now = Date.now();
    (Object.keys(byKind) as Kind[]).forEach((kind) => {
      const group = byKind[kind];
      if (group.length === 0) return;

      // Per-kind cooldown — drop instead of stacking
      if (now - lastFlushAt.current[kind] < MIN_GAP_MS) return;
      lastFlushAt.current[kind] = now;

      if (group.length === 1) {
        const g = group[0];
        fireToast(kind, `${routeLabel}: ${g.title}`, g.description ?? "");
        return;
      }

      // Coalesce many → one summary toast
      if (group.length >= SUMMARY_THRESHOLD) {
        const label = kind === "cancel" ? "odwołań" : kind === "delay" ? "zmian opóźnienia" : "alertów";
        toast.message(`${routeLabel}: ${group.length} ${label}`, {
          description: group.slice(0, 3).map((g) => `• ${g.title}`).join("\n") +
            (group.length > 3 ? `\n…i ${group.length - 3} więcej` : ""),
          icon: createElement(Bell, { size: 16 }),
          duration: 7000,
        });
      } else {
        const head = group[0];
        fireToast(kind, `${routeLabel}: ${head.title}`, `${head.description ?? ""}${group.length > 1 ? ` (+${group.length - 1})` : ""}`);
      }
    });
  };

  const enqueue = (p: Pending) => {
    queue.current.push(p);
    if (flushTimer.current == null) {
      flushTimer.current = window.setTimeout(flush, COALESCE_WINDOW_MS);
    }
  };

  useEffect(() => {
    if (!enabled || !routeId) return;

    if (!initialized.current) {
      alerts.forEach((a) => seenAlerts.current.add(a.id));
      lastDelay.current = delay;
      initialized.current = true;
      return;
    }

    for (const a of alerts) {
      if (seenAlerts.current.has(a.id)) continue;
      seenAlerts.current.add(a.id);
      const isCancel = CANCEL_EFFECTS.has(a.effect);
      enqueue({
        kind: isCancel ? "cancel" : "alert",
        title: isCancel ? a.effect : (a.headerText || "nowy alert"),
        description: a.headerText && isCancel ? a.headerText : (a.descriptionText || a.effect || ""),
      });
    }

    if (delay != null) {
      const prev = lastDelay.current;
      if (prev != null) {
        const jump = delay - prev;
        if (jump >= DELAY_JUMP_SEC) {
          enqueue({
            kind: "delay",
            title: `rośnie opóźnienie (+${Math.round(jump / 60)} min)`,
            description: `Aktualnie ~${Math.round(delay / 60)} min.`,
          });
        } else if (prev < DELAY_HIGH_SEC && delay >= DELAY_HIGH_SEC) {
          enqueue({
            kind: "delay",
            title: `znaczne opóźnienie`,
            description: `Aktualne opóźnienie ~${Math.round(delay / 60)} min.`,
          });
        }
      }
      lastDelay.current = delay;
    }
  }, [alerts, delay, routeId, routeNum, enabled]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (flushTimer.current) window.clearTimeout(flushTimer.current);
  }, []);
}
