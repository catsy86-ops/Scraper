import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookmarkPlus, Bookmark, Trash2, Play, ChevronDown, ChevronRight,
  Edit2, Check, X, FolderOpen, Copy, Save, Clock, AlertCircle, CheckCircle2,
  Download, Upload,
} from "lucide-react";
import { useFeaturesStore, type ScrapingTemplate } from "@/store/featuresStore";
import { useScraperStore } from "@/store/scraperStore";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ScrapeMode } from "@/components/ScrapeModeSelector";

const modeLabels: Record<string, string> = {
  scrape: "Scrape",
  search: "Search",
  map: "Map",
  crawl: "Crawl",
};

const MODES: ScrapeMode[] = ["scrape", "search", "map", "crawl"];

const ScrapingTemplates = () => {
  const { templates, addTemplate, deleteTemplate, updateTemplate } = useFeaturesStore();
  const { mode, lastInput, setMode, submitRequest, isLoading } = useScraperStore();
  const { toast } = useToast();

  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Full edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMode, setEditMode] = useState<ScrapeMode>("scrape");
  const [editInput, setEditInput] = useState("");
  const [editOptions, setEditOptions] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!saveName.trim()) return;
    const scraperState = useScraperStore.getState();
    addTemplate({
      name: saveName.trim(),
      mode: scraperState.mode,
      input: scraperState.lastInput,
      options: scraperState.history[0]?.options || {},
    });
    setSaveName("");
    setShowSave(false);
    toast({ title: "📋 Szablon zapisany", description: saveName.trim() });
  };

  const handleLoad = (template: ScrapingTemplate) => {
    setMode(template.mode as ScrapeMode);
    useScraperStore.setState({ lastInput: template.input });
    toast({ title: "Załadowano szablon", description: template.name });
  };

  const buildResultPreview = (result: any): string => {
    if (!result) return "";
    if (typeof result === "string") return result.slice(0, 120);
    if (result.data?.markdown) return result.data.markdown.slice(0, 120);
    if (result.data?.title) return result.data.title;
    if (result.data?.length) return `${result.data.length} wyników`;
    if (result.links?.length) return `${result.links.length} linków`;
    return JSON.stringify(result).slice(0, 120);
  };

  const handleRun = async (template: ScrapingTemplate) => {
    setMode(template.mode as ScrapeMode);
    useScraperStore.setState({ lastInput: template.input });
    const start = Date.now();
    await submitRequest(template.input, template.options);
    const duration = Date.now() - start;
    const state = useScraperStore.getState();
    updateTemplate(template.id, {
      lastRun: {
        timestamp: Date.now(),
        duration,
        status: state.error ? "error" : "success",
        resultPreview: state.error || buildResultPreview(state.result),
        error: state.error || undefined,
      },
    });
    if (state.error) {
      toast({ title: "Błąd", description: state.error, variant: "destructive" });
    } else {
      toast({ title: "✓ Uruchomiono szablon", description: template.name });
    }
  };

  const handleDuplicate = (template: ScrapingTemplate) => {
    addTemplate({
      name: `${template.name} (kopia)`,
      mode: template.mode,
      input: template.input,
      options: { ...template.options },
    });
    toast({ title: "📋 Zduplikowano", description: template.name });
  };

  const startEditing = (t: ScrapingTemplate) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditMode(t.mode as ScrapeMode);
    setEditInput(t.input);
    setEditOptions(JSON.stringify(t.options, null, 2));
    setJsonError(null);
    setExpanded((prev) => new Set(prev).add(t.id));
  };

  const handleOptionsChange = (value: string) => {
    setEditOptions(value);
    if (!value.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e: any) {
      const msg = e.message?.replace(/^JSON\.parse:\s*/, "") || "Nieprawidłowy JSON";
      setJsonError(msg);
    }
  };

  const saveEditing = () => {
    if (!editingId || !editName.trim() || jsonError) return;
    let options: Record<string, any> = {};
    try {
      options = editOptions.trim() ? JSON.parse(editOptions) : {};
    } catch {
      toast({ title: "Błąd JSON w opcjach", variant: "destructive" });
      return;
    }
    updateTemplate(editingId, {
      name: editName.trim(),
      mode: editMode,
      input: editInput,
      options,
    });
    setEditingId(null);
    toast({ title: "✓ Szablon zaktualizowany" });
  };

  const cancelEditing = () => setEditingId(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExportTemplates = () => {
    if (templates.length === 0) return;
    const exportData = templates.map(({ id, lastRun, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scraping-templates.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "💾 Wyeksportowano", description: `${templates.length} szablonów` });
  };

  const handleImportTemplates = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("Oczekiwano tablicy");
        let count = 0;
        for (const item of data) {
          if (!item.name || !item.mode || !item.input) continue;
          if (!["scrape", "search", "map", "crawl"].includes(item.mode)) continue;
          addTemplate({ name: item.name, mode: item.mode, input: item.input, options: item.options || {} });
          count++;
        }
        toast({ title: "📥 Zaimportowano", description: `${count} szablonów` });
      } catch {
        toast({ title: "Błąd importu", description: "Nieprawidłowy plik JSON", variant: "destructive" });
      }
    };
    input.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-primary uppercase tracking-wider flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          Szablony scrapowania
        </h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleImportTemplates}
            className="px-2.5 py-1.5 rounded-md bg-muted/30 text-muted-foreground text-xs font-mono flex items-center gap-1.5 hover:bg-muted/50 transition-colors border border-border/30"
            title="Importuj szablony"
          >
            <Upload className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportTemplates}
            disabled={templates.length === 0}
            className="px-2.5 py-1.5 rounded-md bg-muted/30 text-muted-foreground text-xs font-mono flex items-center gap-1.5 hover:bg-muted/50 transition-colors border border-border/30 disabled:opacity-40"
            title="Eksportuj szablony"
          >
            <Download className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSave(!showSave)}
            className="px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-mono flex items-center gap-1.5 hover:bg-primary/30 transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Zapisz obecny
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showSave && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-lg p-4 space-y-3">
              <div className="text-xs text-muted-foreground font-mono">
                Tryb: <span className="text-primary">{modeLabels[mode]}</span> • Input: <span className="text-foreground">{lastInput || "(brak)"}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Nazwa szablonu..."
                  className="flex-1 px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 rounded-md gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
                >
                  Zapisz
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/50 text-xs font-mono">
          <Bookmark className="w-6 h-6 mx-auto mb-2 opacity-30" />
          Brak zapisanych szablonów
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const isEditing = editingId === t.id;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-lg p-3 transition-colors ${isEditing ? "border-primary/40" : "hover:border-primary/30"}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpand(t.id)}
                    className="text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    {expanded.has(t.id) ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-0.5 rounded bg-muted/50 border border-primary/50 text-foreground font-mono text-xs focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing();
                          if (e.key === "Escape") cancelEditing();
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground font-mono truncate">{t.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 font-mono">
                          {modeLabels[t.mode]}
                        </span>
                        {t.lastRun && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 ${
                            t.lastRun.status === "success"
                              ? "bg-neon-green/10 text-neon-green"
                              : "bg-destructive/10 text-destructive"
                          }`}>
                            {t.lastRun.status === "success" ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                            {Math.round(t.lastRun.duration / 1000)}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEditing}
                          className="p-1 rounded text-neon-green hover:text-neon-green/80 transition-colors"
                          title="Zapisz zmiany"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 rounded text-destructive hover:text-destructive/80 transition-colors"
                          title="Anuluj"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRun(t)}
                          className="p-1 rounded text-muted-foreground hover:text-neon-green transition-colors"
                          title="Uruchom"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleLoad(t)}
                          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                          title="Załaduj"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEditing(t)}
                          className="p-1 rounded text-muted-foreground hover:text-accent transition-colors"
                          title="Edytuj"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(t)}
                          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                          title="Duplikuj"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title="Usuń"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expanded.has(t.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-border/20 space-y-2 overflow-hidden"
                    >
                      {isEditing ? (
                        <>
                          <div>
                            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Tryb</label>
                            <div className="flex gap-1.5">
                              {MODES.map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setEditMode(m)}
                                  className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                                    editMode === m
                                      ? "bg-primary/20 text-primary border-primary/30"
                                      : "bg-muted/20 text-muted-foreground/60 border-border/30 hover:bg-muted/40"
                                  }`}
                                >
                                  {modeLabels[m]}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Input (URL / query)</label>
                            <input
                              type="text"
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-xs focus:outline-none focus:border-primary/50"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground font-mono mb-1 block">Opcje (JSON)</label>
                            <textarea
                              value={editOptions}
                              onChange={(e) => handleOptionsChange(e.target.value)}
                              rows={3}
                              className={`w-full px-2 py-1.5 rounded-md bg-muted/50 border text-foreground font-mono text-[10px] focus:outline-none resize-none transition-colors ${
                                jsonError
                                  ? "border-destructive/70 focus:border-destructive bg-destructive/5"
                                  : "border-border/50 focus:border-primary/50"
                              }`}
                            />
                            {jsonError && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1 text-[10px] font-mono text-destructive flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {jsonError}
                              </motion.p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            Input: <span className="text-foreground">{t.input}</span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            Opcje: <span className="text-foreground/70">{JSON.stringify(t.options)}</span>
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground/50">
                            Utworzono: {new Date(t.createdAt).toLocaleString("pl-PL")}
                          </div>
                          {t.lastRun && (
                            <div className={`mt-1.5 p-2 rounded-md border text-[10px] font-mono space-y-1 ${
                              t.lastRun.status === "success"
                                ? "bg-neon-green/5 border-neon-green/20"
                                : "bg-destructive/5 border-destructive/20"
                            }`}>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>Ostatnie uruchomienie: {new Date(t.lastRun.timestamp).toLocaleString("pl-PL")}</span>
                                <span className="text-foreground/60">• {Math.round(t.lastRun.duration / 1000 * 10) / 10}s</span>
                                <span className={t.lastRun.status === "success" ? "text-neon-green" : "text-destructive"}>
                                  {t.lastRun.status === "success" ? "✓ OK" : "✗ Błąd"}
                                </span>
                              </div>
                              <div className="text-foreground/70 line-clamp-2 break-all">
                                {t.lastRun.resultPreview || "—"}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="glass border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">Usunąć szablon?</AlertDialogTitle>
            <AlertDialogDescription>
              Szablon „{templates.find((t) => t.id === deletingId)?.name}" zostanie trwale usunięty. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs">Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
              onClick={() => {
                if (deletingId) {
                  deleteTemplate(deletingId);
                  toast({ title: "Usunięto szablon" });
                  setDeletingId(null);
                }
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ScrapingTemplates;
