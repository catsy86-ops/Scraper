import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, RefreshCw, Database } from "lucide-react";

interface DataFreshnessProps {
  generatedAt?: string;
}

const DataFreshness = ({ generatedAt }: DataFreshnessProps) => {
  const [daysOld, setDaysOld] = useState(0);

  useEffect(() => {
    if (!generatedAt) return;
    const generated = new Date(generatedAt).getTime();
    const now = Date.now();
    setDaysOld(Math.floor((now - generated) / (1000 * 60 * 60 * 24)));
  }, [generatedAt]);

  if (!generatedAt) return null;

  const isStale = daysOld > 7;
  const formattedDate = new Date(generatedAt).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
      isStale
        ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
        : "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
    }`}>
      {isStale ? (
        <AlertTriangle size={12} />
      ) : (
        <CheckCircle size={12} />
      )}
      <span>
        Dane GTFS: {formattedDate}
        {isStale && ` (${daysOld} dni temu)`}
      </span>
      {isStale && (
        <a
          href="https://www.zditm.szczecin.pl/pl/zditm/dla-programistow/gtfs"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 underline hover:no-underline"
        >
          Zaktualizuj
        </a>
      )}
    </div>
  );
};

export default DataFreshness;
