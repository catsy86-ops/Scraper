import { motion } from 'framer-motion';
import { Bookmark, Bell, BellOff, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useSavedSearches, deleteSavedSearch, toggleSavedSearchAlerts } from '@/hooks/useSavedSearches';
import { useToast } from '@/hooks/use-toast';

const SavedSearchesList = () => {
  const { searches, loading, refetch } = useSavedSearches();
  const { toast } = useToast();

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Brak zapisanych wyszukiwań</p>
        <Link to="/"><Button variant="outline" className="mt-4 rounded-xl">Przeglądaj oferty</Button></Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {searches.map((s, i) => {
        const params = new URLSearchParams();
        if (s.query) params.set('q', s.query);
        if (s.category) params.set('category', s.category);
        const url = `/?${params.toString()}`;

        return (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 hover-lift">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link to={url} className="font-semibold text-sm hover:text-primary flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-primary" /> {s.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.category && <Badge variant="secondary" className="text-[10px]">{s.category}</Badge>}
                    {s.location && <Badge variant="secondary" className="text-[10px]">📍 {s.location}</Badge>}
                    {(s.min_price != null || s.max_price != null) && (
                      <Badge variant="secondary" className="text-[10px]">💰 {s.min_price ?? 0}–{s.max_price ?? '∞'}</Badge>
                    )}
                    {s.condition && <Badge variant="secondary" className="text-[10px]">{s.condition}</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8"
                    onClick={async () => {
                      await toggleSavedSearchAlerts(s.id, !s.alerts_enabled);
                      toast({ title: s.alerts_enabled ? 'Alerty wyłączone' : 'Alerty włączone' });
                      refetch();
                    }}
                    title={s.alerts_enabled ? 'Wyłącz alerty' : 'Włącz alerty'}
                  >
                    {s.alerts_enabled
                      ? <Bell className="h-4 w-4 text-primary" />
                      : <BellOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={async () => { await deleteSavedSearch(s.id); refetch(); toast({ title: 'Usunięto' }); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SavedSearchesList;