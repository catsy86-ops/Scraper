import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Megaphone, Package, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { getWisdomForNotification } from "@/lib/fiszWisdoms";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const typeIcon: Record<string, typeof Megaphone> = {
  promo: Megaphone,
  order: Package,
  review: Star,
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };

    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
          const wisdom = getWisdomForNotification(n.title, n.message, n.type);
          if (wisdom) {
            toast(n.title, { description: `🐟 Mądrość Fisza: ${wisdom}`, duration: 7000 });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl bg-beer-foam/[0.04] hover:bg-beer-foam/[0.08] border border-beer-foam/[0.06] hover:border-beer-gold/20 transition-all duration-300 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="h-4 w-4 text-beer-foam/50 group-hover:text-beer-gold transition-colors" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-accent text-accent-foreground border-2 border-beer-dark font-bold shadow-[0_0_10px_hsl(var(--accent)/0.5)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-2xl bg-beer-dark/98 backdrop-blur-2xl border border-beer-gold/15 shadow-[0_20px_60px_-10px_hsl(var(--beer-dark)/0.8)] z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-beer-gold/10">
              <h3 className="text-sm font-display font-bold text-beer-foam">Powiadomienia</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-beer-gold/70 hover:text-beer-gold font-body font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-beer-gold/10"
                  >
                    Oznacz wszystkie
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-beer-foam/[0.06] transition-colors">
                  <X className="h-3.5 w-3.5 text-beer-foam/40" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-72 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="h-8 w-8 text-beer-foam/15 mx-auto mb-2" />
                  <p className="text-sm text-beer-foam/30 font-body">Brak powiadomień</p>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const Icon = typeIcon[n.type] || Megaphone;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`group/item relative flex gap-3 px-4 py-3 border-b border-beer-foam/[0.03] hover:bg-beer-foam/[0.03] transition-colors cursor-pointer ${
                        !n.is_read ? "bg-beer-gold/[0.03]" : ""
                      }`}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                    >
                      <div className={`shrink-0 mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center ${
                        !n.is_read ? "bg-beer-gold/15 text-beer-gold" : "bg-beer-foam/[0.05] text-beer-foam/30"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-display font-bold leading-tight ${!n.is_read ? "text-beer-foam" : "text-beer-foam/60"}`}>
                            {n.title}
                          </p>
                          {!n.is_read && <div className="shrink-0 h-2 w-2 rounded-full bg-beer-gold mt-1" />}
                        </div>
                        <p className="text-[11px] text-beer-foam/40 font-body mt-0.5 line-clamp-2">{n.message}</p>
                        {(() => {
                          const w = getWisdomForNotification(n.title, n.message, n.type, n.id);
                          return w ? (
                            <p className="text-[11px] text-beer-gold/80 font-body italic mt-1.5 leading-snug border-l-2 border-beer-gold/30 pl-2">
                              🐟 {w}
                            </p>
                          ) : null;
                        })()}
                        <p className="text-[10px] text-beer-foam/20 font-body mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pl })}
                        </p>
                      </div>
                      <div className="absolute right-2 top-2 hidden group-hover/item:flex gap-1">
                        {!n.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                            className="p-1 rounded-lg bg-beer-foam/[0.06] hover:bg-beer-gold/20 transition-colors"
                          >
                            <Check className="h-3 w-3 text-beer-gold" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          className="p-1 rounded-lg bg-beer-foam/[0.06] hover:bg-accent/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-accent" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
