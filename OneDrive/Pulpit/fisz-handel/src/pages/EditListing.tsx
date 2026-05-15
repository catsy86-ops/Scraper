import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, X, ArrowLeft, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/data/mockProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const conditions = [
  { value: 'nowy', label: 'Nowy' },
  { value: 'jak nowy', label: 'Jak nowy' },
  { value: 'dobry', label: 'Dobry' },
  { value: 'używany', label: 'Używany' },
] as const;

const MAX_IMAGES = 6;

type ImageItem = { type: 'existing'; url: string } | { type: 'new'; file: File; preview: string };

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchListing();
  }, [user, id]);

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id!)
      .single();

    if (error || !data) {
      toast({ title: 'Nie znaleziono ogłoszenia', variant: 'destructive' });
      navigate('/profile');
      return;
    }

    if (data.user_id !== user!.id) {
      toast({ title: 'Brak uprawnień', variant: 'destructive' });
      navigate('/profile');
      return;
    }

    setTitle(data.title);
    setPrice(String(data.price));
    setCategory(data.category);
    setCondition(data.condition);
    setLocation(data.location || '');
    setDescription(data.description || '');
    setImages((data.images || []).map((url: string) => ({ type: 'existing' as const, url })));
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);
    const newImages: ImageItem[] = toAdd.map((file) => ({
      type: 'new',
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const img = prev[index];
      if (img.type === 'new') URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const getPreview = (img: ImageItem) => img.type === 'existing' ? img.url : img.preview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !price || !category || !condition || !location.trim()) {
      toast({ title: 'Uzupełnij wymagane pola', variant: 'destructive' });
      return;
    }

    if (images.length === 0) {
      toast({ title: 'Dodaj co najmniej jedno zdjęcie', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      const imageUrls: string[] = [];

      for (const img of images) {
        if (img.type === 'existing') {
          imageUrls.push(img.url);
        } else {
          const fileExt = img.file.name.split('.').pop();
          const filePath = `${user!.id}/${crypto.randomUUID()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('listings').upload(filePath, img.file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(filePath);
          imageUrls.push(publicUrl);
        }
      }

      const { error } = await supabase
        .from('listings')
        .update({
          title: title.trim(),
          price: parseFloat(price),
          category,
          condition,
          location: location.trim(),
          description: description.trim() || null,
          images: imageUrls,
        })
        .eq('id', id!);

      if (error) throw error;

      toast({ title: 'Ogłoszenie zaktualizowane! ✅' });
      navigate('/profile');
    } catch (error: any) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex-1 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Wróć</span>
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-['Space_Grotesk'] mb-6">
          Edytuj ogłoszenie
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Zdjęcia <span className="text-muted-foreground font-normal text-sm">({images.length}/{MAX_IMAGES})</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-secondary">
                  <img src={getPreview(img)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      Główne
                    </span>
                  )}
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/50 flex flex-col items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:text-primary"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-medium">Dodaj</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">Tytuł *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="h-11" />
            <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-base font-semibold">Cena (zł) *</Label>
            <Input id="price" type="number" min={0} max={999999} value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 font-['Space_Grotesk'] text-lg font-bold" />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Kategoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Wybierz kategorię" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">Stan *</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Wybierz stan" /></SelectTrigger>
                <SelectContent>
                  {conditions.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">Lokalizacja *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={50} className="h-11 pl-10" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">Opis</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={5} className="resize-none" />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => navigate(-1)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-xl text-base font-semibold">
              {submitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default EditListing;
