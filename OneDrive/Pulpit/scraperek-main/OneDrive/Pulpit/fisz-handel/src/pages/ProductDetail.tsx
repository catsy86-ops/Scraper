import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, Calendar, MessageCircle, Share2, Shield, Star, Send, ChevronLeft, ChevronRight, Home, Eye, Tag } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import OfferDialog from '@/components/OfferDialog';
import FollowButton from '@/components/FollowButton';
import { trackListingView } from '@/hooks/useListingStats';

const conditionConfig: Record<string, { bg: string; icon: string }> = {
  'nowy': { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: '✨' },
  'jak nowy': { bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', icon: '💎' },
  'dobry': { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: '👍' },
  'używany': { bg: 'bg-muted text-muted-foreground border-border', icon: '🔧' },
};

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
  category: string;
  condition: string;
  location: string | null;
  description: string | null;
  user_id: string;
  created_at: string;
  is_promoted: boolean;
}

interface SellerProfile {
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Review {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: { display_name: string | null; avatar_url: string | null };
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [imgDirection, setImgDirection] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);

  useEffect(() => {
    if (id) fetchListing();
    window.scrollTo(0, 0);
  }, [id]);

  // Track view (debounced by id change)
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => { trackListingView(id, user?.id); }, 800);
    return () => clearTimeout(t);
  }, [id, user?.id]);

  const fetchListing = async () => {
    setLoading(true);
    const { data } = await supabase.from('listings').select('*').eq('id', id!).single();
    if (!data) { setLoading(false); return; }
    setListing(data);

    const [profileRes, reviewsRes, relatedRes] = await Promise.all([
      supabase.from('profiles').select('display_name, avatar_url, created_at').eq('user_id', data.user_id).single(),
      supabase.from('reviews').select('*').eq('seller_id', data.user_id).order('created_at', { ascending: false }),
      supabase.from('listings').select('*').eq('category', data.category).neq('id', data.id).eq('is_active', true).limit(6),
    ]);

    if (profileRes.data) setSeller(profileRes.data);
    if (relatedRes.data) setRelatedListings(relatedRes.data);

    if (reviewsRes.data && reviewsRes.data.length > 0) {
      const reviewerIds = [...new Set(reviewsRes.data.map(r => r.reviewer_id))];
      const { data: reviewerProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', reviewerIds);

      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      reviewerProfiles?.forEach(p => { profileMap[p.user_id] = p; });

      const enriched = reviewsRes.data.map(r => ({ ...r, reviewer: profileMap[r.reviewer_id] }));
      setReviews(enriched);
      setAvgRating(reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length);
    } else {
      setReviews([]);
      setAvgRating(0);
    }

    if (user) {
      const { data: favData } = await supabase
        .from('favorites').select('id').eq('user_id', user.id).eq('listing_id', data.id).maybeSingle();
      setIsFav(!!favData);
    }

    setLoading(false);
  };

  const gallery = listing?.images?.length ? listing.images : ['/placeholder.svg'];

  const navigateImg = useCallback((dir: number) => {
    setImgDirection(dir);
    setSelectedImg(prev => {
      const next = prev + dir;
      if (next < 0) return gallery.length - 1;
      if (next >= gallery.length) return 0;
      return next;
    });
  }, [gallery.length]);

  const toggleFavorite = async () => {
    if (!user) { navigate('/auth'); return; }
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listing!.id);
      setIsFav(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listing!.id });
      setIsFav(true);
    }
  };

  const handleContact = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!listing) return;
    const { data: existing } = await supabase
      .from('conversations').select('id').eq('listing_id', listing.id).eq('buyer_id', user.id).maybeSingle();
    if (existing) { navigate(`/messages/${existing.id}`); return; }
    const { data: conv, error } = await supabase
      .from('conversations').insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.user_id })
      .select('id').single();
    if (conv) navigate(`/messages/${conv.id}`);
    else toast({ title: 'Błąd', description: error?.message, variant: 'destructive' });
  };

  const submitReview = async () => {
    if (!user || !listing) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id, seller_id: listing.user_id, listing_id: listing.id,
      rating: reviewRating, comment: reviewComment.trim() || null,
    });
    if (error) {
      toast({ title: 'Błąd', description: error.message.includes('duplicate') ? 'Już oceniłeś ten produkt' : error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dziękujemy za opinię! ⭐' });
      setReviewComment('');
      fetchListing();
    }
    setSubmittingReview(false);
  };

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rev => rev.rating === r).length,
    pct: reviews.length ? (reviews.filter(rev => rev.rating === r).length / reviews.length) * 100 : 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-4 flex-1">
          {/* Breadcrumb skeleton */}
          <div className="flex gap-2 mb-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
            {/* Gallery skeleton */}
            <div className="lg:col-span-3 space-y-3">
              <Skeleton className="aspect-[4/3] rounded-2xl w-full" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-xl flex-shrink-0" />
                ))}
              </div>
            </div>
            {/* Sidebar skeleton */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-10 w-40" />
              <div className="flex gap-3">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              {/* Seller card skeleton */}
              <div className="border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              {/* Description skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <div className="text-6xl">🔍</div>
            <p className="text-2xl font-bold text-foreground">Nie znaleziono oferty</p>
            <p className="text-muted-foreground">Ta oferta mogła zostać usunięta lub jest nieaktywna</p>
            <Button onClick={() => navigate('/')} className="rounded-xl">Wróć do strony głównej</Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const condStyle = conditionConfig[listing.condition] || conditionConfig['używany'];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-4 flex-1">
        {/* Breadcrumbs */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5" />Strona główna</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/?category=${encodeURIComponent(listing.category)}`}>{listing.category}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate">{listing.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
          {/* Gallery with carousel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-3 space-y-3">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary/30 group">
              {listing.is_promoted && (
                <div className="absolute top-4 left-4 z-20">
                  <Badge className="bg-primary text-primary-foreground gap-1 px-3 py-1 text-xs font-bold shadow-lg">
                    <Star className="h-3 w-3 fill-current" /> Wyróżnione
                  </Badge>
                </div>
              )}

              <AnimatePresence mode="wait" custom={imgDirection}>
                <motion.img
                  key={selectedImg}
                  src={gallery[selectedImg]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  custom={imgDirection}
                  initial={{ opacity: 0, x: imgDirection * 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: imgDirection * -80 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              </AnimatePresence>

              {/* Navigation arrows */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImg(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button
                    onClick={() => navigateImg(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}

              {/* Favorite button */}
              <button
                onClick={toggleFavorite}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all hover:scale-110 shadow-lg"
              >
                <Heart className={`h-5 w-5 transition-all ${isFav ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>

              {/* Image counter */}
              {gallery.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-foreground shadow-lg flex items-center gap-1.5">
                  <Eye className="h-3 w-3" />
                  {selectedImg + 1} / {gallery.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {gallery.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setImgDirection(i > selectedImg ? 1 : -1); setSelectedImg(i); }}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 ${
                      selectedImg === i
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'opacity-60 hover:opacity-100 ring-1 ring-border'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="lg:col-span-2 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${condStyle.bg}`}>
                  {condStyle.icon} {listing.condition}
                </span>
                <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-['Space_Grotesk'] leading-tight">
                {listing.title}
              </h1>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-primary font-['Space_Grotesk']">
                  {listing.price.toLocaleString('pl-PL')} zł
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {listing.location && (
                <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full">
                  <MapPin className="h-3.5 w-3.5 text-primary" />{listing.location}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {new Date(listing.created_at).toLocaleDateString('pl-PL')}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5">
              {user?.id !== listing.user_id && (
                <>
                  <Button className="w-full h-12 text-base gap-2.5 rounded-xl font-semibold bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow transition-all" onClick={handleContact}>
                    <MessageCircle className="h-5 w-5" />
                    Napisz do sprzedawcy
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2 rounded-xl border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => { if (!user) { navigate('/auth'); return; } setOfferOpen(true); }}
                  >
                    <Tag className="h-4 w-4" />
                    Złóż ofertę cenową
                  </Button>
                </>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-10 rounded-xl gap-2 hover:bg-primary/5" onClick={toggleFavorite}>
                  <Heart className={`h-4 w-4 transition-all ${isFav ? 'fill-primary text-primary' : ''}`} />
                  {isFav ? 'W ulubionych' : 'Dodaj do ulubionych'}
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Seller card */}
            <div className="border border-border rounded-2xl p-5 space-y-3 bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                    <AvatarImage src={seller?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {(seller?.display_name || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-base">{seller?.display_name || 'Użytkownik'}</p>
                  <p className="text-xs text-muted-foreground">
                    Na platformie od {seller?.created_at ? new Date(seller.created_at).getFullYear() : '—'}
                  </p>
                </div>
                <FollowButton sellerId={listing.user_id} variant="compact" showCount />
              </div>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({reviews.length} opinii)</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Zweryfikowany sprzedawca</span>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  📝 Opis
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews Section - Enhanced */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-14"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Opinie o sprzedawcy</h2>
              <p className="text-sm text-muted-foreground">{reviews.length} {reviews.length === 1 ? 'opinia' : reviews.length < 5 ? 'opinie' : 'opinii'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rating summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-24">
                {reviews.length > 0 ? (
                  <>
                    <div className="text-center">
                      <p className="text-5xl font-extrabold text-foreground font-['Space_Grotesk']">{avgRating.toFixed(1)}</p>
                      <div className="flex justify-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-5 w-5 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">na podstawie {reviews.length} opinii</p>
                    </div>
                    <div className="space-y-2">
                      {ratingDistribution.map(({ rating, count, pct }) => (
                        <div key={rating} className="flex items-center gap-2 text-sm">
                          <span className="w-3 text-muted-foreground font-medium">{rating}</span>
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <Progress value={pct} className="flex-1 h-2" />
                          <span className="w-6 text-xs text-muted-foreground text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">🌟</div>
                    <p className="text-sm text-muted-foreground">Brak opinii — bądź pierwszy!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews list + form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Add review form */}
              {user && user.id !== listing.user_id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-5 space-y-4"
                >
                  <h3 className="font-semibold text-foreground flex items-center gap-2">✍️ Dodaj swoją opinię</h3>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => setReviewRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star className={`h-7 w-7 transition-all ${
                          s <= (hoverRating || reviewRating)
                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                            : 'text-border hover:text-yellow-300'
                        }`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground self-center">
                      {(hoverRating || reviewRating)}/5
                    </span>
                  </div>
                  <Textarea
                    placeholder="Podziel się swoim doświadczeniem ze sprzedawcą..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="resize-none rounded-xl"
                  />
                  <Button onClick={submitReview} disabled={submittingReview} className="gap-2 rounded-xl shadow-md">
                    <Send className="h-4 w-4" />
                    {submittingReview ? 'Wysyłanie...' : 'Wyślij opinię'}
                  </Button>
                </motion.div>
              )}

              {/* Reviews */}
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0 ring-1 ring-border">
                        <AvatarImage src={r.reviewer?.avatar_url || ''} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {(r.reviewer?.display_name || '?').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{r.reviewer?.display_name || 'Użytkownik'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`} />
                          ))}
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : !user || user.id === listing.user_id ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-sm">Ten sprzedawca nie ma jeszcze opinii</p>
                </div>
              ) : null}
            </div>
          </div>
        </motion.section>

        {/* Related listings */}
        {relatedListings.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-14 pb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🛍️</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Podobne oferty</h2>
              </div>
              <Link to={`/?category=${encodeURIComponent(listing.category)}`} className="text-sm text-primary font-medium hover:underline">
                Zobacz wszystkie →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {relatedListings.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => { navigate(`/product/${p.id}`); setSelectedImg(0); }}
                  className="cursor-pointer group rounded-2xl overflow-hidden bg-card border border-border/50 hover:shadow-xl hover:border-border hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-square overflow-hidden bg-secondary/30">
                    <img
                      src={p.images?.[0] || '/placeholder.svg'}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors">{p.title}</h3>
                    <p className="text-sm font-bold text-primary mt-1 font-['Space_Grotesk']">{p.price.toLocaleString('pl-PL')} zł</p>
                    {p.location && (
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />{p.location}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      <Footer />
      {listing && (
        <OfferDialog
          open={offerOpen}
          onOpenChange={setOfferOpen}
          listingId={listing.id}
          sellerId={listing.user_id}
          listingTitle={listing.title}
          listingPrice={Number(listing.price)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
