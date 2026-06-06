import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Eye, FileSpreadsheet, FileText, Heart, MessageCircle, Tag, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAggregateStats } from '@/hooks/useListingStats';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildStatsExport, exportStatsCSV, exportStatsPDF } from '@/lib/exportStats';
import { toast } from 'sonner';

interface DailyPoint { date: string; views: number }

const StatsChart = ({ userId }: { userId: string }) => {
  const { data, loading } = useAggregateStats(userId);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: listings } = await supabase.from('listings').select('id').eq('user_id', userId);
      const ids = (listings || []).map((l: { id: string }) => l.id);
      if (!ids.length) { setLoadingChart(false); return; }
      const since = new Date(Date.now() - 14 * 86400000).toISOString();
      const { data: views } = await supabase.from('listing_views').select('created_at').in('listing_id', ids).gte('created_at', since);
      const map = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const k = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        map.set(k, 0);
      }
      (views || []).forEach((v: { created_at: string }) => {
        const k = v.created_at.slice(0, 10);
        if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
      });
      setDaily(Array.from(map.entries()).map(([date, v]) => ({ date, views: v })));
      setLoadingChart(false);
    })();
  }, [userId]);

  const maxViews = Math.max(...daily.map((d) => d.views), 1);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const payload = await buildStatsExport(userId);
      if (format === 'csv') exportStatsCSV(payload); else exportStatsPDF(payload);
      toast.success(`Raport ${format.toUpperCase()} wygenerowany`);
    } catch (e) {
      toast.error('Nie udało się wygenerować raportu');
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const stats = [
    { icon: Eye, label: 'Wyświetlenia', value: data.views, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { icon: Heart, label: 'Polubienia', value: data.favorites, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { icon: MessageCircle, label: 'Wiadomości', value: data.messages, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Tag, label: 'Oferty', value: data.offers, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-4 mb-8">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" disabled={exporting || loading}>
              <Download className="h-4 w-4" />
              {exporting ? 'Generuję…' : 'Eksportuj raport'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 hover-lift">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {loading ? <Skeleton className="h-6 w-12 mt-1" /> : <p className="text-xl font-bold">{value}</p>}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Wyświetlenia w ciągu 14 dni</h3>
        </div>
        {loadingChart ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="flex items-end gap-1 h-32">
            {daily.map((d, i) => (
              <motion.div
                key={d.date}
                initial={{ height: 0 }}
                animate={{ height: `${(d.views / maxViews) * 100}%` }}
                transition={{ delay: i * 0.03, duration: 0.4, ease: 'easeOut' }}
                className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-t-md min-h-[4px] relative group"
                title={`${d.date}: ${d.views} wyświetleń`}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  {d.views}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StatsChart;