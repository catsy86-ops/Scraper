import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
  fromCache?: boolean;
  attempts?: number;
};

type CallOptions = {
  signal?: AbortSignal;
  cache?: boolean;
  retries?: number;
  timeoutMs?: number;
};

// ===== In-memory cache (TTL 5min) =====
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE = 50;
const cache = new Map<string, { ts: number; data: any }>();

const cacheKey = (fn: string, input: string, options?: Record<string, any>) =>
  `${fn}::${input}::${JSON.stringify(options ?? {})}`;

const getCached = (key: string) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return hit.data;
};

const setCached = (key: string, data: any) => {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { ts: Date.now(), data });
};

export const clearFirecrawlCache = () => cache.clear();

// ===== Retry with exponential backoff =====
const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });

const isRetryableError = (err: any): boolean => {
  const msg = (err?.message || err?.error || '').toString().toLowerCase();
  if (!msg) return false;
  return /timeout|network|fetch|503|502|504|429|rate limit|temporarily/i.test(msg);
};

async function withRetryAndCache<T>(
  fnName: string,
  input: string,
  options: Record<string, any> | undefined,
  invoke: (signal?: AbortSignal) => Promise<{ data: any; error: any }>,
  callOpts?: CallOptions,
): Promise<FirecrawlResponse<T>> {
  const useCache = callOpts?.cache ?? true;
  const retries = callOpts?.retries ?? 2;
  const timeoutMs = callOpts?.timeoutMs ?? 60_000;
  const key = cacheKey(fnName, input, options);

  if (useCache) {
    const hit = getCached(key);
    if (hit) return { ...hit, fromCache: true };
  }

  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (callOpts?.signal?.aborted) {
      return { success: false, error: 'Anulowano', attempts: attempt };
    }

    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    callOpts?.signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const { data, error } = await invoke(ctrl.signal);
      clearTimeout(timer);
      callOpts?.signal?.removeEventListener('abort', onAbort);

      if (error) {
        lastErr = error;
        if (!isRetryableError(error) || attempt === retries) {
          return { success: false, error: error.message || 'Błąd zapytania', attempts: attempt + 1 };
        }
      } else if (data?.success === false) {
        lastErr = data;
        if (!isRetryableError(data) || attempt === retries) {
          return { ...data, attempts: attempt + 1 };
        }
      } else {
        if (useCache && data) setCached(key, data);
        return { ...data, attempts: attempt + 1 };
      }
    } catch (e: any) {
      clearTimeout(timer);
      callOpts?.signal?.removeEventListener('abort', onAbort);
      if (callOpts?.signal?.aborted) {
        return { success: false, error: 'Anulowano', attempts: attempt + 1 };
      }
      if (e?.name === 'AbortError') {
        lastErr = { message: 'Przekroczono limit czasu (timeout)' };
      } else {
        lastErr = e;
      }
      if (attempt === retries) {
        return { success: false, error: lastErr?.message || 'Błąd sieci', attempts: attempt + 1 };
      }
    }

    // Exponential backoff: 500ms, 1500ms, 4500ms...
    const delay = 500 * Math.pow(3, attempt) + Math.random() * 250;
    try {
      await sleep(delay, callOpts?.signal);
    } catch {
      return { success: false, error: 'Anulowano', attempts: attempt + 1 };
    }
  }

  return { success: false, error: lastErr?.message || 'Nie udało się wykonać zapytania', attempts: retries + 1 };
}

export const firecrawlApi = {
  async scrape(url: string, options?: Record<string, any>, callOpts?: CallOptions): Promise<FirecrawlResponse> {
    return withRetryAndCache('scrape', url, options,
      () => supabase.functions.invoke('firecrawl-scrape', { body: { url, options } }),
      callOpts);
  },

  async search(query: string, options?: Record<string, any>, callOpts?: CallOptions): Promise<FirecrawlResponse> {
    return withRetryAndCache('search', query, options,
      () => supabase.functions.invoke('firecrawl-search', { body: { query, options } }),
      callOpts);
  },

  async map(url: string, options?: Record<string, any>, callOpts?: CallOptions): Promise<FirecrawlResponse> {
    return withRetryAndCache('map', url, options,
      () => supabase.functions.invoke('firecrawl-map', { body: { url, options } }),
      callOpts);
  },

  async crawl(url: string, options?: Record<string, any>, callOpts?: CallOptions): Promise<FirecrawlResponse> {
    // Crawl bywa długie — większy timeout, brak cache
    return withRetryAndCache('crawl', url, options,
      () => supabase.functions.invoke('firecrawl-crawl', { body: { url, options } }),
      { ...callOpts, cache: callOpts?.cache ?? false, timeoutMs: callOpts?.timeoutMs ?? 180_000 });
  },

  async crawlStatus(jobId: string, signal?: AbortSignal): Promise<any> {
    const { data, error } = await supabase.functions.invoke('firecrawl-crawl-status', { body: { jobId } });
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (error) throw new Error(error.message || 'Nie udało się pobrać statusu crawl');
    return data;
  },
};

