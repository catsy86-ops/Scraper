import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, FileText, Code, ChevronDown, ChevronRight, Table2, Download, FileJson, FileSpreadsheet, Camera, Palette, Brain, ExternalLink, Sheet, ChevronLeft, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import LinksTable from "./LinksTable";
import AISummarizer from "./AISummarizer";
import ContentQuality from "./ContentQuality";

interface Props {
  result: any;
  mode: string;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ResultsPanel = ({ result, mode }: Props) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"formatted" | "markdown" | "raw">("formatted");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState("");
  const [cleanedMarkdown, setCleanedMarkdown] = useState<string | null>(null);

  // Reset page when result changes
  useEffect(() => { setPage(1); setFilter(""); setCleanedMarkdown(null); }, [result]);


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const expandAll = (items: any[]) => setExpandedItems(new Set(items.map((_, i) => i)));
  const collapseAll = () => setExpandedItems(new Set());

  if (!result) return null;

  const rawContent = JSON.stringify(result, null, 2);

  const handleExport = async (format: 'json' | 'csv' | 'md' | 'xlsx') => {
    const data = result.data || result;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    if (format === 'json') {
      downloadFile(rawContent, `scrape-${timestamp}.json`, 'application/json');
    } else if (format === 'md') {
      const md = data.markdown || rawContent;
      downloadFile(md, `scrape-${timestamp}.md`, 'text/markdown');
    } else if (format === 'xlsx') {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        if (mode === 'search' && Array.isArray(result.data)) {
          const rows = result.data.map((item: any, i: number) => ({
            '#': i + 1,
            'Tytuł': item.title || '',
            'URL': item.url || '',
            'Opis': item.description || '',
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 60 }, { wch: 50 }];
          XLSX.utils.book_append_sheet(wb, ws, 'Wyniki');
        } else if (mode === 'map' && result.links) {
          const rows = result.links.map((url: string, i: number) => ({ '#': i + 1, 'URL': url }));
          const ws = XLSX.utils.json_to_sheet(rows);
          ws['!cols'] = [{ wch: 5 }, { wch: 80 }];
          XLSX.utils.book_append_sheet(wb, ws, 'Mapa URL');
        } else if (mode === 'crawl' && Array.isArray(result.data)) {
          const rows = result.data.map((item: any, i: number) => ({
            '#': i + 1,
            'Tytuł': item.metadata?.title || `Strona ${i + 1}`,
            'URL': item.metadata?.sourceURL || '',
            'Status': item.metadata?.statusCode || '',
            'Treść (fragment)': (item.markdown || '').slice(0, 500),
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 60 }, { wch: 8 }, { wch: 60 }];
          XLSX.utils.book_append_sheet(wb, ws, 'Crawl');
        } else {
          // Scrape mode
          if (data.metadata) {
            const metaRows = Object.entries(data.metadata).map(([k, v]) => ({ 'Pole': k, 'Wartość': String(v) }));
            const wsMeta = XLSX.utils.json_to_sheet(metaRows);
            wsMeta['!cols'] = [{ wch: 20 }, { wch: 60 }];
            XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata');
          }
          if (data.links?.length) {
            const linkRows = data.links.map((url: string, i: number) => ({ '#': i + 1, 'URL': url }));
            const wsLinks = XLSX.utils.json_to_sheet(linkRows);
            wsLinks['!cols'] = [{ wch: 5 }, { wch: 80 }];
            XLSX.utils.book_append_sheet(wb, wsLinks, 'Linki');
          }
          if (data.markdown) {
            const wsContent = XLSX.utils.aoa_to_sheet([['Treść Markdown'], [data.markdown]]);
            wsContent['!cols'] = [{ wch: 120 }];
            XLSX.utils.book_append_sheet(wb, wsContent, 'Treść');
          }
          if (data.branding?.colors) {
            const colorRows = Object.entries(data.branding.colors).map(([name, color]) => ({ 'Nazwa': name, 'Kolor': String(color) }));
            const wsBrand = XLSX.utils.json_to_sheet(colorRows);
            wsBrand['!cols'] = [{ wch: 20 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, wsBrand, 'Branding');
          }
        }

        XLSX.writeFile(wb, `scrape-${timestamp}.xlsx`);
      } catch (err) {
        console.error('XLSX export error:', err);
      }
    } else if (format === 'csv') {
      let csv = '';
      if (mode === 'search' && Array.isArray(result.data)) {
        csv = 'Tytuł,URL,Opis\n';
        csv += result.data.map((item: any) =>
          `"${(item.title || '').replace(/"/g, '""')}","${item.url || ''}","${(item.description || '').replace(/"/g, '""')}"`
        ).join('\n');
      } else if (mode === 'map' && result.links) {
        csv = 'Index,URL\n';
        csv += result.links.map((url: string, i: number) => `${i + 1},"${url}"`).join('\n');
      } else if (data.links) {
        csv = 'Index,URL\n';
        csv += data.links.map((url: string, i: number) => `${i + 1},"${url}"`).join('\n');
      }
      if (csv) downloadFile(csv, `scrape-${timestamp}.csv`, 'text/csv');
    }
    setShowExportMenu(false);
  };

  const renderScreenshot = (screenshot: string) => {
    const src = screenshot.startsWith('http') ? screenshot : `data:image/png;base64,${screenshot}`;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
          <Camera className="w-3 h-3" /> Screenshot
        </div>
        <div className="rounded-lg overflow-hidden border border-border/30">
          <img src={src} alt="Page screenshot" className="w-full h-auto" loading="lazy" />
        </div>
      </motion.div>
    );
  };

  const renderBranding = (branding: any) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
        <Palette className="w-3 h-3" /> Branding
      </div>
      {branding.logo && (
        <div className="flex items-center gap-3">
          <img src={branding.logo} alt="Logo" className="h-8 w-auto" />
          <span className="text-xs text-muted-foreground font-mono">Logo</span>
        </div>
      )}
      {branding.colors && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Kolory:</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(branding.colors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/30">
                <div className="w-4 h-4 rounded-sm border border-border/50" style={{ backgroundColor: color as string }} />
                <span className="text-[10px] font-mono text-muted-foreground">{name}</span>
                <span className="text-[9px] font-mono text-primary/60">{color as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {branding.fonts && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Fonty:</span>
          <div className="flex flex-wrap gap-2">
            {branding.fonts.map((font: any, i: number) => (
              <span key={i} className="px-2 py-1 rounded-md bg-muted/30 border border-border/30 text-xs font-mono text-foreground">
                {font.family || font}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderSummary = (summary: string) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
        <Brain className="w-3 h-3" /> Podsumowanie AI
      </div>
      <p className="text-sm text-foreground leading-relaxed">{summary}</p>
    </motion.div>
  );

  const renderJsonExtract = (json: any) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
          <FileJson className="w-3 h-3" /> Wyekstrahowane dane (JSON)
        </div>
        <button onClick={() => copyToClipboard(JSON.stringify(json, null, 2))} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1 transition-colors">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Kopiuj
        </button>
      </div>
      <pre className="text-xs text-secondary-foreground font-mono whitespace-pre-wrap max-h-64 overflow-auto leading-relaxed bg-muted/20 rounded-md p-3">
        {JSON.stringify(json, null, 2)}
      </pre>
    </motion.div>
  );

  const renderScrapeResult = () => {
    const data = result.data || result;
    const effectiveMd: string = cleanedMarkdown ?? data.markdown ?? "";
    return (
      <div className="space-y-4">
        {data.markdown && (
          <ContentQuality markdown={effectiveMd} onCleaned={(c) => setCleanedMarkdown(c)} />
        )}
        {data.metadata && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
              <FileText className="w-3 h-3" /> Metadata
            </div>
            <div className="text-sm font-semibold text-foreground">{data.metadata.title}</div>
            {data.metadata.description && <div className="text-xs text-muted-foreground">{data.metadata.description}</div>}
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <div className="text-xs text-primary/60 font-mono">{data.metadata.sourceURL}</div>
              {data.metadata.statusCode && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${data.metadata.statusCode === 200 ? 'bg-neon-green/10 text-neon-green' : 'bg-destructive/10 text-destructive'}`}>
                  HTTP {data.metadata.statusCode}
                </span>
              )}
              {data.metadata.language && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary/60">{data.metadata.language}</span>}
              {data.metadata.creditsUsed && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent">{data.metadata.creditsUsed} credit{data.metadata.creditsUsed > 1 ? 's' : ''}</span>}
            </div>
          </motion.div>
        )}

        {/* Screenshot */}
        {(data.screenshot || data.data?.screenshot) && renderScreenshot(data.screenshot || data.data?.screenshot)}

        {/* Branding */}
        {(data.branding || data.data?.branding) && renderBranding(data.branding || data.data?.branding)}

        {/* AI Summary */}
        {(data.summary || data.data?.summary) && renderSummary(data.summary || data.data?.summary)}

        {/* JSON extraction */}
        {(data.json || data.data?.json) && renderJsonExtract(data.json || data.data?.json)}

        {data.markdown && viewMode === "markdown" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-primary font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                <Code className="w-3 h-3" /> Rendered Markdown {cleanedMarkdown && <span className="text-neon-green text-[10px]">• wyczyszczone</span>}
              </span>
              <button onClick={() => copyToClipboard(effectiveMd)} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1 transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Skopiowano!" : "Kopiuj"}
              </button>
            </div>
            <div className="max-h-[500px] overflow-auto">
              <MarkdownRenderer content={effectiveMd} />
            </div>
          </motion.div>
        )}

        {data.markdown && viewMode === "formatted" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-primary font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                <Code className="w-3 h-3" /> Raw Markdown {cleanedMarkdown && <span className="text-neon-green text-[10px]">• wyczyszczone</span>}
                <span className="text-muted-foreground/40">({effectiveMd.length.toLocaleString()} znaków)</span>
              </span>
              <button onClick={() => copyToClipboard(effectiveMd)} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1 transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Skopiowano!" : "Kopiuj"}
              </button>
            </div>
            <pre className="text-xs text-secondary-foreground font-mono whitespace-pre-wrap max-h-96 overflow-auto leading-relaxed">
              {effectiveMd.slice(0, 8000)}
              {effectiveMd.length > 8000 && "\n\n... (skrócono)"}
            </pre>
          </motion.div>
        )}

        {data.html && viewMode === "formatted" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-primary font-mono text-xs uppercase tracking-wider flex items-center gap-2"><Code className="w-3 h-3" /> HTML</span>
              <button onClick={() => copyToClipboard(data.html)} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1 transition-colors">
                <Copy className="w-3 h-3" /> Kopiuj
              </button>
            </div>
            <pre className="text-xs text-secondary-foreground font-mono whitespace-pre-wrap max-h-48 overflow-auto leading-relaxed">{data.html.slice(0, 3000)}</pre>
          </motion.div>
        )}

        {data.links && data.links.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <LinksTable links={data.links} />
          </motion.div>
        )}

        {/* AI Summarizer */}
        {(data.markdown || data.html) && (
          <AISummarizer content={data.markdown || data.html || ""} mode={mode} />
        )}
      </div>
    );
  };

  const renderSearchResult = () => {
    const items = result.data || [];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">{items.length} wynik{items.length !== 1 ? 'ów' : ''}</span>
          <div className="flex gap-2">
            <button onClick={() => expandAll(items)} className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors">Rozwiń wszystko</button>
            <button onClick={collapseAll} className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors">Zwiń</button>
          </div>
        </div>
        <AnimatePresence>
          {items.map((item: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4 cursor-pointer transition-colors hover:border-primary/30" onClick={() => toggleItem(i)}>
              <div className="flex items-start gap-2">
                <span className="text-primary/50 font-mono text-xs mt-0.5">
                  {expandedItems.has(i) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{item.title}</div>
                  <div className="text-xs text-primary/60 font-mono truncate mt-1 flex items-center gap-1">
                    {item.url}
                    <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-primary"><ExternalLink className="w-3 h-3" /></a>
                  </div>
                  {item.description && <div className="text-xs text-muted-foreground mt-1">{item.description}</div>}
                  <AnimatePresence>
                    {expandedItems.has(i) && item.markdown && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 max-h-64 overflow-auto border-t border-border/20 pt-3">
                        <MarkdownRenderer content={item.markdown.slice(0, 3000)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">Brak wyników</div>}
      </div>
    );
  };

  const renderMapResult = () => <LinksTable links={result.links || []} />;

  const renderCrawlResult = () => {
    const items: any[] = result.data || [];
    const filtered = filter
      ? items.filter((it) => {
          const q = filter.toLowerCase();
          return (
            (it.metadata?.title || "").toLowerCase().includes(q) ||
            (it.metadata?.sourceURL || "").toLowerCase().includes(q) ||
            (it.markdown || "").toLowerCase().includes(q)
          );
        })
      : items;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageStart = (safePage - 1) * pageSize;
    const pageItems = filtered.slice(pageStart, pageStart + pageSize);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground flex-wrap">
            <span>Status: <span className="text-primary">{result.status || "completed"}</span></span>
            <span>Stron: <span className="text-primary">{result.completed || items.length}</span></span>
            {filter && <span className="text-accent">Filtr: {filtered.length}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => expandAll(pageItems)} className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors">Rozwiń</button>
            <button onClick={collapseAll} className="text-[10px] font-mono text-muted-foreground/50 hover:text-primary transition-colors">Zwiń</button>
          </div>
        </div>

        {/* Filter + page size */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
            <input
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              placeholder="Filtruj po URL, tytule, treści..."
              className="w-full pl-7 pr-3 py-1.5 rounded-md bg-muted/40 border border-border/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1.5 rounded-md bg-muted/40 border border-border/40 text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value={10}>10 / str.</option>
            <option value={25}>25 / str.</option>
            <option value={50}>50 / str.</option>
            <option value={100}>100 / str.</option>
          </select>
        </div>

        <div className="space-y-2">
          {pageItems.map((item: any, idx: number) => {
            const i = pageStart + idx;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="glass rounded-lg p-4 cursor-pointer transition-colors hover:border-primary/30" onClick={() => toggleItem(i)}>
                <div className="flex items-start gap-2">
                  <span className="text-primary/40 font-mono text-[10px] mt-1 min-w-[28px]">#{i + 1}</span>
                  <span className="text-primary/50 font-mono text-xs mt-0.5">
                    {expandedItems.has(i) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{item.metadata?.title || `Strona ${i + 1}`}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-primary/60 font-mono truncate flex-1">{item.metadata?.sourceURL}</div>
                      {item.metadata?.sourceURL && (
                        <a href={item.metadata.sourceURL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <AnimatePresence>
                      {expandedItems.has(i) && item.markdown && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 max-h-64 overflow-auto border-t border-border/20 pt-3">
                          <MarkdownRenderer content={item.markdown.slice(0, 3000)} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {pageItems.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-6">Brak wyników do wyświetlenia</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
            <div className="text-[10px] font-mono text-muted-foreground/60">
              {pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} z {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage === 1} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-foreground px-2">
                <span className="text-primary">{safePage}</span> / {totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };


  const viewTabs = mode === "scrape"
    ? [
        { key: "formatted" as const, label: "Raw MD" },
        { key: "markdown" as const, label: "Rendered" },
        { key: "raw" as const, label: "JSON" },
      ]
    : [
        { key: "formatted" as const, label: "Formatted" },
        { key: "raw" as const, label: "JSON" },
      ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-sm text-primary uppercase tracking-wider flex items-center gap-2">
          <Table2 className="w-4 h-4" /> Wyniki
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="px-2 py-1 rounded text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Download className="w-3 h-3" /> Export
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute right-0 top-8 z-50 glass-strong rounded-lg p-1 min-w-[120px] shadow-xl">
                  <button onClick={() => handleExport('json')} className="w-full px-3 py-1.5 rounded text-xs font-mono text-left text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"><FileJson className="w-3 h-3" /> JSON</button>
                  <button onClick={() => handleExport('csv')} className="w-full px-3 py-1.5 rounded text-xs font-mono text-left text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"><FileSpreadsheet className="w-3 h-3" /> CSV</button>
                  <button onClick={() => handleExport('xlsx')} className="w-full px-3 py-1.5 rounded text-xs font-mono text-left text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"><Sheet className="w-3 h-3" /> XLSX</button>
                  {(result?.data?.markdown || result?.markdown) && (
                    <button onClick={() => handleExport('md')} className="w-full px-3 py-1.5 rounded text-xs font-mono text-left text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"><FileText className="w-3 h-3" /> Markdown</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-1 bg-muted/30 rounded-md p-0.5">
            {viewTabs.map((tab) => (
              <button key={tab.key} onClick={() => setViewMode(tab.key)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${viewMode === tab.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "raw" ? (
          <motion.div key="raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground/40">{rawContent.length.toLocaleString()} znaków</span>
              <button onClick={() => copyToClipboard(rawContent)} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1 transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Skopiowano!" : "Kopiuj"}
              </button>
            </div>
            <pre className="text-xs text-secondary-foreground font-mono whitespace-pre-wrap max-h-[500px] overflow-auto leading-relaxed">{rawContent.slice(0, 15000)}</pre>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {mode === "scrape" && renderScrapeResult()}
            {mode === "search" && renderSearchResult()}
            {mode === "map" && renderMapResult()}
            {mode === "crawl" && renderCrawlResult()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResultsPanel;
