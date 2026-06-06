import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, Tag, Clock, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { categories } from '@/data/mockProducts';

interface SearchResult {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string | null;
}

const RECENT_KEY = 'fisza_recent_searches';
const MAX_RECENT = 5;

const getRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
};

const saveRecent = (query: string) => {
  const list = getRecent().filter((q) => q !== query);
  list.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
};

interface LiveSearchProps {
  className?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const LiveSearch = ({ className = '', onSearch, placeholder = 'Szukaj wśród tysięcy ofert...' }: LiveSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const recentSearches = getRecent();

  const matchingCategories = query.length >= 1
    ? categories.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : [];

  const totalItems = matchingCategories.length + results.length + (recentSearches.length > 0 && !query ? recentSearches.length : 0);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, category, images')
      .eq('is_active', true)
      .ilike('title', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(6);

    setResults(
      (data || []).map((d) => ({
        id: d.id,
        title: d.title,
        price: d.price,
        category: d.category,
        image: d.images?.[0] || null,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 250);
    setActiveIndex(-1);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchResults]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submitSearch = (q: string) => {
    if (!q.trim()) return;
    saveRecent(q.trim());
    onSearch?.(q.trim());
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        // navigate to the active item
        const catLen = matchingCategories.length;
        if (activeIndex < catLen) {
          onSearch?.(matchingCategories[activeIndex]);
          setQuery(matchingCategories[activeIndex]);
          setOpen(false);
        } else {
          const resultIdx = activeIndex - catLen;
          if (resultIdx < results.length) {
            navigate(`/product/${results[resultIdx].id}`);
            setOpen(false);
          }
        }
      } else {
        submitSearch(query);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }
  };

  const showDropdown = open && (query.length >= 1 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 bg-secondary/60 border-border/50 rounded-xl focus:bg-background focus:border-primary/50 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Recent searches when no query */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1.5">Ostatnie wyszukiwania</p>
              {recentSearches.map((r, i) => (
                <button
                  key={r}
                  onClick={() => { setQuery(r); submitSearch(r); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                    activeIndex === i ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{r}</span>
                </button>
              ))}
            </div>
          )}

          {/* Category matches */}
          {query && matchingCategories.length > 0 && (
            <div className="p-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1.5">Kategorie</p>
              {matchingCategories.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => { onSearch?.(cat); setQuery(cat); setOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                    activeIndex === i ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <Tag className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span>{cat}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          )}

          {/* Listing results */}
          {query && results.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1.5">Ogłoszenia</p>
              {results.map((r, i) => {
                const idx = matchingCategories.length + i;
                return (
                  <button
                    key={r.id}
                    onClick={() => { saveRecent(query); navigate(`/product/${r.id}`); setOpen(false); }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      activeIndex === idx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                  >
                    {r.image ? (
                      <img src={r.image} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-secondary flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.category}</p>
                    </div>
                    <span className="text-sm font-bold text-primary flex-shrink-0 font-['Space_Grotesk']">
                      {r.price} zł
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && results.length === 0 && matchingCategories.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Brak wyników dla „{query}"
            </div>
          )}

          {/* Search all */}
          {query.length >= 2 && (
            <button
              onClick={() => submitSearch(query)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 border-t border-border text-sm font-medium text-primary hover:bg-accent/50 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              Szukaj „{query}" we wszystkich ofertach
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveSearch;
