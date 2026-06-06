import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';

export interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  status: OfferStatus;
  counter_amount: number | null;
  created_at: string;
  updated_at: string;
}

export const useOffers = (filter?: { listingId?: string; asSeller?: boolean; asBuyer?: boolean }) => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setOffers([]); setLoading(false); return; }
    setLoading(true);
    let q = supabase.from('offers').select('*').order('created_at', { ascending: false });
    if (filter?.listingId) q = q.eq('listing_id', filter.listingId);
    if (filter?.asSeller) q = q.eq('seller_id', user.id);
    if (filter?.asBuyer) q = q.eq('buyer_id', user.id);
    const { data } = await q;
    setOffers((data as Offer[]) || []);
    setLoading(false);
  }, [user, filter?.listingId, filter?.asSeller, filter?.asBuyer]);

  useEffect(() => { fetch(); }, [fetch]);

  return { offers, loading, refetch: fetch };
};

export const createOffer = async (params: {
  listingId: string; sellerId: string; buyerId: string; amount: number; message?: string;
}) => {
  return supabase.from('offers').insert({
    listing_id: params.listingId,
    seller_id: params.sellerId,
    buyer_id: params.buyerId,
    amount: params.amount,
    message: params.message || null,
  }).select().single();
};

export const updateOfferStatus = async (id: string, status: OfferStatus, counter_amount?: number) => {
  const update: Record<string, unknown> = { status };
  if (counter_amount != null) update.counter_amount = counter_amount;
  return supabase.from('offers').update(update).eq('id', id);
};