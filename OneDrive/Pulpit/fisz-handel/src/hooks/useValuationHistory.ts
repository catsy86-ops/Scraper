import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'fisza:valuation-history:v1';
const MAX_ENTRIES = 10;

export interface ValuationHistoryEntry {
  id: string;
  createdAt: number;
  title: string;
  category: string;
  condition: string;
  conditionFilter: string;
  appliedConditionFilter: string | null;
  adjustPct: number;
  suggested: number;
  min: number;
  max: number;
  sampleSize: number;
  source: 'ai' | 'statistics';
  // Full suggestion payload to restore the card exactly
  suggestion: unknown;
}

function read(): ValuationHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: ValuationHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore quota errors
  }
}

export const useValuationHistory = () => {
  const [entries, setEntries] = useState<ValuationHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(read());
  }, []);

  const add = useCallback((entry: Omit<ValuationHistoryEntry, 'id' | 'createdAt'>) => {
    setEntries((prev) => {
      // Dedupe by title+category+conditionFilter — keep newest, drop older same-key
      const key = `${entry.title.toLowerCase()}|${entry.category}|${entry.conditionFilter}`;
      const filtered = prev.filter(
        (e) => `${e.title.toLowerCase()}|${e.category}|${e.conditionFilter}` !== key,
      );
      const next: ValuationHistoryEntry[] = [
        { ...entry, id: crypto.randomUUID(), createdAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ENTRIES);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setEntries([]);
  }, []);

  return { entries, add, remove, clear };
};