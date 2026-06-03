import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook, Plus, Trash2, Play, Loader2, Check, X,
  ToggleLeft, ToggleRight, Settings2, Send, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  useFeaturesStore,
  type WebhookConfig,
  type WebhookPayloadField,
  type WebhookPayloadFormat,
  ALL_PAYLOAD_FIELDS,
  DEFAULT_PAYLOAD_CONFIG,
} from "@/store/featuresStore";
import { useScraperStore } from "@/store/scraperStore";
import { useToast } from "@/components/ui/use-toast";

/** Build payload based on config */
function buildPayload(
  config: WebhookConfig["payloadConfig"],
  result: any,
  mode: string,
  lastInput: string
) {
  const fieldValues: Record<WebhookPayloadField, any> = {
    timestamp: new Date().toISOString(),
    mode,
    input: lastInput,
    title: result?.metadata?.title || result?.data?.metadata?.title || "",
    price: (() => {
      const text = result?.markdown || result?.data?.markdown || "";
      const m = text.match(/(\d[\d\s]*[.,]\d{2})/);
      return m ? m[1].replace(/\s/g, "").replace(",", ".") : null;
    })(),
    content: result?.markdown || result?.data?.markdown || "",
    markdown: result?.markdown || result?.data?.markdown || "",
    html: result?.html || result?.data?.html || "",
    links: result?.links || result?.data?.links || [],
    metadata: result?.metadata || result?.data?.metadata || {},
    source: "Scraper by Kaczy",
  };

  const selected: Record<string, any> = {};
  for (const f of config.fields) {
    selected[f] = fieldValues[f];
  }

  if (config.format === "wrapped" && config.wrapperKey) {
    return { [config.wrapperKey]: selected };
  }
  if (config.format === "flat") {
    return selected;
  }
  // 'full' — include a data wrapper
  return { data: selected, sentAt: new Date().toISOString() };
}

const PayloadFieldPicker = ({
  config,
  onChange,
}: {
  config: WebhookConfig["payloadConfig"];
  onChange: (c: WebhookConfig["payloadConfig"]) => void;
}) => {
  const toggleField = (field: WebhookPayloadField) => {
    const fields = config.fields.includes(field)
      ? config.fields.filter((f) => f !== field)
      : [...config.fields, field];
    onChange({ ...config, fields });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-muted-foreground font-mono mb-1.5 block uppercase tracking-wider">
          Pola w payloadzie
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PAYLOAD_FIELDS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleField(key)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors border ${
                config.fields.includes(key)
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-muted/20 text-muted-foreground/60 border-border/30 hover:bg-muted/40"
              }`}
            >
              {config.fields.includes(key) && <Check className="w-2.5 h-2.5 inline mr-1" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground font-mono mb-1.5 block uppercase tracking-wider">
          Format payloadu
        </label>
        <div className="flex gap-2">
          {(
            [
              { key: "flat", label: "Flat", desc: "{ field: value, ... }" },
              { key: "full", label: "Wrapped (data)", desc: '{ data: {...}, sentAt }' },
              { key: "wrapped", label: "Custom key", desc: '{ customKey: {...} }' },
            ] as const
          ).map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => onChange({ ...config, format: key })}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-mono transition-colors border ${
                config.format === key
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-muted/20 text-muted-foreground/60 border-border/30 hover:bg-muted/40"
              }`}
            >
              <div className="font-semibold">{label}</div>
              <div className="text-[8px] text-muted-foreground/50 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {config.format === "wrapped" && (
        <input
          type="text"
          value={config.wrapperKey || ""}
          onChange={(e) => onChange({ ...config, wrapperKey: e.target.value })}
          placeholder="Klucz wrappera (np. payload, results)"
          className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-xs focus:outline-none focus:border-primary/50"
        />
      )}

      {/* Preview */}
      <div>
        <label className="text-[10px] text-muted-foreground font-mono mb-1 block uppercase tracking-wider">
          Podgląd schematu
        </label>
        <pre className="p-2 rounded bg-muted/30 text-[9px] font-mono text-muted-foreground overflow-auto max-h-24 border border-border/20">
          {JSON.stringify(
            buildPayload(
              config,
              { markdown: "...", metadata: { title: "Example" }, links: ["..."] },
              "scrape",
              "https://example.com"
            ),
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

const WebhookExport = () => {
  const { webhooks, addWebhook, deleteWebhook, toggleWebhook, updateWebhookStatus, updateWebhookPayloadConfig } = useFeaturesStore();
  const { result, mode, lastInput } = useScraperStore();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newHeaders, setNewHeaders] = useState("");
  const [newPayloadConfig, setNewPayloadConfig] = useState(DEFAULT_PAYLOAD_CONFIG);
  const [showPayloadSetup, setShowPayloadSetup] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    let headers: Record<string, string> = {};
    if (newHeaders.trim()) {
      try {
        headers = JSON.parse(newHeaders.trim());
      } catch {
        toast({ title: "Błąd", description: "Nieprawidłowy format nagłówków (JSON)", variant: "destructive" });
        return;
      }
    }
    if (newPayloadConfig.fields.length === 0) {
      toast({ title: "Wybierz przynajmniej 1 pole", variant: "destructive" });
      return;
    }
    addWebhook({
      name: newName.trim(),
      url: newUrl.trim(),
      headers,
      enabled: true,
      payloadConfig: { ...newPayloadConfig },
    });
    setNewName("");
    setNewUrl("");
    setNewHeaders("");
    setNewPayloadConfig(DEFAULT_PAYLOAD_CONFIG);
    setShowPayloadSetup(false);
    setShowAdd(false);
    toast({ title: "🔗 Webhook dodany", description: newName.trim() });
  };

  const sendToWebhook = async (webhook: WebhookConfig) => {
    if (!result) {
      toast({ title: "Brak wyników", description: "Najpierw wykonaj scraping", variant: "destructive" });
      return;
    }
    setSending(webhook.id);
    try {
      const payload = buildPayload(webhook.payloadConfig, result, mode, lastInput);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...webhook.headers,
        },
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      updateWebhookStatus(webhook.id, 200);
      toast({
        title: "📤 Wysłano",
        description: `Dane wysłane do "${webhook.name}". Sprawdź odbiorcę.`,
      });
    } catch (err) {
      console.error("Webhook error:", err);
      updateWebhookStatus(webhook.id, 0);
      toast({
        title: "Błąd webhook",
        description: "Nie udało się wysłać danych",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const sendToAll = async () => {
    const active = webhooks.filter((w) => w.enabled);
    if (active.length === 0) {
      toast({ title: "Brak aktywnych webhooków", variant: "destructive" });
      return;
    }
    for (const w of active) {
      await sendToWebhook(w);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-primary uppercase tracking-wider flex items-center gap-2">
          <Webhook className="w-4 h-4" />
          Eksport Webhook / API
        </h3>
        <div className="flex gap-2">
          {webhooks.some((w) => w.enabled) && result && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendToAll}
              className="px-3 py-1.5 rounded-md bg-neon-green/20 text-neon-green text-xs font-mono flex items-center gap-1.5 hover:bg-neon-green/30 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Wyślij do wszystkich
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-mono flex items-center gap-1.5 hover:bg-primary/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nowy webhook
          </motion.button>
        </div>
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
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nazwa (np. Zapier, Make, n8n)"
                className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
              />
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
              />
              <input
                type="text"
                value={newHeaders}
                onChange={(e) => setNewHeaders(e.target.value)}
                placeholder='Nagłówki (opcjonalne JSON): {"Authorization": "Bearer ..."}'
                className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:border-primary/50"
              />

              {/* Payload config toggle */}
              <button
                onClick={() => setShowPayloadSetup(!showPayloadSetup)}
                className="flex items-center gap-1.5 text-xs font-mono text-primary/80 hover:text-primary transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Konfiguracja payloadu
                {showPayloadSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {showPayloadSetup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 rounded-md bg-muted/20 border border-border/20">
                      <PayloadFieldPicker config={newPayloadConfig} onChange={setNewPayloadConfig} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                disabled={!newName.trim() || !newUrl.trim()}
                className="w-full px-4 py-2 rounded-md gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
              >
                Dodaj webhook
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {webhooks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/50 text-xs font-mono">
          <Webhook className="w-6 h-6 mx-auto mb-2 opacity-30" />
          Dodaj webhook, by automatycznie wysyłać wyniki scrapowania
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWebhook(w.id)}
                  className="transition-colors"
                >
                  {w.enabled ? (
                    <ToggleRight className="w-5 h-5 text-neon-green" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-foreground">{w.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground/60 truncate">{w.url}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(w.payloadConfig?.fields || []).map((f) => (
                      <span key={f} className="px-1 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-mono">
                        {f}
                      </span>
                    ))}
                    {w.payloadConfig && (
                      <span className="px-1 py-0.5 rounded bg-accent/10 text-accent text-[8px] font-mono">
                        {w.payloadConfig.format}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {w.lastStatus !== null && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        w.lastStatus === 200
                          ? "bg-neon-green/10 text-neon-green"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {w.lastStatus === 200 ? "OK" : `ERR ${w.lastStatus}`}
                    </span>
                  )}
                  <button
                    onClick={() => setShowConfig(showConfig === w.id ? null : w.id)}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => sendToWebhook(w)}
                    disabled={!result || !!sending}
                    className="p-1 rounded text-muted-foreground hover:text-neon-green transition-colors disabled:opacity-40"
                    title="Wyślij teraz"
                  >
                    {sending === w.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteWebhook(w.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showConfig === w.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 pt-2 border-t border-border/20 space-y-3 overflow-hidden"
                  >
                    <div className="text-[10px] font-mono text-muted-foreground">
                      URL: <span className="text-foreground break-all">{w.url}</span>
                    </div>
                    {Object.keys(w.headers).length > 0 && (
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Nagłówki: <span className="text-foreground/70">{JSON.stringify(w.headers)}</span>
                      </div>
                    )}

                    {/* Editable payload config */}
                    <PayloadFieldPicker
                      config={w.payloadConfig || DEFAULT_PAYLOAD_CONFIG}
                      onChange={(c) => updateWebhookPayloadConfig(w.id, c)}
                    />

                    {w.lastTriggered && (
                      <div className="text-[10px] font-mono text-muted-foreground/50">
                        Ostatnio: {new Date(w.lastTriggered).toLocaleString("pl-PL")}
                      </div>
                    )}
                    <div className="text-[10px] font-mono text-muted-foreground/50">
                      Utworzono: {new Date(w.createdAt).toLocaleString("pl-PL")}
                    </div>
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

export default WebhookExport;
