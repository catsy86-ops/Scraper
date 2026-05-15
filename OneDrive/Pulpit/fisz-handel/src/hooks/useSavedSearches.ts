import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string | null;
  category: string | null;
  location: string | null;
  min_price: number | null;
  max_price: number | null;
  condition: string | null;
  alerts_enabled: boolean;
  last_checked_at: string;
  created_at: string;
}

export const useSavedSearches = () => {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setSearches([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setSearches((data as SavedSearch[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  return { searches, loading, refetch };
};

export const createSavedSearch = async (params: Omit<SavedSearch, 'id' | 'user_id' | 'last_checked_at' | 'created_at'> & { user_id: string }) => {
  return supabase.from('saved_searches').insert(params).select().single();
};

export const deleteSavedSearch = async (id: string) => {
  return supabase.from('saved_searches').delete().eq('id', id);
};

export const toggleSavedSearchAlerts = async (id: string, enabled: boolean) => {
  return supabase.from('saved_searches').update({ alerts_enabled: enabled }).eq('id', id);
};