import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Package, Heart, Clock, LogOut, MapPin, Edit2, Save, Trash2, Pencil, Star, Tag, Users, Bookmark } from 'lucide-react';
import ProfileDashboard from '@/components/ProfileDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import StatsChart from '@/components/StatsChart';
import OffersList from '@/components/OffersList';
import FollowingFeed from '@/components/FollowingFeed';
import SavedSearchesList from '@/components/SavedSearchesList';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  is_active: boolean;
  is_promoted: boolean;
  created_at: string;
}

interface FavoriteWithListing {
  id: string;
  created_at: string;
  listing: Listing;
}

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<FavoriteWithListing[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Profile>({ display_name: '', avatar_url: '', bio: '', location: '' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchListings();
    fetchFavorites();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, bio, location')
      .eq('user_id', user!.id)
      .single();
    if (data) {
      setProfile(data);
      setEditForm(data);
    }
  };

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, images, category, condition, is_active, is_promoted, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setListings(data);
  };

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id, created_at, listing:listings(id, title, price, images, category, condition, is_active, created_at)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setFavorites(data as unknown as FavoriteWithListing[]);
  };

  const saveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update(editForm)
      .eq('user_id', user!.id);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      setProfile(editForm);
      setEditing(false);
      toast({ title: 'Zapisano profil' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = (profile?.display_name || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 flex-1 py-8 relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-mesh opacity-60 -z-10" />
        {/* Profile header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8 p-6 rounded-3xl bg-gradient-card border border-border shadow-elegant">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-xl bg-gradient-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>

          {editing ? (
            <div className="flex-1 space-y-3 w-full">
              <Input
                placeholder="Nazwa użytkownika"
                value={editForm.display_name || ''}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              />
              <Input
                placeholder="Lokalizacja"
                value={editForm.location || ''}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
              <Textarea
                placeholder="O mnie..."
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveProfile} className="gap-2">
                  <Save className="h-4 w-4" /> Zapisz
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditForm(profile!); }}>
                  Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{profile?.display_name || 'Użytkownik'}</h1>
                <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              {profile?.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </p>
              )}
              {profile?.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
              <p className="text-xs text-muted-foreground mt-2">{user?.email}</p>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Wyloguj
          </Button>
        </div>

        {/* Stats overview */}
        {user && <StatsChart userId={user.id} />}
        {user && <ProfileDashboard userId={user.id} />}

        {/* Tabs */}
        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="w-full md:w-auto flex-wrap h-auto">
            <TabsTrigger value="listings" className="gap-2">
              <Package className="h-4 w-4" /> Ogłoszenia ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" /> Ulubione ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="offers-received" className="gap-2">
              <Tag className="h-4 w-4" /> Oferty otrzymane
            </TabsTrigger>
            <TabsTrigger value="offers-sent" className="gap-2">
              <Tag className="h-4 w-4" /> Moje oferty
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <Users className="h-4 w-4" /> Obserwowani
            </TabsTrigger>
            <TabsTrigger value="saved-searches" className="gap-2">
              <Bookmark className="h-4 w-4" /> Zapisane
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" /> Historia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            {listings.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nie masz jeszcze żadnych ogłoszeń</p>
                <Button className="mt-4" onClick={() => navigate('/add')}>Dodaj ogłoszenie</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    onDelete={(id) => setListings((prev) => prev.filter((x) => x.id !== id))}
                    onUpdate={(updated) => setListings((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            {favorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nie masz ulubionych ogłoszeń</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Przeglądaj oferty</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((f) => (
                  <ListingCard key={f.id} listing={f.listing} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers-received" className="mt-6">
            <OffersList asSeller />
          </TabsContent>
          <TabsContent value="offers-sent" className="mt-6">
            <OffersList />
          </TabsContent>
          <TabsContent value="following" className="mt-6">
            <FollowingFeed />
          </TabsContent>
          <TabsContent value="saved-searches" className="mt-6">
            <SavedSearchesList />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="text-center py-16">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Historia aktywności pojawi się tutaj</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

const ListingCard = ({ listing, onDelete, onUpdate }: { listing: Listing; onDelete?: (id: string) => void; onUpdate?: (updated: Listing) => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const togglePromote = async () => {
    setPromoting(true);
    const newVal = !listing.is_promoted;
    const { error } = await supabase.from('listings').update({ is_promoted: newVal }).eq('id', listing.id);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: newVal ? 'Ogłoszenie wyróżnione!' : 'Wyróżnienie usunięte' });
      onUpdate?.({ ...listing, is_promoted: newVal });
    }
    setPromoting(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('listings').delete().eq('id', listing.id);
    if (error) {
      toast({ title: 'Błąd usuwania', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ogłoszenie usunięte' });
      onDelete?.(listing.id);
    }
    setDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className={`flex gap-4 p-4 rounded-xl bg-card border hover:shadow-md transition-shadow ${listing.is_promoted ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'}`}>
        {listing.is_promoted && (
          <div className="absolute top-2 right-2">
          </div>
        )}
        <div
          onClick={() => navigate(`/product/${listing.id}`)}
          className="w-20 h-20 rounded-lg bg-secondary overflow-hidden flex-shrink-0 cursor-pointer"
        >
          {listing.images?.[0] && (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            onClick={() => navigate(`/product/${listing.id}`)}
            className="font-medium text-sm line-clamp-2 text-foreground cursor-pointer hover:underline"
          >
            {listing.title}
          </h3>
          <p className="text-primary font-bold mt-1">{listing.price.toLocaleString('pl-PL')} zł</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {listing.is_promoted && (
              <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-primary" /> Wyróżnione
              </span>
            )}
            <span className="text-xs text-muted-foreground">{listing.category}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{listing.condition}</span>
          </div>
        </div>
        {onDelete && (
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 ${listing.is_promoted ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              onClick={togglePromote}
              disabled={promoting}
              title={listing.is_promoted ? 'Cofnij wyróżnienie' : 'Wyróżnij ogłoszenie'}
            >
              <Star className={`h-4 w-4 ${listing.is_promoted ? 'fill-primary' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => navigate(`/edit/${listing.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń ogłoszenie</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć „{listing.title}"? Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Anuluj</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Usuwanie...' : 'Usuń'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Profile;
