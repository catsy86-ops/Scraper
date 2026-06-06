import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createSavedSearch } from '@/hooks/useSavedSearches';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface SaveSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: {
    query: string;
    category: string | null;
    location: string | null;
    min_price: number | null;
    max_price: number | null;
    condition: string | null;
  };
}

const SaveSearchDialog = ({ open, onOpenChange, initial }: SaveSearchDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState(initial.query || initial.category || 'Moje wyszukiwanie');
  const [alerts, setAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!name.trim()) { toast({ title: 'Podaj nazwę', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await createSavedSearch({
      user_id: user.id,
      name: name.trim(),
      query: initial.query || null,
      category: initial.category,
      location: initial.location,
      min_price: initial.min_price,
      max_price: initial.max_price,
      condition: initial.condition,
      alerts_enabled: alerts,
    });
    setSaving(false);
    if (error) toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Zapisano wyszukiwanie 🔖' }); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" /> Zapisz wyszukiwanie
          </DialogTitle>
          <DialogDescription>
            Otrzymasz powiadomienie, gdy pojawi się nowe ogłoszenie pasujące do tych filtrów.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nazwa</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Rower MTB do 1000 zł" />
          </div>

          <div className="rounded-xl border border-border p-3 space-y-1.5 text-xs text-muted-foreground bg-secondary/30">
            {initial.query && <div>🔍 Fraza: <span className="text-foreground font-medium">{initial.query}</span></div>}
            {initial.category && <div>📁 Kategoria: <span className="text-foreground font-medium">{initial.category}</span></div>}
            {initial.location && <div>📍 Lokalizacja: <span className="text-foreground font-medium">{initial.location}</span></div>}
            {(initial.min_price != null || initial.max_price != null) && (
              <div>💰 Cena: <span className="text-foreground font-medium">{initial.min_price ?? 0} – {initial.max_price ?? '∞'} zł</span></div>
            )}
            {initial.condition && <div>✨ Stan: <span className="text-foreground font-medium">{initial.condition}</span></div>}
            {!initial.query && !initial.category && !initial.location && initial.min_price == null && initial.max_price == null && !initial.condition && (
              <div className="italic">Wszystkie ogłoszenia</div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
            <div>
              <p className="text-sm font-medium">Alerty o nowych ofertach</p>
              <p className="text-xs text-muted-foreground">Powiadomienia w aplikacji</p>
            </div>
            <Switch checked={alerts} onCheckedChange={setAlerts} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-primary">
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSearchDialog;