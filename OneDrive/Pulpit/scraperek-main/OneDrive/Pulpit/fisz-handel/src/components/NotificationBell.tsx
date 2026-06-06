import { Bell, MessageCircle, Heart, Reply, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

const iconFor = (type: Notification['type']) => {
  switch (type) {
    case 'message': return <MessageCircle className="h-4 w-4 text-primary" />;
    case 'reply': return <Reply className="h-4 w-4 text-primary" />;
    case 'favorite': return <Heart className="h-4 w-4 text-destructive fill-destructive" />;
  }
};

const NotificationBell = () => {
  const { items, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.type === 'favorite' && n.listing_id) navigate(`/product/${n.listing_id}`);
    else if (n.conversation_id) navigate(`/chat/${n.conversation_id}`);
    else navigate('/messages');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
          aria-label="Powiadomienia"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden border-border/60">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h3 className="font-semibold text-sm">Powiadomienia</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
              <Check className="h-3 w-3" /> Oznacz wszystkie
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Ładowanie…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Brak powiadomień</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {items.map((n) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`px-4 py-3 cursor-pointer hover:bg-accent/60 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {iconFor(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {n.title}
                        {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </p>
                      {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pl })}
                      </p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;