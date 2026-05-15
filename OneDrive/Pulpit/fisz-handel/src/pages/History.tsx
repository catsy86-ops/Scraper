import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, History as HistoryIcon, Trash2, Search, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { useAuth } from '@/hooks/useAuth';
import { categories } from '@/data/mockProducts';

type SortKey = 'recent' | 'oldest' | 'price-asc' | 'price-desc' | 'most-viewed';

const conditionOptions = ['nowy', 'jak nowy', 'dobry', 'używany'] as const;

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'przed chwilą';
  if (m < 60) return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} dni temu`;
  return new Date(iso).toLocaleDateString('pl-PL');
};

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading, clearAll, removeOne } = useViewHistory();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [condition, setCondition] = useState<string>('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false;
      if (category !== 'all' && i.category !== category) return false;
      if (condition !== 'all' && i.condition !== condition) return false;
      if (activeOnly && !i.isActive) return false;
      return true;
    });
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest': return new Date(a.lastViewedAt).getTime() - new Date(b.lastViewedAt).getTime();
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'most-viewed': return b.viewCount - a.viewCount;
        case 'recent':
        default: return new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime();
      }
    });
    return sorted;
  }, [items, query, category, condition, activeOnly, sort]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 flex-1 max-w-2xl text-center">
          <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2 font-['Space_Grotesk']">Historia obejrzanych</h1>
          <p className="text-muted-foreground mb-6">Zaloguj się, aby zobaczyć historię ofert, które przeglądałeś.</p>
          <Button onClick={() => navigate('/auth')}>Zaloguj się</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex-1 max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Wróć</span>
        </button>

        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
              <HistoryIcon className="h-7 w-7 text-primary" />
              Historia obejrzanych
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? 'Ładowanie…' : `${items.length} unikalnych ${items.length === 1 ? 'ogłoszenia' : 'ogłoszeń'}`}
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Wyczyścić całą historię?')) clearAll();
              }}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-4 w-4" />
              Wyczyść wszystko
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 p-4 rounded-2xl border border-border/60 bg-card">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj w historii…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="md:col-span-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Kategoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Stan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Każdy stan</SelectItem>
                {conditionOptions.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Ostatnio oglądane</SelectItem>
                <SelectItem value="oldest">Najstarsze</SelectItem>
                <SelectItem value="price-asc">Cena rosnąco</SelectItem>
                <SelectItem value="price-desc">Cena malejąco</SelectItem>
                <SelectItem value="most-viewed">Najczęściej oglądane</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="md:col-span-12 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Tylko aktywne ogłoszenia
          </label>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
            <HistoryIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {items.length === 0 ? 'Twoja historia jest pusta. Przeglądaj oferty, aby się tutaj pojawiły.' : 'Brak wyników dla wybranych filtrów.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((item) => (
                <motion.li
                  key={item.listingId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="group flex items-center gap-4 p-3 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-elegant transition-all"
                >
                  <Link
                    to={`/product/${item.listingId}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="h-20 w-20 rounded-xl overflow-hidden bg-secondary/50 flex-shrink-0 relative">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">brak zdjęcia</div>
                      )}
                      {!item.isActive && (
                        <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center text-[10px] font-semibold uppercase text-muted-foreground">
                          nieaktywne
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-base font-bold text-primary font-['Space_Grotesk'] mt-0.5">
                        {item.price.toLocaleString('pl-PL')} zł
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        <span className="capitalize px-1.5 py-0.5 rounded bg-muted">{item.condition}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                        {item.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{item.location}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatRelative(item.lastViewedAt)}
                        {item.viewCount > 1 && <span className="ml-2 text-primary">• {item.viewCount}× oglądane</span>}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOne(item.listingId)}
                    aria-label="Usuń z historii"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default History;