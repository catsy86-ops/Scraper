import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tag, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createOffer } from '@/hooks/useOffers';
import { useAuth } from '@/hooks/useAuth';

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  sellerId: string;
  listingTitle: string;
  listingPrice: number;
  onCreated?: () => void;
}

const OfferDialog = ({ open, onOpenChange, listingId, sellerId, listingTitle, listingPrice, onCreated }: OfferDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>(Math.round(listingPrice * 0.9).toString());
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const numAmount = Number(amount) || 0;
  const discount = numAmount > 0 ? Math.round(((listingPrice - numAmount) / listingPrice) * 100) : 0;

  const submit = async () => {
    if (!user) return;
    if (numAmount <= 0) {
      toast({ title: 'Nieprawidłowa kwota', description: 'Podaj kwotę większą od zera', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await createOffer({
      listingId, sellerId, buyerId: user.id, amount: numAmount, message: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Oferta wysłana 🎉', description: 'Sprzedawca otrzyma powiadomienie' });
      setMessage('');
      onOpenChange(false);
      onCreated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" /> Złóż ofertę cenową
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{listingTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-secondary/50 p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cena ogłoszenia</span>
            <span className="font-bold text-foreground">{listingPrice.toLocaleString('pl-PL')} zł</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Twoja oferta (zł)</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="np. 80" className="text-lg font-semibold h-12" />
            {discount > 0 && discount < 100 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> {discount}% poniżej ceny wywoławczej
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Wiadomość (opcjonalna)</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Cześć! Czy zgodzisz się na taką cenę?" rows={3} maxLength={300} />
            <p className="text-xs text-muted-foreground text-right">{message.length}/300</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Anuluj</Button>
          <Button onClick={submit} disabled={submitting} className="bg-gradient-primary">
            {submitting ? 'Wysyłanie...' : 'Wyślij ofertę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDialog;