import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellRing, Plus, Trash2, Eye, EyeOff, Loader2, Check,
  AlertTriangle, Search, X, DollarSign, Tag,
} from "lucide-react";
import { useFeaturesStore, type ContentAlert, type AlertNotification, type AlertType } from "@/store/featuresStore";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { useToast } from "@/components/ui/use-toast";

/** Extract the first price-like number from text content */
function extractPrice(text: string, cssSelector?: string): number | null {
  // Try common price patterns: $12.99, 12,99 zł, 12.99€, PLN 12.99, etc.
  const patterns = [
    /(?:[\$€£¥])\s*(\d[\d\s]*[.,]\d{2})/,
    /(\d[\d\s]*[.,]\d{2})\s*(?:zł|PLN|EUR|USD|GBP|€|\$|£)/i,
    /(?:cena|price|koszt|cost)[:\s]*(\d[\d\s]*[.,]\d{2})/i,
    /(\d{1,7}[.,]\d{2})/,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const raw = m[1].replace(/\s/g, "").replace(",", ".");
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

const ContentAlerts = () => {
  const { alerts, addAlert, deleteAlert, toggleAlert, updateAlertCheck, markNotificationRead, getUnreadCount } = useFeaturesStore();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>("keyword");
  const [newUrl, setNewUrl] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newInterval, setNewInterval] = useState("60");
  // Price alert fields
  const [thresholdPrice, setThresholdPrice] = useState("");
  const [dropPercent, setDropPercent] = useState("");
  const [cssSelector, setCssSelector] = useState("");

  const [checking, setChecking] = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const unreadCount = getUnreadCount();

  const handleAdd = () => {
    if (!newUrl.trim()) return;

    if (alertType === "keyword") {
      const keywords = newKeywords.split(",").map((k) => k.trim()).filter(Boolean);
      if (keywords.length === 0) {
        toast({ title: "Dodaj przynajmniej 1 słowo kluczowe", variant: "destructive" });
        return;
      }
      addAlert({
        url: newUrl.trim(),
        alertType: "keyword",
        keywords,
        intervalMinutes: parseInt(newInterval) || 60,
        isActive: true,
      });
    } else {
      const tp = parseFloat(thresholdPrice);
      const dp = parseFloat(dropPercent);
      if ((!tp || tp <= 0) && (!dp || dp <= 0)) {
        toast({ title: "Podaj próg cenowy lub % spadku", variant: "destructive" });
        return;
      }
      addAlert({
        url: newUrl.trim(),
        alertType: "price",
        keywords: [],
        priceConfig: {
          thresholdPrice: tp > 0 ? tp : undefined,
          dropPercent: dp > 0 ? dp : undefined,
          cssSelector: cssSelector.trim() || undefined,
        },
        intervalMinutes: parseInt(newInterval) || 60,
        isActive: true,
      });
    }

    setNewUrl("");
    setNewKeywords("");
    setThresholdPrice("");
    setDropPercent("");
    setCssSelector("");
    setShowAdd(false);
    toast({ title: "🔔 Alert dodany", description: `Monitoruję: ${newUrl.trim()}` });
  };

  const checkAlert = async (alert: ContentAlert) => {
    setChecking(alert.id);
    try {
      const response = await firecrawlApi.scrape(alert.url, {
        formats: ["markdown"],
        onlyMainContent: true,
      });

      if (!response?.success) throw new Error("Scraping failed");

      const content = (response.data as any)?.markdown || (response as any).markdown || "";
      const contentLower = content.toLowerCase();
      const notifications: AlertNotification[] = [];

      if (alert.alertType === "price") {
        // Price alert logic
        const currentPrice = extractPrice(content, alert.priceConfig?.cssSelector);

        if (currentPrice !== null) {
          const cfg = alert.priceConfig;
          let triggered = false;
          const reasons: string[] = [];

          // Check threshold
          if (cfg?.thresholdPrice && currentPrice < cfg.thresholdPrice) {
            triggered = true;
            reasons.push(`cena ${currentPrice.toFixed(2)} < próg ${cfg.thresholdPrice.toFixed(2)}`);
          }

          // Check % drop
          if (cfg?.dropPercent && alert.lastPrice != null && alert.lastPrice > 0) {
            const dropPct = ((alert.lastPrice - currentPrice) / alert.lastPrice) * 100;
            if (dropPct >= cfg.dropPercent) {
              triggered = true;
              reasons.push(`spadek ${dropPct.toFixed(1)}% (z ${alert.lastPrice.toFixed(2)} na ${currentPrice.toFixed(2)})`);
            }
          }

          if (triggered) {
            notifications.push({
              id: crypto.randomUUID(),
              alertId: alert.id,
              message: `💰 ${reasons.join("; ")}`,
              matchedKeywords: [],
              timestamp: Date.now(),
              read: false,
            });
            toast({
              title: "💰 Alert cenowy!",
              description: reasons.join("; "),
            });
          } else {
            toast({
              title: "Sprawdzono cenę",
              description: `Aktualna cena: ${currentPrice.toFixed(2)} — brak alertu`,
            });
          }

          updateAlertCheck(alert.id, content, notifications.length > 0 ? notifications : undefined, currentPrice);
        } else {
          toast({
            title: "Nie znaleziono ceny",
            description: "Nie udało się wyciągnąć ceny ze strony",
            variant: "destructive",
          });
          updateAlertCheck(alert.id, content);
        }
      } else {
        // Keyword alert logic (unchanged)
        const matchedKeywords = alert.keywords.filter((kw) =>
          contentLower.includes(kw.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
          notifications.push({
            id: crypto.randomUUID(),
            alertId: alert.id,
            message: `Znaleziono: ${matchedKeywords.join(", ")}`,
            matchedKeywords,
            timestamp: Date.now(),
            read: false,
          });
          toast({
            title: "🔔 Alert!",
            description: `Znaleziono "${matchedKeywords.join(", ")}" na ${alert.url}`,
          });
        }

        if (alert.lastContent && content !== alert.lastContent) {
          const changeNotif: AlertNotification = {
            id: crypto.randomUUID(),
            alertId: alert.id,
            message: "Wykryto zmianę treści na stronie",
            matchedKeywords: [],
            timestamp: Date.now(),
            read: false,
          };
          if (!notifications.some((n) => n.matchedKeywords.length > 0)) {
            notifications.push(changeNotif);
          }
        }

        updateAlertCheck(alert.id, content, notifications.length > 0 ? notifications : undefined);

        if (matchedKeywords.length === 0 && (!alert.lastContent || content === alert.lastContent)) {
          toast({
            title: "Sprawdzono",
            description: `Brak zmian na ${new URL(alert.url).hostname}`,
          });
        }
      }
    } catch (err) {
      console.error("Alert check error:", err);
      toast({
        title: "Błąd sprawdzania",
        description: "Nie udało się pobrać strony",
        variant: "destructive",
      });
    } finally {
      setChecking(null);
    }
  };

  // Auto-check active alerts
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      alerts
        .filter((a) => a.isActive)
        .forEach((a) => {
          const elapsed = a.lastChecked ? now - a.lastChecked : Infinity;
          if (elapsed >= a.intervalMinutes * 60 * 1000) {
            checkAlert(a);
          }
        });
    };

    intervalRef.current = setInterval(check, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [alerts]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-primary uppercase tracking-wider flex items-center gap-2">
          {unreadCount > 0 ? <BellRing className="w-4 h-4 animate-pulse" /> : <Bell className="w-4 h-4" />}
          Alerty treściowe & cenowe
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-mono flex items-center gap-1.5 hover:bg-primary/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nowy alert
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-lg p-4 space-y-3">
              {/* Alert type toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAlertType("keyword")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono transition-colors ${
                    alertType === "keyword"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground border border-border/30 hover:bg-muted/50"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Słowa kluczowe
                </button>
                <button
                  onClick={() => setAlertType("price")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono transition-colors ${
                    alertType === "price"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground border border-border/30 hover:bg-muted/50"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Cena
                </button>
              </div>

              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/page-to-monitor"
                className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
              />

              {alertType === "keyword" ? (
                <input
                  type="text"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="Słowa kluczowe (rozdzielone przecinkiem)"
                  className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
                />
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-mono mb-1 block">
                        Próg cenowy (alert gdy cena &lt; próg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={thresholdPrice}
                        onChange={(e) => setThresholdPrice(e.target.value)}
                        placeholder="np. 99.99"
                        className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-mono mb-1 block">
                        Spadek % (alert gdy spadnie o X%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={dropPercent}
                        onChange={(e) => setDropPercent(e.target.value)}
                        placeholder="np. 10"
                        className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-mono mb-1 block">
                      Selektor CSS (opcjonalny — pomaga znaleźć cenę)
                    </label>
                    <input
                      type="text"
                      value={cssSelector}
                      onChange={(e) => setCssSelector(e.target.value)}
                      placeholder="np. .product-price, #price"
                      className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground font-mono">Sprawdzaj co:</label>
                <select
                  value={newInterval}
                  onChange={(e) => setNewInterval(e.target.value)}
                  className="px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 godz</option>
                  <option value="360">6 godz</option>
                  <option value="1440">24 godz</option>
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdd}
                  disabled={!newUrl.trim()}
                  className="ml-auto px-4 py-2 rounded-md gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
                >
                  Dodaj
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/50 text-xs font-mono">
          <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
          Brak alertów — dodaj pierwszy, by monitorować zmiany
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAlert(alert.id)}
                  className={`p-1 rounded transition-colors ${
                    alert.isActive ? "text-neon-green" : "text-muted-foreground/40"
                  }`}
                  title={alert.isActive ? "Wyłącz" : "Włącz"}
                >
                  {alert.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {alert.alertType === "price" ? (
                      <DollarSign className="w-3 h-3 text-accent shrink-0" />
                    ) : (
                      <Tag className="w-3 h-3 text-primary shrink-0" />
                    )}
                    <span className="text-xs font-mono text-foreground truncate">{alert.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {alert.alertType === "price" ? (
                      <>
                        {alert.priceConfig?.thresholdPrice && (
                          <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[9px] font-mono">
                            &lt; {alert.priceConfig.thresholdPrice.toFixed(2)}
                          </span>
                        )}
                        {alert.priceConfig?.dropPercent && (
                          <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[9px] font-mono">
                            ↓ {alert.priceConfig.dropPercent}%
                          </span>
                        )}
                        {alert.lastPrice != null && (
                          <span className="px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground text-[9px] font-mono">
                            Ostatnia: {alert.lastPrice.toFixed(2)}
                          </span>
                        )}
                      </>
                    ) : (
                      alert.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[9px] font-mono"
                        >
                          {kw}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {alert.notifications.filter((n) => !n.read).length > 0 && (
                    <button
                      onClick={() => setShowNotifs(showNotifs === alert.id ? null : alert.id)}
                      className="relative p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-[8px] text-destructive-foreground flex items-center justify-center">
                        {alert.notifications.filter((n) => !n.read).length}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => checkAlert(alert)}
                    disabled={!!checking}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
                    title="Sprawdź teraz"
                  >
                    {checking === alert.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/60">
                <span className="capitalize">{alert.alertType === "price" ? "💰 Cenowy" : "🔤 Słowa kluczowe"}</span>
                <span>Co {alert.intervalMinutes} min</span>
                {alert.lastChecked && (
                  <span>Ostatnio: {new Date(alert.lastChecked).toLocaleString("pl-PL")}</span>
                )}
              </div>

              <AnimatePresence>
                {showNotifs === alert.id && alert.notifications.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border/20 pt-2 space-y-1 overflow-hidden"
                  >
                    {alert.notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-center gap-2 text-[10px] font-mono p-1.5 rounded ${
                          n.read ? "text-muted-foreground/50" : "text-foreground bg-primary/5"
                        }`}
                      >
                        {n.matchedKeywords.length > 0 ? (
                          <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                        ) : (
                          <Check className="w-3 h-3 text-neon-green shrink-0" />
                        )}
                        <span className="flex-1">{n.message}</span>
                        <span className="text-muted-foreground/40">
                          {new Date(n.timestamp).toLocaleTimeString("pl-PL")}
                        </span>
                        {!n.read && (
                          <button
                            onClick={() => markNotificationRead(alert.id, n.id)}
                            className="text-primary hover:text-primary/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ContentAlerts;
