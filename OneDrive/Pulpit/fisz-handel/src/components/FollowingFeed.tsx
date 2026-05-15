import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFollowing } from '@/hooks/useFollows';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Listing {
  id: string; title: string; price: number; images: string[] | null;
  category: string; condition: string; location: string | null;
  description: string | null; user_id: string; created_at: string; is_promoted: boolean;
}

const PAGE_SIZE = 12;

const FollowingFeed = () => {
  const { followingIds, loading: loadingFollows } = useFollowing();
  const [listings, setListings] = useState<Listing[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchProfilesFor = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);
    if (!profs) return;
    setProfiles((prev) => {
      const next = { ...prev };
      profs.forEach((p) => { next[p.user_id] = p; });
      return next;
    });
  }, []);

  const loadPage = useCallback(async (pageIndex: number) => {
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from('listings')
      .select('*')
      .in('user_id', followingIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    const rows = (data as Listing[]) || [];
    setListings((prev) => {
      if (pageIndex === 0) return rows;
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...rows.filter((r) => !seen.has(r.id))];
    });
    const newIds = [...new Set(rows.map((r) => r.user_id))];
    await fetchProfilesFor(newIds);
    setHasMore(rows.length === PAGE_SIZE);
  }, [followingIds, fetchProfilesFor]);

  useEffect(() => {
    if (loadingFollows) return;
    if (followingIds.length === 0) {
      setListings([]); setLoading(false); setHasMore(false); setPage(0); return;
    }
    setLoading(true);
    setPage(0);
    setHasMore(true);
    (async () => {
      await loadPage(0);
      setLoading(false);
    })();
  }, [followingIds, loadingFollows, loadPage]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting) return;
      setLoadingMore(true);
      const next = page + 1;
      await loadPage(next);
      setPage(next);
      setLoadingMore(false);
    }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, loadPage]);

  if (loadingFollows || loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
      </div>
    );
  }

  if (followingIds.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nie obserwujesz jeszcze nikogo</p>
        <p className="text-xs text-muted-foreground mt-1">Otwórz dowolne ogłoszenie i obserwuj sprzedawcę</p>
        <Link to="/"><Button variant="outline" className="mt-4 rounded-xl">Przeglądaj ogłoszenia</Button></Link>
      </div>
    );
  }

  if (listings.length === 0) {
    return <p className="text-center py-12 text-muted-foreground">Obserwowani sprzedawcy nie mają nowych ogłoszeń</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {listings.map((l, i) => (
        <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
          <ProductCard
            product={{
              id: l.id, title: l.title, price: l.price,
              image: l.images?.[0] || '/placeholder.svg',
              category: l.category, condition: l.condition as never,
              location: l.location || '',
              seller: profiles[l.user_id]?.display_name || 'Użytkownik',
              sellerAvatar: profiles[l.user_id]?.avatar_url || '',
              description: l.description || '',
              createdAt: new Date(l.created_at).toLocaleDateString('pl-PL'),
              isPromoted: l.is_promoted,
            }}
          />
        </motion.div>
      ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
      )}
      {!hasMore && listings.length > PAGE_SIZE && (
        <p className="text-center text-xs text-muted-foreground py-6">To już wszystkie ogłoszenia</p>
      )}
    </>
  );
};

export default FollowingFeed;