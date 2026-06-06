import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HistoryItem {
  listingId: string;
  lastViewedAt: string;
  viewCount: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  image: string | null;
  isActive: boolean;
}

export const useViewHistory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: views } = await supabase
      .from('listing_views')
      .select('listing_id, created_at')
      .eq('viewer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);

    const rows = views || [];
    if (rows.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Deduplicate by listing_id, keep most recent timestamp + count
    const map = new Map<string, { lastViewedAt: string; viewCount: number }>();
    for (const r of rows as { listing_id: string; created_at: string }[]) {
      const cur = map.get(r.listing_id);
      if (cur) {
        cur.viewCount += 1;
      } else {
        map.set(r.listing_id, { lastViewedAt: r.created_at, viewCount: 1 });
      }
    }

    const ids = Array.from(map.keys());
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, price, category, condition, location, images, is_active')
      .in('id', ids);

    const byId = new Map((listings || []).map((l: any) => [l.id, l]));
    const merged: HistoryItem[] = ids
      .map((id) => {
        const meta = map.get(id)!;
        const l: any = byId.get(id);
        if (!l) return null;
        return {
          listingId: id,
          lastViewedAt: meta.lastViewedAt,
          viewCount: meta.viewCount,
          title: l.title,
          price: Number(l.price),
          category: l.category,
          condition: l.condition,
          location: l.location,
          image: Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null,
          isActive: !!l.is_active,
        } as HistoryItem;
      })
      .filter(Boolean) as HistoryItem[];

    setItems(merged);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const clearAll = async () => {
    if (!user) return;
    await supabase.from('listing_views').delete().eq('viewer_id', user.id);
    setItems([]);
  };

  const removeOne = async (listingId: string) => {
    if (!user) return;
    await supabase.from('listing_views').delete().eq('viewer_id', user.id).eq('listing_id', listingId);
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  };

  return { items, loading, reload: load, clearAll, removeOne };
};