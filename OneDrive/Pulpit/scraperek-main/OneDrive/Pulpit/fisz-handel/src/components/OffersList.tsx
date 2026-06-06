import { motion } from 'framer-motion';
import { Check, X, ArrowLeftRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useOffers, updateOfferStatus, type Offer } from '@/hooks/useOffers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Oczekująca', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  accepted: { label: 'Zaakceptowana', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Odrzucona', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  countered: { label: 'Kontroferta', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
  withdrawn: { label: 'Wycofana', className: 'bg-muted text-muted-foreground border-border' },
};

interface ListingMini { id: string; title: string; images: string[] | null; price: number }

const OfferCard = ({ offer, role, onChange }: { offer: Offer; role: 'buyer' | 'seller'; onChange: () => void }) => {
  const { toast } = useToast();
  const [listing, setListing] = useState<ListingMini | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('listings').select('id, title, images, price').eq('id', offer.listing_id).maybeSingle()
      .then(({ data }) => setListing(data as ListingMini | null));
  }, [offer.listing_id]);

  const act = async (status: 'accepted' | 'rejected' | 'countered' | 'withdrawn') => {
    setBusy(true);
    const { error } = await updateOfferStatus(offer.id, status);
    setBusy(false);
    if (error) toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Zaktualizowano' }); onChange(); }
  };

  const cfg = statusConfig[offer.status] || statusConfig.pending;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          <Link to={`/product/${offer.listing_id}`} className="flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden">
              {listing?.images?.[0] && <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/product/${offer.listing_id}`} className="font-medium text-sm line-clamp-1 hover:text-primary">
              {listing?.title || 'Ogłoszenie'}
            </Link>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-primary">{Number(offer.amount).toLocaleString('pl-PL')} zł</span>
              {listing && (
                <span className="text-xs text-muted-foreground line-through">{listing.price.toLocaleString('pl-PL')} zł</span>
              )}
            </div>
            {offer.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">„{offer.message}"</p>}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>{cfg.label}</Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {new Date(offer.created_at).toLocaleDateString('pl-PL')}
              </span>
            </div>
          </div>
        </div>

        {offer.status === 'pending' && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {role === 'seller' ? (
              <>
                <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={() => act('accepted')}>
                  <Check className="h-3.5 w-3.5" /> Akceptuj
                </Button>
                <Button size="sm" variant="outline" className="gap-1" disabled={busy} onClick={() => act('countered')}>
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Kontroferta
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 text-destructive" disabled={busy} onClick={() => act('rejected')}>
                  <X className="h-3.5 w-3.5" /> Odrzuć
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" disabled={busy} onClick={() => act('withdrawn')}>
                <X className="h-3.5 w-3.5" /> Wycofaj ofertę
              </Button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

const OffersList = ({ asSeller = false }: { asSeller?: boolean }) => {
  const { user } = useAuth();
  const { offers, loading, refetch } = useOffers(asSeller ? { asSeller: true } : { asBuyer: true });

  if (!user) return null;

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{asSeller ? 'Nie otrzymałeś jeszcze żadnych ofert' : 'Nie złożyłeś jeszcze żadnych ofert'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {offers.map((o) => <OfferCard key={o.id} offer={o} role={asSeller ? 'seller' : 'buyer'} onChange={refetch} />)}
    </div>
  );
};

export default OffersList;