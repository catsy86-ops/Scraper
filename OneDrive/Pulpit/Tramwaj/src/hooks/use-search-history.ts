import { useState, useCallback } from "react";

const STORAGE_KEY = "kacztransit-search-history";
const MAX_HISTORY = 10;

export interface SearchEntry {
  from: string;
  to: string;
  timestamp: number;
}

function readHistory(): SearchEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchEntry[]>(readHistory);

  const addEntry = useCallback((from: string, to: string) => {
    if (!from || !to) return;
    setHistory((prev) => {
      const filtered = prev.filter(
        (e) => !(e.from === from && e.to === to)
      );
      const next = [{ from, to, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeEntry = useCallback((index: number) => {
    setHistory((prev) => {
      const next = prev.filter((_, i) => i !== index);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
