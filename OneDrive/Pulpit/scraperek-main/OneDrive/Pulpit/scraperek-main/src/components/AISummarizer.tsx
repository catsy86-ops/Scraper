import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Sparkles, TrendingUp, Tag, FileText, ThumbsUp, ThumbsDown, Minus, Copy, Download, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  content: string;
  mode: string;
}

interface AISummary {
  summary: string;
  keyPoints: string[];
  sentiment: "pozytywny" | "neutralny" | "negatywny";
  category: string;
  wordCount: number;
}

const sentimentConfig = {
  pozytywny: { icon: ThumbsUp, className: "bg-neon-green/10 text-neon-green border-neon-green/30" },
  neutralny: { icon: Minus, className: "bg-primary/10 text-primary border-primary/30" },
  negatywny: { icon: ThumbsDown, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const AISummarizer = ({ content, mode }: Props) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const summaryToMarkdown = (s: AISummary) =>
    `# Podsumowanie AI\n\n${s.summary}\n\n## Kluczowe punkty\n${s.keyPoints.map((p) => `- ${p}`).join("\n")}\n\n**Sentyment:** ${s.sentiment} · **Kategoria:** ${s.category} · **~${s.wordCount} słów**`;

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summaryToMarkdown(summary));
    setCopied(true);
    toast({ title: "📋 Skopiowano", description: "Podsumowanie w schowku" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: "json" | "markdown") => {
    if (!summary) return;
    const content = format === "json" ? JSON.stringify(summary, null, 2) : summaryToMarkdown(summary);
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-summary.${format === "json" ? "json" : "md"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "💾 Wyeksportowano", description: `Plik .${format === "json" ? "json" : "md"} pobrany` });
  };

  const handleSummarize = async () => {
    if (!content) return;
    setLoading(true);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-summarize", {
        body: { content: content.slice(0, 15000), mode },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSummary(data.data);
      toast({ title: "✨ Podsumowanie gotowe", description: "AI przeanalizowało treść" });
    } catch (err: any) {
      console.error("AI summarize error:", err);
      toast({
        title: "Błąd AI",
        description: err.message || "Nie udało się wygenerować podsumowania",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const SentimentIcon = summary ? sentimentConfig[summary.sentiment]?.icon || Minus : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
          <Brain className="w-3.5 h-3.5" />
          Podsumowanie AI
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSummarize}
          disabled={loading}
          className="px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-mono flex items-center gap-1.5 hover:bg-primary/30 transition-colors disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {loading ? "Analizuję..." : summary ? "Ponów" : "Podsumuj"}
        </motion.button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-4 justify-center"
          >
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground font-mono">AI analizuje treść...</span>
          </motion.div>
        )}

        {summary && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Summary */}
            <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 border ${sentimentConfig[summary.sentiment]?.className}`}
              >
                <SentimentIcon className="w-3 h-3" />
                {summary.sentiment}
              </span>
              <span className="px-2 py-1 rounded-md bg-accent/10 text-accent border border-accent/30 text-[10px] font-mono flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {summary.category}
              </span>
              <span className="px-2 py-1 rounded-md bg-muted/30 text-muted-foreground border border-border/30 text-[10px] font-mono flex items-center gap-1">
                <FileText className="w-3 h-3" />
                ~{summary.wordCount} słów
              </span>
            </div>

            {/* Key Points */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <TrendingUp className="w-3 h-3" />
                Kluczowe punkty
              </div>
              <ul className="space-y-1">
                {summary.keyPoints.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-xs text-foreground/80 flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5 shrink-0">▸</span>
                    {point}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-md bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center gap-1 hover:bg-muted/50 transition-colors border border-border/30"
              >
                {copied ? <Check className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3" />}
                {copied ? "Skopiowano" : "Kopiuj"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport("json")}
                className="px-2.5 py-1 rounded-md bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center gap-1 hover:bg-muted/50 transition-colors border border-border/30"
              >
                <Download className="w-3 h-3" />
                JSON
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport("markdown")}
                className="px-2.5 py-1 rounded-md bg-muted/30 text-muted-foreground text-[10px] font-mono flex items-center gap-1 hover:bg-muted/50 transition-colors border border-border/30"
              >
                <Download className="w-3 h-3" />
                Markdown
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AISummarizer;
