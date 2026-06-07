import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

interface Props {
  lastUpdated: Date | null;
  loading: boolean;
}

/** Pulsujący wskaźnik świeżości danych GTFS-RT z licznikiem sekund. */
const LiveFreshnessBadge = ({ lastUpdated, loading }: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ageSec = lastUpdated ? Math.max(0, Math.floor((now - lastUpdated.getTime()) / 1000)) : null;

  let tone: "fresh" | "stale" | "old" = "fresh";
  if (ageSec == null) tone = "old";
  else if (ageSec > 30) tone = "old";
  else if (ageSec > 12) tone = "stale";

  const dotColor =
    tone === "fresh" ? "bg-emerald-500" : tone === "stale" ? "bg-amber-500" : "bg-muted-foreground";
  const ringColor =
    tone === "fresh" ? "bg-emerald-500/60" : tone === "stale" ? "bg-amber-500/60" : "bg-muted-foreground/40";

  const label = loading
    ? "Aktualizuję…"
    : ageSec == null
      ? "Brak danych"
      : ageSec < 2
        ? "Na żywo"
        : `${ageSec}s temu`;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border bg-card text-xs font-medium text-foreground"
      title={lastUpdated ? `Ostatnia aktualizacja: ${lastUpdated.toLocaleTimeString("pl-PL")}` : "Oczekiwanie na dane"}
      aria-live="polite"
    >
      <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
        {tone === "fresh" && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${ringColor} animate-ping`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <Radio size={12} className="text-muted-foreground" aria-hidden />
      <span>{label}</span>
    </span>
  );
};

export default LiveFreshnessBadge;
