import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DailyStat { date: string; views: number }

export const trackListingView = async (listingId: string, viewerId?: string | null) => {
  // Only logged-in viewers count toward stats (RLS requires viewer_id = auth.uid()).
  // Duplicates per day are silently ignored by the unique index.
  if (!viewerId) return;
  try {
    await supabase.from('listing_views').insert({ listing_id: listingId, viewer_id: viewerId });
  } catch { /* noop */ }
};

export const useListingStats = (listingId: string | undefined) => {
  const { user } = useAuth();
  const [totalViews, setTotalViews] = useState(0);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId || !user) return;
    setLoading(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    supabase.from('listing_views').select('created_at').eq('listing_id', listingId).gte('created_at', since)
      .then(({ data }) => {
        const rows = data || [];
        setTotalViews(rows.length);
        const map = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const k = d.toISOString().slice(0, 10);
          map.set(k, 0);
        }
        rows.forEach((r: { created_at: string }) => {
          const k = r.created_at.slice(0, 10);
          if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
        });
        setDaily(Array.from(map.entries()).map(([date, views]) => ({ date, views })));
        setLoading(false);
      });
  }, [listingId, user]);

  return { totalViews, daily, loading };
};

export const useAggregateStats = (userId: string | undefined) => {
  const [data, setData] = useState<{ views: number; favorites: number; messages: number; offers: number }>({
    views: 0, favorites: 0, messages: 0, offers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    (async () => {
      const { data: listings } = await supabase.from('listings').select('id').eq('user_id', userId);
      const ids = (listings || []).map((l: { id: string }) => l.id);
      if (ids.length === 0) {
        setData({ views: 0, favorites: 0, messages: 0, offers: 0 });
        setLoading(false);
        return;
      }
      const [views, favs, convs, offs] = await Promise.all([
        supabase.from('listing_views').select('id', { count: 'exact', head: true }).in('listing_id', ids),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).in('listing_id', ids),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('seller_id', userId),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('seller_id', userId),
      ]);
      setData({
        views: views.count || 0,
        favorites: favs.count || 0,
        messages: convs.count || 0,
        offers: offs.count || 0,
      });
      setLoading(false);
    })();
  }, [userId]);

  return { data, loading };
};