import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X, ArrowLeft, MapPin, Sparkles, TrendingUp, Loader2, ChevronDown, Info, Minus, Plus, RotateCcw, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Card } from '@/components/ui/card';
import PriceDistributionChart from '@/components/PriceDistributionChart';
import { useValuationHistory, type ValuationHistoryEntry } from '@/hooks/useValuationHistory';

const conditions = [
  { value: 'nowy', label: 'Nowy' },
  { value: 'jak nowy', label: 'Jak nowy' },
  { value: 'dobry', label: 'Dobry' },
  { value: 'używany', label: 'Używany' },
] as const;

const MAX_IMAGES = 6;

const AddListing = () => {
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
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [showComparables, setShowComparables] = useState(false);
  const [showAIDetails, setShowAIDetails] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<string>('');
  const [adjustPct, setAdjustPct] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const { entries: history, add: addHistory, remove: removeHistory, clear: clearHistory } = useValuationHistory();
  type Suggestion = {
    suggested: number;
    min: number;
    max: number;
    reasoning: string;
    sampleSize: number;
    source: 'ai' | 'statistics';
    comparables?: Array<{ title: string; price: number; condition: string; location: string | null }>;
    details?: string | null;
    appliedConditionFilter?: string | null;
    requestedConditionFilter?: string | null;
    overallStats?: { suggested: number; min: number; max: number; sampleSize: number } | null;
    byCondition?: Record<string, { stats: { suggested: number; min: number; max: number; sampleSize: number } | null; count: number }>;
    prices?: number[];
    quartiles?: { min: number; q1: number; median: number; q3: number; max: number } | null;
  };
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const fetchSuggestion = async (override?: { conditionFilter?: string }) => {
    if (!title.trim() || title.trim().length < 3) {
      toast({ title: 'Wpisz tytuł', description: 'Potrzebujemy min. 3 znaków, by oszacować cenę.', variant: 'destructive' });
      return;
    }
    if (!category) {
      toast({ title: 'Wybierz kategorię', description: 'Sugestia działa lepiej z wybraną kategorią.', variant: 'destructive' });
      return;
    }
    const useFilter = override?.conditionFilter !== undefined ? override.conditionFilter : (conditionFilter || condition);
    setSuggesting(true);
    setShowComparables(false);
    setAdjustPct(0);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-price', {
        body: {
          title: title.trim(),
          category,
          condition,
          description: description.trim(),
          conditionFilter: useFilter || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestion(data);
      if (override?.conditionFilter !== undefined) setConditionFilter(override.conditionFilter);
      addHistory({
        title: title.trim(),
        category,
        condition,
        conditionFilter: useFilter || '',
        appliedConditionFilter: data.appliedConditionFilter ?? null,
        adjustPct: 0,
        suggested: data.suggested,
        min: data.min,
        max: data.max,
        sampleSize: data.sampleSize ?? 0,
        source: data.source ?? 'statistics',
        suggestion: data,
      });
    } catch (e: any) {
      toast({
        title: 'Nie udało się oszacować ceny',
        description: e?.message || 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
    } finally {
      setSuggesting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    const newImages = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Zaloguj się',
        description: 'Musisz być zalogowany, aby dodać ogłoszenie.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!title.trim() || !price || !category || !condition || !location.trim()) {
      toast({
        title: 'Uzupełnij wymagane pola',
        description: 'Tytuł, cena, kategoria, stan i lokalizacja są wymagane.',
        variant: 'destructive',
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: 'Dodaj zdjęcia',
        description: 'Musisz dodać co najmniej jedno zdjęcie.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload images to storage
      const imageUrls: string[] = [];
      for (const img of images) {
        const fileExt = img.file.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(filePath, img.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      // Insert listing
      const { error: insertError } = await supabase.from('listings').insert({
        user_id: user.id,
        title: title.trim(),
        price: parseFloat(price),
        category,
        condition,
        location: location.trim(),
        description: description.trim() || null,
        images: imageUrls,
      });

      if (insertError) throw insertError;

      toast({
        title: 'Ogłoszenie dodane! 🎉',
        description: 'Twoje ogłoszenie zostało pomyślnie opublikowane.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się dodać ogłoszenia.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
          Dodaj ogłoszenie
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
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">Tytuł *</Label>
            <Input
              id="title"
              placeholder="np. iPhone 13 Pro 256GB Grafitowy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="price" className="text-base font-semibold">Cena (zł) *</Label>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory((v) => !v)}
                    className="h-8 gap-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-xs font-medium"
                    aria-expanded={showHistory}
                  >
                    <History className="h-3.5 w-3.5" />
                    Historia
                    <span className="text-[10px] bg-muted px-1 rounded">{history.length}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchSuggestion()}
                  disabled={suggesting}
                  className="h-8 gap-1.5 text-primary hover:bg-primary/10 rounded-lg text-xs font-medium"
                >
                  {suggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {suggesting ? 'Analizuję…' : 'Zaproponuj cenę AI'}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showHistory && history.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/40">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Ostatnie wyceny ({history.length})
                      </p>
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Wyczyść
                      </button>
                    </div>
                    <ul className="divide-y divide-border/60 max-h-64 overflow-y-auto">
                      {history.map((h: ValuationHistoryEntry) => {
                        const ago = Math.max(1, Math.round((Date.now() - h.createdAt) / 60000));
                        const agoLabel = ago < 60 ? `${ago} min temu` : `${Math.round(ago / 60)} h temu`;
                        return (
                          <li key={h.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
                            <button
                              type="button"
                              onClick={() => {
                                setSuggestion(h.suggestion as Suggestion);
                                setConditionFilter(h.conditionFilter);
                                setAdjustPct(h.adjustPct);
                                setShowHistory(false);
                              }}
                              className="flex-1 min-w-0 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-foreground truncate flex-1">{h.title}</p>
                                <span className="text-xs font-bold font-['Space_Grotesk'] text-primary whitespace-nowrap">
                                  {h.suggested} zł
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-muted-foreground">
                                  {h.min}–{h.max} zł
                                </span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  {h.appliedConditionFilter || h.conditionFilter || 'wszystkie stany'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground">{h.category}</span>
                                <span className="text-[10px] text-muted-foreground ml-auto">{agoLabel}</span>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeHistory(h.id);
                              }}
                              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              aria-label="Usuń wpis"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              id="price"
              type="number"
              placeholder="0"
              min={0}
              max={999999}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 font-['Space_Grotesk'] text-lg font-bold"
            />

            <AnimatePresence>
              {suggestion && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4 mt-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />
                    <div className="flex items-start gap-3 relative">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/30">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Sugerowana cena {suggestion.source === 'ai' ? '(AI)' : '(statystyki)'}
                          </p>
                          {suggestion.sampleSize > 0 && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {suggestion.sampleSize} podobnych
                            </span>
                          )}
                        </div>
                        {(() => {
                          const factor = 1 + adjustPct / 100;
                          const adjSuggested = Math.round(suggestion.suggested * factor);
                          const adjMin = Math.round(suggestion.min * factor);
                          const adjMax = Math.round(suggestion.max * factor);
                          return (
                            <>
                              <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                                <span className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">
                                  {adjSuggested} zł
                                </span>
                                {adjustPct !== 0 && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    adjustPct > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {adjustPct > 0 ? '+' : ''}{adjustPct}%
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  zakres: {adjMin}–{adjMax} zł
                                </span>
                              </div>

                              {/* Quick % adjusters */}
                              <div className="flex items-center gap-1 mt-2 flex-wrap">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-0.5">
                                  Korekta
                                </span>
                                {[-10, -5].map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => setAdjustPct((p) => Math.max(-90, p + d))}
                                    className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-full border border-border bg-background hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                  >
                                    <Minus className="h-3 w-3" />{Math.abs(d)}%
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setAdjustPct(0)}
                                  disabled={adjustPct === 0}
                                  className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-full border border-border bg-background hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  aria-label="Resetuj korektę"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                                {[5, 10].map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => setAdjustPct((p) => Math.min(500, p + d))}
                                    className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-full border border-border bg-background hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />{d}%
                                  </button>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {suggestion.reasoning}
                        </p>

                        {/* AI valuation details (expandable) */}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setShowAIDetails((v) => !v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Info className="h-3 w-3" />
                            Szczegóły wyceny AI
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${showAIDetails ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <AnimatePresence>
                            {showAIDetails && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 rounded-lg border border-border/60 bg-background/50 p-3 space-y-2.5">
                                  {suggestion.details ? (
                                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                                      {suggestion.details}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">
                                      Brak rozszerzonego uzasadnienia AI — wycena oparta na statystykach.
                                    </p>
                                  )}

                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                      Sygnały użyte do wyceny
                                    </p>
                                    <ul className="space-y-1 text-xs">
                                      {suggestion.quartiles && (
                                        <>
                                          <li className="flex justify-between gap-2">
                                            <span className="text-muted-foreground">Mediana podobnych ofert</span>
                                            <span className="font-bold font-['Space_Grotesk'] text-foreground">{suggestion.quartiles.median} zł</span>
                                          </li>
                                          <li className="flex justify-between gap-2">
                                            <span className="text-muted-foreground">Q1 – Q3 (środkowe 50%)</span>
                                            <span className="font-medium text-foreground">{suggestion.quartiles.q1} – {suggestion.quartiles.q3} zł</span>
                                          </li>
                                          <li className="flex justify-between gap-2">
                                            <span className="text-muted-foreground">Pełny zakres</span>
                                            <span className="font-medium text-foreground">{suggestion.quartiles.min} – {suggestion.quartiles.max} zł</span>
                                          </li>
                                        </>
                                      )}
                                      <li className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Liczba ofert w próbce</span>
                                        <span className="font-medium text-foreground">{suggestion.sampleSize}</span>
                                      </li>
                                      <li className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Filtr stanu</span>
                                        <span className="font-medium text-foreground capitalize">
                                          {suggestion.appliedConditionFilter
                                            ? suggestion.appliedConditionFilter
                                            : suggestion.requestedConditionFilter
                                              ? `${suggestion.requestedConditionFilter} → wszystkie (za mało próbek)`
                                              : 'wszystkie stany'}
                                        </span>
                                      </li>
                                      <li className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">Źródło wyceny</span>
                                        <span className="font-medium text-foreground">
                                          {suggestion.source === 'ai' ? 'Model AI + statystyki' : 'Tylko statystyki'}
                                        </span>
                                      </li>
                                    </ul>
                                  </div>

                                  {suggestion.comparables && suggestion.comparables.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                        Najbardziej podobne tytuły ({Math.min(5, suggestion.comparables.length)})
                                      </p>
                                      <ul className="space-y-1">
                                        {suggestion.comparables.slice(0, 5).map((c, idx) => (
                                          <li key={idx} className="flex items-center justify-between gap-2 text-xs">
                                            <span className="truncate text-foreground">{c.title}</span>
                                            <span className="whitespace-nowrap font-bold font-['Space_Grotesk'] text-primary">
                                              {Math.round(c.price)} zł
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Condition filter chips */}
                        {suggestion.byCondition && (
                          <div className="mt-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Wycena dla stanu
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(['', ...conditions.map((c) => c.value)] as string[]).map((c) => {
                                const meta = c ? suggestion.byCondition?.[c] : null;
                                const count = c ? meta?.count ?? 0 : (suggestion.overallStats?.sampleSize ?? 0);
                                const isActive = (suggestion.appliedConditionFilter || '') === c
                                  || (!suggestion.appliedConditionFilter && c === '');
                                const disabled = suggesting || (c !== '' && count < 3);
                                const label = c ? c : 'Wszystkie';
                                return (
                                  <button
                                    key={c || 'all'}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => fetchSuggestion({ conditionFilter: c })}
                                    className={`text-[11px] font-medium px-2 py-1 rounded-full border transition-colors capitalize disabled:opacity-40 disabled:cursor-not-allowed ${
                                      isActive
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background border-border hover:border-primary/50 hover:text-primary'
                                    }`}
                                  >
                                    {label}
                                    {count > 0 && (
                                      <span className={`ml-1 ${isActive ? 'opacity-90' : 'text-muted-foreground'}`}>
                                        · {count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            {suggestion.requestedConditionFilter && !suggestion.appliedConditionFilter && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">
                                Za mało ofert w stanie „{suggestion.requestedConditionFilter}" — pokazujemy wycenę ze wszystkich stanów.
                              </p>
                            )}

                            {/* Per-condition stats grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
                              {conditions.map((c) => {
                                const s = suggestion.byCondition?.[c.value]?.stats;
                                if (!s) return null;
                                return (
                                  <div key={c.value} className="rounded-md border border-border/50 bg-background/40 px-2 py-1.5">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground capitalize">{c.value}</p>
                                    <p className="text-xs font-bold font-['Space_Grotesk'] text-foreground">{s.suggested} zł</p>
                                    <p className="text-[10px] text-muted-foreground">{s.min}–{s.max} zł · {s.sampleSize}</p>
                                  </div>
                                );
                              })}
                            </div>

                            {suggestion.prices && suggestion.quartiles && suggestion.prices.length >= 2 && (
                              <div className="mt-2">
                                <PriceDistributionChart
                                  prices={suggestion.prices}
                                  quartiles={suggestion.quartiles}
                                  suggested={Math.round(suggestion.suggested * (1 + adjustPct / 100))}
                                  conditionLabel={suggestion.appliedConditionFilter || 'wszystkie stany'}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {suggestion.comparables && suggestion.comparables.length > 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => setShowComparables((v) => !v)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {showComparables ? 'Ukryj' : 'Pokaż'} podobne ogłoszenia ({suggestion.comparables.length})
                            </button>
                            <AnimatePresence>
                              {showComparables && (
                                <motion.ul
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-2 divide-y divide-border/60 rounded-lg border border-border/60 bg-background/40 overflow-hidden"
                                >
                                  {suggestion.comparables.map((c, idx) => (
                                    <li key={idx} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-foreground truncate">{c.title}</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">
                                          {c.condition}{c.location ? ` • ${c.location}` : ''}
                                        </p>
                                      </div>
                                      <span className="text-xs font-bold font-['Space_Grotesk'] text-primary whitespace-nowrap">
                                        {Math.round(c.price)} zł
                                      </span>
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 text-xs rounded-lg"
                            onClick={() => setPrice(String(Math.round(suggestion.suggested * (1 + adjustPct / 100))))}
                          >
                            Użyj {Math.round(suggestion.suggested * (1 + adjustPct / 100))} zł
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs rounded-lg"
                            onClick={() => setSuggestion(null)}
                          >
                            Ukryj
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Kategoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Stan *</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Wybierz stan" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">Lokalizacja *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="np. Warszawa"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={50}
                className="h-11 pl-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">Opis</Label>
            <Textarea
              id="description"
              placeholder="Opisz przedmiot — stan, szczegóły, co jest w zestawie..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={() => navigate(-1)}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 rounded-xl text-base font-semibold"
            >
              {submitting ? 'Publikowanie...' : 'Opublikuj ogłoszenie'}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AddListing;
