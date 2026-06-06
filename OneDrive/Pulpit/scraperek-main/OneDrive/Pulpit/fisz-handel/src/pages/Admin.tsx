import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Trash2, EyeOff, Eye, Search, UserCog, Loader2, Crown, Users as UsersIcon, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, type AppRole } from '@/hooks/useUserRole';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string | null;
  user_id: string;
  is_active: boolean;
  is_promoted: boolean;
  created_at: string;
  images: string[];
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface RoleRow {
  id: string;
  user_id: string;
  role: AppRole;
}

const StatCard = ({ icon: Icon, label, value, accent }: { icon: typeof Shield; label: string; value: number | string; accent?: string }) => (
  <Card className="p-5 flex items-center gap-4 border-border/60 bg-gradient-to-br from-card to-card/50">
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent ?? 'bg-primary/10 text-primary'}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-2xl font-bold font-['Space_Grotesk'] leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  </Card>
);

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: roleLoading } = useUserRole();

  const [listings, setListings] = useState<ListingRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [stats, setStats] = useState({ listings: 0, users: 0, offers: 0, reports: 0 });

  const canAccess = isAdmin || isModerator;

  useEffect(() => {
    if (!canAccess) return;
    setLoading(true);
    (async () => {
      const [listingsRes, profilesRes, rolesRes, lc, uc, oc] = await Promise.all([
        supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('profiles').select('user_id, display_name, avatar_url, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('user_roles').select('id, user_id, role'),
        supabase.from('listings').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('offers').select('id', { count: 'exact', head: true }),
      ]);
      setListings((listingsRes.data as ListingRow[]) || []);
      setProfiles((profilesRes.data as ProfileRow[]) || []);
      setRoles((rolesRes.data as RoleRow[]) || []);
      setStats({
        listings: lc.count || 0,
        users: uc.count || 0,
        offers: oc.count || 0,
        reports: 0,
      });
      setLoading(false);
    })();
  }, [canAccess]);

  const profileMap = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    profiles.forEach((p) => m.set(p.user_id, p));
    return m;
  }, [profiles]);

  const roleMap = useMemo(() => {
    const m = new Map<string, AppRole[]>();
    roles.forEach((r) => {
      const list = m.get(r.user_id) || [];
      list.push(r.role);
      m.set(r.user_id, list);
    });
    return m;
  }, [roles]);

  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) =>
      l.title.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      (l.location || '').toLowerCase().includes(q)
    );
  }, [listings, query]);

  const filteredProfiles = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      (p.display_name || '').toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q)
    );
  }, [profiles, userQuery]);

  const handleToggleActive = async (l: ListingRow) => {
    const next = !l.is_active;
    const { error } = await supabase.from('listings').update({ is_active: next }).eq('id', l.id);
    if (error) { toast.error('Nie udało się zmienić statusu'); return; }
    setListings((prev) => prev.map((x) => x.id === l.id ? { ...x, is_active: next } : x));
    toast.success(next ? 'Ogłoszenie przywrócone' : 'Ogłoszenie ukryte');
  };

  const handleDeleteListing = async (l: ListingRow) => {
    const { error } = await supabase.from('listings').delete().eq('id', l.id);
    if (error) { toast.error('Nie udało się usunąć'); return; }
    setListings((prev) => prev.filter((x) => x.id !== l.id));
    toast.success('Ogłoszenie usunięte');
  };

  const handleSetRole = async (userId: string, newRole: AppRole | 'none') => {
    if (!isAdmin) { toast.error('Tylko administrator może zmieniać role'); return; }
    // Remove existing roles
    const { error: delErr } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (delErr) { toast.error('Błąd usuwania starej roli'); return; }
    let inserted: RoleRow | null = null;
    if (newRole !== 'none') {
      const { data, error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole }).select().single();
      if (error) { toast.error('Nie udało się przypisać roli'); return; }
      inserted = data as RoleRow;
    }
    setRoles((prev) => {
      const filtered = prev.filter((r) => r.user_id !== userId);
      return inserted ? [...filtered, inserted] : filtered;
    });
    toast.success(newRole === 'none' ? 'Rola usunięta' : `Nadano rolę: ${newRole}`);
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-12 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
          <Card className="max-w-md p-10 text-center space-y-4 border-border/60">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">Brak uprawnień</h1>
            <p className="text-muted-foreground text-sm">
              Ta strona jest dostępna tylko dla administratorów i moderatorów.
            </p>
            <Button asChild variant="outline"><Link to="/">Wróć na stronę główną</Link></Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">Panel administratora</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Zalogowany jako <span className="font-medium text-foreground">{isAdmin ? 'Administrator' : 'Moderator'}</span>
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package} label="Ogłoszeń łącznie" value={stats.listings} />
          <StatCard icon={UsersIcon} label="Użytkowników" value={stats.users} accent="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Crown} label="Aktywnych ofert" value={stats.offers} accent="bg-amber-500/10 text-amber-500" />
          <StatCard icon={UserCog} label="Z rolami" value={new Set(roles.map(r => r.user_id)).size} accent="bg-emerald-500/10 text-emerald-500" />
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="listings" className="rounded-lg gap-2"><Package className="h-4 w-4" /> Ogłoszenia</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg gap-2" disabled={!isAdmin}><UserCog className="h-4 w-4" /> Role użytkowników</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po tytule, kategorii lub lokalizacji…"
                className="pl-9 rounded-xl"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : filteredListings.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground border-dashed">
                Brak ogłoszeń pasujących do wyszukiwania.
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredListings.map((l) => {
                  const owner = profileMap.get(l.user_id);
                  return (
                    <motion.div
                      key={l.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className={`p-3 md:p-4 flex items-center gap-3 md:gap-4 border-border/60 transition-colors hover:border-primary/40 ${!l.is_active ? 'opacity-60' : ''}`}>
                        <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {l.images?.[0] ? (
                            <img src={l.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">brak</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${l.id}`} className="font-semibold text-sm md:text-base truncate hover:text-primary transition-colors block">
                            {l.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="rounded-md">{l.category}</Badge>
                            <span>{Number(l.price).toFixed(2)} zł</span>
                            {l.location && <span>• {l.location}</span>}
                            {l.is_promoted && <Badge className="bg-amber-500 text-white rounded-md">Promowane</Badge>}
                            {!l.is_active && <Badge variant="destructive" className="rounded-md">Ukryte</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground/80 mt-1 truncate">
                            {owner?.display_name || 'Użytkownik'} • {new Date(l.created_at).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg"
                            onClick={() => handleToggleActive(l)}
                            title={l.is_active ? 'Ukryj' : 'Przywróć'}
                          >
                            {l.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Usunąć ogłoszenie?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tej operacji nie można cofnąć. Ogłoszenie „{l.title}" zostanie trwale usunięte.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteListing(l)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Usuń
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Szukaj po nazwie lub ID użytkownika…"
                className="pl-9 rounded-xl"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0,1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProfiles.map((p) => {
                  const userRoles = roleMap.get(p.user_id) || [];
                  const currentRole: AppRole | 'none' = userRoles.includes('admin') ? 'admin' : userRoles.includes('moderator') ? 'moderator' : userRoles.includes('user') ? 'user' : 'none';
                  const isSelf = p.user_id === user.id;
                  return (
                    <Card key={p.user_id} className="p-3 md:p-4 flex items-center gap-3 md:gap-4 border-border/60 hover:border-primary/40 transition-colors">
                      <Avatar className="h-11 w-11 ring-1 ring-border/60">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(p.display_name || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate flex items-center gap-2">
                          {p.display_name || 'Bez nazwy'}
                          {currentRole === 'admin' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{p.user_id}</p>
                      </div>
                      <Select
                        value={currentRole}
                        onValueChange={(v) => handleSetRole(p.user_id, v as AppRole | 'none')}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="w-36 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— brak roli —</SelectItem>
                          <SelectItem value="user">Użytkownik</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
