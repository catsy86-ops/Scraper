import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, Heart, MessageSquare, Eye, TrendingUp, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  activeListings: number;
  totalListings: number;
  promotedListings: number;
  favoritesReceived: number;
  totalConversations: number;
  unreadMessages: number;
}

const StatCard = ({ icon: Icon, label, value, accent, delay }: {
  icon: typeof Package;
  label: string;
  value: number;
  accent: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
  >
    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 ${accent}`} />
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${accent} bg-opacity-10`}>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </motion.div>
);

const ProfileDashboard = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    totalListings: 0,
    promotedListings: 0,
    favoritesReceived: 0,
    totalConversations: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [listingsRes, favsRes, convsRes, unreadRes] = await Promise.all([
        supabase.from('listings').select('id, is_active, is_promoted').eq('user_id', userId),
        supabase.from('favorites').select('id, listing:listings!inner(user_id)').eq('listings.user_id', userId),
        supabase.from('conversations').select('id').or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
        supabase.from('messages').select('id, conversation_id, conversations:conversations!inner(buyer_id, seller_id)')
          .eq('is_read', false)
          .neq('sender_id', userId)
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`, { referencedTable: 'conversations' }),
      ]);

      const listings = listingsRes.data || [];
      setStats({
        totalListings: listings.length,
        activeListings: listings.filter(l => l.is_active).length,
        promotedListings: listings.filter(l => l.is_promoted).length,
        favoritesReceived: favsRes.data?.length || 0,
        totalConversations: convsRes.data?.length || 0,
        unreadMessages: unreadRes.data?.length || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    { icon: Package, label: 'Aktywne ogłoszenia', value: stats.activeListings, accent: 'bg-primary' },
    { icon: TrendingUp, label: 'Łącznie ogłoszeń', value: stats.totalListings, accent: 'bg-secondary' },
    { icon: Star, label: 'Wyróżnione', value: stats.promotedListings, accent: 'bg-accent' },
    { icon: Heart, label: 'Polubienia ogłoszeń', value: stats.favoritesReceived, accent: 'bg-destructive' },
    { icon: MessageSquare, label: 'Konwersacje', value: stats.totalConversations, accent: 'bg-primary' },
    { icon: Eye, label: 'Nieprzeczytane', value: stats.unreadMessages, accent: 'bg-accent' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} delay={i * 0.05} />
      ))}
    </div>
  );
};

export default ProfileDashboard;
