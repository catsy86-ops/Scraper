import { motion } from "framer-motion";
import { Gauge, AlertTriangle, Image as ImageIcon, Sparkles, Hash, Link2, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { analyzeQuality, extractImages, cleanMarkdown } from "@/lib/contentQuality";

interface Props {
  markdown: string;
  onCleaned?: (cleaned: string) => void;
}

const ContentQuality = ({ markdown, onCleaned }: Props) => {
  const [showImages, setShowImages] = useState(false);
  const report = useMemo(() => analyzeQuality(markdown), [markdown]);
  const images = useMemo(() => extractImages(markdown), [markdown]);
  const cleanPreview = useMemo(() => cleanMarkdown(markdown), [markdown]);

  if (!markdown) return null;

  const levelColor =
    report.level === 'high' ? 'text-neon-green' :
    report.level === 'medium' ? 'text-primary' : 'text-destructive';
  const levelBg =
    report.level === 'high' ? 'bg-neon-green/10 border-neon-green/30' :
    report.level === 'medium' ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
          <Gauge className="w-3 h-3" /> Jakość ekstrakcji
        </div>
        <div className={`px-2.5 py-1 rounded-md border ${levelBg} flex items-center gap-1.5`}>
          <span className={`text-xs font-mono font-bold ${levelColor}`}>{report.score}/100</span>
          <span className={`text-[10px] font-mono uppercase ${levelColor}`}>
            {report.level === 'high' ? 'wysoka' : report.level === 'medium' ? 'średnia' : 'niska'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
        <Stat icon={<FileText className="w-3 h-3" />} label="Słowa" value={report.wordCount.toLocaleString()} />
        <Stat icon={<Hash className="w-3 h-3" />} label="Nagłówki" value={String(report.headings)} />
        <Stat icon={<FileText className="w-3 h-3" />} label="Akapity" value={String(report.paragraphs)} />
        <Stat icon={<Link2 className="w-3 h-3" />} label="Linki" value={String(report.links)} />
        <Stat icon={<ImageIcon className="w-3 h-3" />} label="Obrazy" value={String(report.images)} />
        <Stat icon={<FileText className="w-3 h-3" />} label="Znaki" value={report.charCount.toLocaleString()} />
      </div>

      {report.warnings.length > 0 && (
        <div className="space-y-1">
          {report.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-destructive/80 font-mono">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {onCleaned && cleanPreview.removedChars > 0 && (
          <button
            onClick={() => onCleaned(cleanPreview.cleaned)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            Wyczyść treść (-{cleanPreview.removedChars.toLocaleString()} znaków)
          </button>
        )}
        {images.length > 0 && (
          <button
            onClick={() => setShowImages((v) => !v)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-muted/30 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors flex items-center gap-1.5"
          >
            <ImageIcon className="w-3 h-3" />
            {showImages ? 'Ukryj' : 'Pokaż'} obrazy ({images.length})
          </button>
        )}
      </div>

      {showImages && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-auto pt-2 border-t border-border/30">
          {images.slice(0, 30).map((img, i) => (
            <div key={i} className="space-y-1 group">
              <div className="aspect-video rounded-md overflow-hidden bg-muted/30 border border-border/30">
                <img
                  src={img.url}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate" title={img.alt || '(brak alt)'}>
                {img.alt || <span className="text-destructive/70">⚠ brak alt</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/20 border border-border/30">
    <span className="text-primary/60">{icon}</span>
    <span className="text-muted-foreground">{label}:</span>
    <span className="text-foreground font-bold ml-auto">{value}</span>
  </div>
);

export default ContentQuality;
