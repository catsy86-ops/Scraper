import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, X, MapPin, Calendar, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompare } from '@/hooks/useCompare';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  description: string | null;
  images: string[] | null;
  is_active: boolean;
  is_promoted: boolean;
  created_at: string;
  user_id: string;
}

interface SellerInfo { display_name: string | null; avatar_url: string | null; }

const Compare = () => {
  const navigate = useNavigate();
  const { ids, remove, clear } = useCompare();
  const [items, setItems] = useState<ListingRow[]>([]);
  const [sellers, setSellers] = useState<Record<string, SellerInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('listings')
        .select('id, title, price, category, condition, location, description, images, is_active, is_promoted, created_at, user_id')
        .in('id', ids);
      const ordered = ids
        .map((id) => (data || []).find((d) => d.id === id))
        .filter(Boolean) as ListingRow[];
      setItems(ordered);
      const userIds = Array.from(new Set(ordered.map((l) => l.user_id)));
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        const map: Record<string, SellerInfo> = {};
        (profs || []).forEach((p: any) => { map[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }; });
        setSellers(map);
      }
      setLoading(false);
    })();
  }, [ids]);

  const prices = items.map((i) => Number(i.price)).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const cols = Math.max(items.length, 1);

  const Row = ({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) => (
    <div className={`grid border-b border-border/40 last:border-0`} style={{ gridTemplateColumns: `160px repeat(${cols}, minmax(0, 1fr))` }}>
      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 flex items-center gap-1.5">
        {icon}{label}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl">
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
              <Scale className="h-7 w-7 text-primary" />
              Porównanie ofert
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? 'Ładowanie…' : `${items.length} ${items.length === 1 ? 'oferta' : items.length < 5 ? 'oferty' : 'ofert'} obok siebie`}
            </p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
              <X className="h-4 w-4" />
              Wyczyść porównanie
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(ids.length, 1)}, minmax(0, 1fr))` }}>
            {Array.from({ length: ids.length || 2 }).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl">
            <Scale className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Nie wybrano żadnych ofert do porównania.</p>
            <Button onClick={() => navigate('/')}>Przeglądaj ogłoszenia</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Header with images */}
              <div className="grid border-b border-border" style={{ gridTemplateColumns: `160px repeat(${cols}, minmax(0, 1fr))` }}>
                <div className="bg-muted/30" />
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <motion.div key={it.id} layout className="p-3 border-l border-border/40 relative">
                      <button
                        onClick={() => remove(it.id)}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        aria-label="Usuń z porównania"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <Link to={`/product/${it.id}`} className="block">
                        <div className="aspect-square rounded-xl overflow-hidden bg-secondary/50 mb-2">
                          {it.images && it.images[0] ? (
                            <img src={it.images[0]} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">brak zdjęcia</div>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">{it.title}</h3>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Row label="Cena" icon={<Tag className="h-3.5 w-3.5" />}>
                {items.map((it) => {
                  const isMin = Number(it.price) === minPrice && minPrice !== maxPrice;
                  const isMax = Number(it.price) === maxPrice && minPrice !== maxPrice;
                  return (
                    <div key={it.id} className="px-4 py-3 border-l border-border/40">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl font-bold font-['Space_Grotesk'] ${isMin ? 'text-emerald-500' : isMax ? 'text-destructive' : 'text-primary'}`}>
                          {Number(it.price).toLocaleString('pl-PL')} zł
                        </span>
                        {isMin && <span className="text-[10px] font-bold uppercase text-emerald-500">Najtańsza</span>}
                        {isMax && <span className="text-[10px] font-bold uppercase text-destructive">Najdroższa</span>}
                      </div>
                    </div>
                  );
                })}
              </Row>

              <Row label="Stan">
                {items.map((it) => (
                  <div key={it.id} className="px-4 py-3 border-l border-border/40 capitalize text-sm">{it.condition}</div>
                ))}
              </Row>

              <Row label="Kategoria">
                {items.map((it) => (
                  <div key={it.id} className="px-4 py-3 border-l border-border/40 text-sm">{it.category}</div>
                ))}
              </Row>

              <Row label="Lokalizacja" icon={<MapPin className="h-3.5 w-3.5" />}>
                {items.map((it) => (
                  <div key={it.id} className="px-4 py-3 border-l border-border/40 text-sm">{it.location || <span className="text-muted-foreground">—</span>}</div>
                ))}
              </Row>

              <Row label="Sprzedawca">
                {items.map((it) => {
                  const s = sellers[it.user_id];
                  return (
                    <div key={it.id} className="px-4 py-3 border-l border-border/40 text-sm flex items-center gap-2">
                      {s?.avatar_url ? (
                        <img src={s.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(s?.display_name || '?')[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{s?.display_name || 'Nieznany'}</span>
                    </div>
                  );
                })}
              </Row>

              <Row label="Dodano" icon={<Calendar className="h-3.5 w-3.5" />}>
                {items.map((it) => (
                  <div key={it.id} className="px-4 py-3 border-l border-border/40 text-sm">
                    {new Date(it.created_at).toLocaleDateString('pl-PL')}
                  </div>
                ))}
              </Row>

              <Row label="Status">
                {items.map((it) => (
                  <div key={it.id} className="px-4 py-3 border-l border-border/40 text-sm flex items-center gap-1.5">
                    {it.is_active ? (
                      <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span>Aktywne</span></>
                    ) : (
                      <><AlertCircle className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Nieaktywne</span></>
                    )}
                    {it.is_promoted && <span className="ml-1 text-[10px] font-bold uppercase text-primary">★ Wyróżnione</span>}
                  </div>
                ))}
              </Row>

              <Row label="Opis">
                {items.map((it) => (
                  <div key={it.id} className="px-4 py-3 border-l border-border/40 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {it.description ? (it.description.length > 280 ? it.description.slice(0, 280) + '…' : it.description) : <span className="italic">Brak opisu</span>}
                  </div>
                ))}
              </Row>

              <div className="grid border-t border-border" style={{ gridTemplateColumns: `160px repeat(${cols}, minmax(0, 1fr))` }}>
                <div className="bg-muted/30" />
                {items.map((it) => (
                  <div key={it.id} className="p-3 border-l border-border/40">
                    <Button asChild className="w-full rounded-xl" size="sm">
                      <Link to={`/product/${it.id}`}>Zobacz ofertę</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Compare;