import { motion } from "framer-motion";
import { Globe, Search, Map, Bug } from "lucide-react";

export type ScrapeMode = "scrape" | "search" | "map" | "crawl";

interface ScrapeModeInfo {
  id: ScrapeMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const modes: ScrapeModeInfo[] = [
  { id: "scrape", label: "Scrape", description: "Wyciągnij dane z jednej strony", icon: <Globe className="w-5 h-5" /> },
  { id: "search", label: "Search", description: "Szukaj w sieci i scrappuj wyniki", icon: <Search className="w-5 h-5" /> },
  { id: "map", label: "Map", description: "Odkryj wszystkie URL na stronie", icon: <Map className="w-5 h-5" /> },
  { id: "crawl", label: "Crawl", description: "Przeszukaj cały serwis rekurencyjnie", icon: <Bug className="w-5 h-5" /> },
];

interface Props {
  activeMode: ScrapeMode;
  onModeChange: (mode: ScrapeMode) => void;
}

const ScrapeModeSelector = ({ activeMode, onModeChange }: Props) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {modes.map((mode, index) => (
        <motion.button
          key={mode.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onModeChange(mode.id)}
          className={`group relative p-4 rounded-lg border transition-colors duration-300 text-left ${
            activeMode === mode.id
              ? "glass neon-border neon-glow"
              : "glass border-border/30 hover:border-primary/30"
          }`}
        >
          <div className={`mb-2 ${activeMode === mode.id ? "text-primary neon-text" : "text-muted-foreground group-hover:text-primary/70"} transition-colors`}>
            {mode.icon}
          </div>
          <div className={`font-mono text-sm font-semibold ${activeMode === mode.id ? "text-primary" : "text-foreground"}`}>
            {mode.label}
          </div>
          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {mode.description}
          </div>
          {activeMode === mode.id && (
            <motion.div
              layoutId="active-mode-dot"
              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default ScrapeModeSelector;
