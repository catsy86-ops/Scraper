import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const navigateTo = (url: string) => {
  window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export type Notification = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: 'message' | 'reply' | 'favorite' | 'offer' | 'offer_response' | 'new_listing_from_followed' | 'saved_search_match';
  title: string;
  body: string | null;
  listing_id: string | null;
  conversation_id: string | null;
  is_read: boolean;
  created_at: string;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setItems((data || []) as Notification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
    if (!user) return;

    const channel = supabase
      .channel('notifications-' + user.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev].slice(0, 30));
          const href = n.listing_id
            ? `/product/${n.listing_id}`
            : n.conversation_id
              ? `/chat/${n.conversation_id}`
              : null;
          const action = href
            ? { label: 'Zobacz', onClick: () => navigateTo(href) }
            : undefined;

          if (n.type === 'offer_response') {
            const lower = n.title.toLowerCase();
            const fn = lower.includes('zaakcept')
              ? toast.success
              : lower.includes('odrzu')
                ? toast.error
                : toast.info;
            fn(n.title, { description: n.body ?? undefined, action, duration: 8000 });
          } else {
            toast(n.title, { description: n.body ?? undefined, action });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => fetchAll()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchAll]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id).eq('is_read', false);
  };

  return { items, loading, unreadCount, markAsRead, markAllAsRead, refresh: fetchAll };
};