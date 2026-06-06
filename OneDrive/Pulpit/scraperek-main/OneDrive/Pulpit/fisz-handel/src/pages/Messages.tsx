import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ConversationItem {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  listing: { title: string; images: string[] | null; price: number } | null;
  other_profile: { display_name: string | null; avatar_url: string | null } | null;
  last_message: string | null;
  unread_count: number;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: convs } = await supabase
      .from('conversations')
      .select('id, listing_id, buyer_id, seller_id, updated_at, listings(title, images, price)')
      .order('updated_at', { ascending: false });

    if (!convs) { setLoading(false); return; }

    const items: ConversationItem[] = [];
    for (const c of convs) {
      const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;

      const [profileRes, msgRes, unreadRes] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', otherId).single(),
        supabase.from('messages').select('content').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', c.id).eq('is_read', false).neq('sender_id', user.id),
      ]);

      items.push({
        ...c,
        listing: (c as any).listings,
        other_profile: profileRes.data,
        last_message: msgRes.data?.content ?? null,
        unread_count: unreadRes.count ?? 0,
      });
    }

    setConversations(items);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 flex-1 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Wiadomości</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Brak wiadomości</p>
            <p className="text-sm text-muted-foreground mt-1">
              Napisz do sprzedawcy na stronie produktu, aby rozpocząć rozmowę.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow text-left"
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={conv.other_profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(conv.other_profile?.display_name || '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate">
                      {conv.other_profile?.display_name || 'Użytkownik'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: pl })}
                    </span>
                  </div>
                  <p className="text-xs text-primary truncate">{conv.listing?.title}</p>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conv.last_message || 'Brak wiadomości'}
                  </p>
                </div>

                {conv.unread_count > 0 && (
                  <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
