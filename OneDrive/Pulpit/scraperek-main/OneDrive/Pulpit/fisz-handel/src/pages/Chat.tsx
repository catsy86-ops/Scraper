import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ConvInfo {
  id: string;
  listing: { title: string; price: number; images: string[] | null } | null;
  other_profile: { display_name: string | null; avatar_url: string | null } | null;
  other_id: string;
}

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [convInfo, setConvInfo] = useState<ConvInfo | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    fetchConvInfo();
    fetchMessages();

    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user || !id || messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.is_read);
    if (unread.length > 0) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', id)
        .neq('sender_id', user.id)
        .eq('is_read', false)
        .then();
    }
  }, [messages, user, id]);

  const fetchConvInfo = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, listings(title, price, images)')
      .eq('id', id!)
      .single();

    if (!data || !user) return;
    const otherId = data.buyer_id === user.id ? data.seller_id : data.buyer_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', otherId)
      .single();

    setConvInfo({
      id: data.id,
      listing: (data as any).listings,
      other_profile: profile,
      other_id: otherId,
    });
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, is_read')
      .eq('conversation_id', id!)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id || sending) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
      // Update conversation timestamp
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);
    }
    setSending(false);
  };

  if (authLoading || !convInfo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const initials = (convInfo.other_profile?.display_name || '?').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="border-b bg-card sticky top-16 z-40">
        <div className="container mx-auto px-4 max-w-2xl flex items-center gap-3 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={convInfo.other_profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {convInfo.other_profile?.display_name || 'Użytkownik'}
            </p>
            <p className="text-xs text-primary truncate">
              {convInfo.listing?.title} — {convInfo.listing?.price?.toLocaleString('pl-PL')} zł
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 container mx-auto px-4 max-w-2xl py-4 overflow-y-auto">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Rozpocznij rozmowę — napisz wiadomość poniżej
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-foreground rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {format(new Date(msg.created_at), 'HH:mm', { locale: pl })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <div className="border-t bg-background sticky bottom-0">
        <form onSubmit={sendMessage} className="container mx-auto px-4 max-w-2xl flex gap-2 py-3">
          <Input
            placeholder="Napisz wiadomość..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
