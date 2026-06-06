import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

const STORAGE_KEY = 'compare:listings';
const MAX_COMPARE = 4;

type CompareCtx = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
  isFull: boolean;
  max: number;
};

const Ctx = createContext<CompareCtx | null>(null);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* noop */ }
  }, [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => setIds((p) => p.filter((x) => x !== id)), []);
  const clear = useCallback(() => setIds([]), []);
  const isInCompare = useCallback((id: string) => ids.includes(id), [ids]);

  return (
    <Ctx.Provider value={{ ids, toggle, remove, clear, isInCompare, isFull: ids.length >= MAX_COMPARE, max: MAX_COMPARE }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
};