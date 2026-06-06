import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import CategoryBar from '@/components/CategoryBar';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import SearchFilters, { defaultFilters, type Filters } from '@/components/SearchFilters';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { Loader2, Shield, Zap, Heart, ArrowRight, Bookmark, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SaveSearchDialog from '@/components/SaveSearchDialog';
import FollowingFeed from '@/components/FollowingFeed';
import { useFollowing } from '@/hooks/useFollows';

const ProductSkeleton = () => (
  <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-1/3" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  </div>
);

const PAGE_SIZE = 12;

interface DBListing {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
  category: string;
  condition: string;
  location: string | null;
  description: string | null;
  user_id: string;
  created_at: string;
  is_active: boolean | null;
  is_promoted: boolean;
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFav, toggle: toggleFav } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [saveOpen, setSaveOpen] = useState(false);
  const { followingIds } = useFollowing();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setFilters((f) => ({ ...f, search: q }));
    }
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const [listings, setListings] = useState<DBListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);
    if (profileData) {
      setProfiles((prev) => {
        const map = { ...prev };
        profileData.forEach((p) => { map[p.user_id] = p; });
        return map;
      });
    }
  };

  const fetchListings = async (offset: number = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .order('is_promoted', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) {
      if (offset === 0) {
        setListings(data);
      } else {
        setListings((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);

      const newUserIds = [...new Set(data.map((l) => l.user_id))].filter((id) => !profiles[id]);
      await fetchProfiles(newUserIds);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    setListings([]);
    setHasMore(true);
    fetchListings(0);
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchListings(listings.length);
  }, [loadingMore, hasMore, listings.length]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  const filteredProducts = useMemo(() => {
    let result = [...listings];

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }

    result = result.filter((p) => p.price >= filters.priceMin && p.price <= filters.priceMax);

    if (filters.conditions.length > 0) {
      result = result.filter((p) => filters.conditions.includes(p.condition));
    }

    if (filters.location) {
      result = result.filter((p) => p.location === filters.location);
    }

    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    // Always show promoted first
    result.sort((a, b) => {
      if (a.is_promoted && !b.is_promoted) return -1;
      if (!a.is_promoted && b.is_promoted) return 1;
      return 0;
    });

    return result;
  }, [listings, selectedCategory, filters]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroBanner />

      <main className="container mx-auto px-4 flex-1">
        <CategoryBar selected={selectedCategory} onSelect={setSelectedCategory} />
        <SearchFilters filters={filters} onChange={setFilters} />

        <section className="pb-8 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {selectedCategory ?? 'Najnowsze oferty'}
            </h2>
            <div className="flex items-center gap-2">
              {(filters.search || selectedCategory || filters.location || filters.conditions.length > 0 || filters.priceMin > 0 || filters.priceMax < 10000) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full text-xs hover:border-primary/50 hover:text-primary"
                  onClick={() => { if (!user) { navigate('/auth'); return; } setSaveOpen(true); }}
                >
                  <Bookmark className="h-3.5 w-3.5" /> Zapisz wyszukiwanie
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'oferta' : 'ofert'}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {filteredProducts.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
                  >
                    <ProductCard
                      isFavorite={isFav(listing.id)}
                      onToggleFavorite={() => {
                        if (!user) { navigate('/auth'); return; }
                        toggleFav(listing.id);
                      }}
                      product={{
                        id: listing.id,
                        title: listing.title,
                        price: listing.price,
                        image: listing.images?.[0] || '/placeholder.svg',
                        category: listing.category,
                        condition: listing.condition as any,
                        location: listing.location || '',
                        seller: profiles[listing.user_id]?.display_name || 'Użytkownik',
                        sellerAvatar: profiles[listing.user_id]?.avatar_url || '',
                        description: listing.description || '',
                        createdAt: new Date(listing.created_at).toLocaleDateString('pl-PL'),
                        isPromoted: listing.is_promoted,
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-1" />

              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Ładowanie kolejnych…</span>
                </div>
              )}

              {!hasMore && listings.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  To już wszystkie ogłoszenia
                </p>
              )}

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    {listings.length === 0 ? 'Brak ogłoszeń — dodaj pierwsze!' : 'Brak ofert pasujących do filtrów'}
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Following feed */}
        {user && followingIds.length > 0 && (
          <section className="pb-12 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Od obserwowanych</h2>
              </div>
              <Link to="/profile" className="text-sm text-primary font-medium hover:underline">Zobacz wszystkie →</Link>
            </div>
            <FollowingFeed />
          </section>
        )}

        {/* O nas section */}
        <section className="py-12 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border/60 bg-card p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] mb-3">
                Dlaczego <span className="text-primary">u</span>Fisza?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Polska platforma marketplace, na której kupujesz i sprzedajesz szybko, bezpiecznie i wygodnie.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {[
                { icon: Shield, title: 'Bezpieczeństwo', desc: 'Chronione transakcje i zweryfikowani użytkownicy' },
                { icon: Zap, title: 'Szybkość', desc: 'Dodaj ogłoszenie w minutę, znajdź w sekundy' },
                { icon: Heart, title: 'Społeczność', desc: 'System recenzji i zaufana społeczność' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="text-center p-4"
                >
                  <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/about">
                <Button variant="outline" className="rounded-xl gap-2 hover:bg-primary/10 hover:text-primary transition-all">
                  Poznaj nas bliżej <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
      <SaveSearchDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        initial={{
          query: filters.search,
          category: selectedCategory,
          location: filters.location,
          min_price: filters.priceMin > 0 ? filters.priceMin : null,
          max_price: filters.priceMax < 10000 ? filters.priceMax : null,
          condition: filters.conditions[0] || null,
        }}
      />
    </div>
  );
};

export default Index;
