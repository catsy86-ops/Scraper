import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setFavIds(new Set()); return; }
    setLoading(true);
    supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setFavIds(new Set((data || []).map((f) => f.listing_id)));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    const isFav = favIds.has(listingId);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
      setFavIds((prev) => { const s = new Set(prev); s.delete(listingId); return s; });
      return false;
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
      setFavIds((prev) => new Set(prev).add(listingId));
      return true;
    }
  }, [user, favIds]);

  const isFav = useCallback((listingId: string) => favIds.has(listingId), [favIds]);

  return { isFav, toggle, loading };
};
