import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFollow = (sellerId: string | undefined) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!sellerId) return;
    const [c, f] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', sellerId),
      user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', sellerId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setCount(c.count || 0);
    setFollowing(!!f.data);
    setLoading(false);
  }, [sellerId, user]);

  useEffect(() => { refetch(); }, [refetch]);

  const toggle = async () => {
    if (!user || !sellerId || user.id === sellerId) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', sellerId);
      setFollowing(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: sellerId });
      setFollowing(true);
      setCount((c) => c + 1);
    }
  };

  return { following, count, loading, toggle };
};

export const useFollowing = () => {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setFollowingIds([]); setLoading(false); return; }
    supabase.from('follows').select('following_id').eq('follower_id', user.id)
      .then(({ data }) => {
        setFollowingIds((data || []).map((d: { following_id: string }) => d.following_id));
        setLoading(false);
      });
  }, [user]);

  return { followingIds, loading };
};