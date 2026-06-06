import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TemplateLastRun {
  timestamp: number;
  duration: number;
  status: 'success' | 'error';
  resultPreview: string;
  error?: string;
}

export interface ScrapingTemplate {
  id: string;
  name: string;
  mode: 'scrape' | 'search' | 'map' | 'crawl';
  input: string;
  options: Record<string, any>;
  createdAt: number;
  lastRun?: TemplateLastRun;
}

export type AlertType = 'keyword' | 'price';

export interface PriceAlertConfig {
  cssSelector?: string; // optional CSS selector hint for price extraction
  thresholdPrice?: number; // notify when price drops below this
  dropPercent?: number; // notify when price drops by this % from last check
}

export interface ContentAlert {
  id: string;
  url: string;
  alertType: AlertType;
  keywords: string[];
  priceConfig?: PriceAlertConfig;
  lastPrice?: number | null;
  intervalMinutes: number;
  lastChecked: number | null;
  lastContent: string | null;
  isActive: boolean;
  createdAt: number;
  notifications: AlertNotification[];
}

export interface AlertNotification {
  id: string;
  alertId: string;
  message: string;
  matchedKeywords: string[];
  timestamp: number;
  read: boolean;
}

export type WebhookPayloadField = 'timestamp' | 'mode' | 'input' | 'title' | 'price' | 'content' | 'markdown' | 'html' | 'links' | 'metadata' | 'source';

export type WebhookPayloadFormat = 'full' | 'flat' | 'wrapped';

export interface WebhookPayloadConfig {
  fields: WebhookPayloadField[];
  format: WebhookPayloadFormat;
  wrapperKey?: string; // for 'wrapped' format
}

export const ALL_PAYLOAD_FIELDS: { key: WebhookPayloadField; label: string }[] = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'mode', label: 'Tryb scrapowania' },
  { key: 'input', label: 'Input (URL/query)' },
  { key: 'title', label: 'Tytuł strony' },
  { key: 'price', label: 'Cena (jeśli wykryta)' },
  { key: 'content', label: 'Treść (markdown)' },
  { key: 'markdown', label: 'Pełny markdown' },
  { key: 'html', label: 'HTML' },
  { key: 'links', label: 'Linki' },
  { key: 'metadata', label: 'Metadane' },
  { key: 'source', label: 'Źródło (app name)' },
];

export const DEFAULT_PAYLOAD_CONFIG: WebhookPayloadConfig = {
  fields: ['timestamp', 'mode', 'input', 'content', 'source'],
  format: 'full',
};

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  headers: Record<string, string>;
  enabled: boolean;
  payloadConfig: WebhookPayloadConfig;
  createdAt: number;
  lastTriggered: number | null;
  lastStatus: number | null;
}

interface FeaturesState {
  // Templates
  templates: ScrapingTemplate[];
  addTemplate: (template: Omit<ScrapingTemplate, 'id' | 'createdAt'>) => void;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, data: Partial<ScrapingTemplate>) => void;

  // Alerts
  alerts: ContentAlert[];
  addAlert: (alert: Omit<ContentAlert, 'id' | 'createdAt' | 'lastChecked' | 'lastContent' | 'lastPrice' | 'notifications'>) => void;
  deleteAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  updateAlertCheck: (id: string, content: string, notifications?: AlertNotification[], price?: number) => void;
  markNotificationRead: (alertId: string, notifId: string) => void;
  getUnreadCount: () => number;

  // Webhooks
  webhooks: WebhookConfig[];
  addWebhook: (webhook: Omit<WebhookConfig, 'id' | 'createdAt' | 'lastTriggered' | 'lastStatus'>) => void;
  deleteWebhook: (id: string) => void;
  toggleWebhook: (id: string) => void;
  updateWebhookStatus: (id: string, status: number) => void;
  updateWebhookPayloadConfig: (id: string, config: WebhookPayloadConfig) => void;
}

export const useFeaturesStore = create<FeaturesState>()(
  persist(
    (set, get) => ({
      templates: [],
      alerts: [],
      webhooks: [],

      // Templates
      addTemplate: (template) =>
        set((state) => ({
          templates: [
            { ...template, id: crypto.randomUUID(), createdAt: Date.now() },
            ...state.templates,
          ],
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      updateTemplate: (id, data) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),

      // Alerts
      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              lastChecked: null,
              lastContent: null,
              lastPrice: null,
              notifications: [],
            },
            ...state.alerts,
          ],
        })),

      deleteAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),

      toggleAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          ),
        })),

      updateAlertCheck: (id, content, notifications, price) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  lastChecked: Date.now(),
                  lastContent: content,
                  ...(price !== undefined ? { lastPrice: price } : {}),
                  notifications: notifications
                    ? [...notifications, ...a.notifications].slice(0, 50)
                    : a.notifications,
                }
              : a
          ),
        })),

      markNotificationRead: (alertId, notifId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? {
                  ...a,
                  notifications: a.notifications.map((n) =>
                    n.id === notifId ? { ...n, read: true } : n
                  ),
                }
              : a
          ),
        })),

      getUnreadCount: () => {
        return get().alerts.reduce(
          (count, a) =>
            count + a.notifications.filter((n) => !n.read).length,
          0
        );
      },

      // Webhooks
      addWebhook: (webhook) =>
        set((state) => ({
          webhooks: [
            {
              ...webhook,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              lastTriggered: null,
              lastStatus: null,
            },
            ...state.webhooks,
          ],
        })),

      deleteWebhook: (id) =>
        set((state) => ({
          webhooks: state.webhooks.filter((w) => w.id !== id),
        })),

      toggleWebhook: (id) =>
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        })),

      updateWebhookStatus: (id, status) =>
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id
              ? { ...w, lastTriggered: Date.now(), lastStatus: status }
              : w
          ),
        })),

      updateWebhookPayloadConfig: (id, config) =>
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id ? { ...w, payloadConfig: config } : w
          ),
        })),
    }),
    {
      name: 'webscraper-features',
    }
  )
);
