import { Heart, User, Plus, Menu, MessageCircle, Home, Package, LogOut, Sun, Moon, Sparkles, Shield, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTheme } from '@/hooks/useTheme';
import { useUserRole } from '@/hooks/useUserRole';
import LiveSearch from '@/components/LiveSearch';
import NotificationBell from '@/components/NotificationBell';

const Logo = ({ size = 'default' }: { size?: 'default' | 'small' }) => (
  <Link to="/" className="flex items-baseline gap-0 group select-none">
    <span className={`font-bold tracking-tight font-['Space_Grotesk'] transition-colors ${
      size === 'small' ? 'text-xl' : 'text-2xl'
    }`}>
      <span className="text-primary group-hover:text-primary/80 transition-colors">u</span>
      <span className="text-foreground group-hover:text-foreground/80 transition-colors">Fisza</span>
    </span>
  </Link>
);

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const unreadCount = useUnreadMessages();
  const { dark, toggle: toggleTheme } = useTheme();
  const { isModerator } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLiveSearch = (q: string) => {
    navigate(`/?q=${encodeURIComponent(q)}`);
  };

  const initials = (user?.user_metadata?.full_name || user?.email || '?').slice(0, 2).toUpperCase();

  const NavIconButton = ({ onClick, children, label, badge }: { onClick: () => void; children: React.ReactNode; label: string; badge?: number }) => (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
      onClick={onClick}
      aria-label={label}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-in zoom-in-50 duration-200">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Button>
  );

  const mobileNav = (to: string, icon: React.ReactNode, label: string, badge?: number) => (
    <button
      onClick={() => { navigate(to); setMobileOpen(false); }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent/80 transition-all duration-200 w-full text-left group"
    >
      <div className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="font-medium group-hover:translate-x-0.5 transition-transform">{label}</span>
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          {/* Desktop Search */}
          <LiveSearch className="hidden flex-1 max-w-xl md:block" onSearch={handleLiveSearch} />

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-0.5">
            <NavIconButton onClick={() => navigate('/messages')} label="Wiadomości" badge={unreadCount}>
              <MessageCircle className="h-5 w-5" />
            </NavIconButton>

            {user && <NotificationBell />}

            {user && isModerator && (
              <NavIconButton onClick={() => navigate('/admin')} label="Panel admina">
                <Shield className="h-5 w-5" />
              </NavIconButton>
            )}

            <NavIconButton onClick={toggleTheme} label="Przełącz motyw">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </NavIconButton>

            {user && (
              <NavIconButton onClick={() => navigate('/history')} label="Historia oglądania">
                <HistoryIcon className="h-5 w-5" />
              </NavIconButton>
            )}

            <NavIconButton onClick={() => navigate('/profile')} label="Ulubione">
              <Heart className="h-5 w-5" />
            </NavIconButton>

            <div className="w-px h-6 bg-border/60 mx-1.5" />

            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => navigate('/profile')}
              >
                <Avatar className="h-8 w-8 ring-2 ring-border/60 hover:ring-primary/50 transition-all duration-200">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl gap-2 transition-all duration-200"
                onClick={() => navigate('/auth')}
              >
                <User className="h-4 w-4" />
                Zaloguj
              </Button>
            )}

            <Button
              className="ml-2 gap-2 font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => navigate('/add')}
            >
              <Plus className="h-4 w-4" />
              Dodaj ogłoszenie
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-xl relative">
                <Menu className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 border-l border-border/40">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="p-6 pb-4">
                  <Logo size="small" />
                  <div className="mt-4">
                    <LiveSearch onSearch={(q) => { handleLiveSearch(q); setMobileOpen(false); }} placeholder="Szukaj..." />
                  </div>
                </div>

                <Separator className="opacity-50" />

                {/* User Section */}
                {user && (
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-3 px-2">
                      <Avatar className="h-11 w-11 ring-2 ring-border/60">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{user.user_metadata?.full_name || user.email}</p>
                        <p className="text-xs text-muted-foreground">Twoje konto</p>
                      </div>
                    </div>
                  </div>
                )}

                {user && <Separator className="opacity-50" />}

                {/* Navigation */}
                <div className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                  {mobileNav('/', <Home className="h-5 w-5 text-muted-foreground" />, 'Strona główna')}
                  {mobileNav('/messages', <MessageCircle className="h-5 w-5 text-muted-foreground" />, 'Wiadomości', unreadCount)}
                  {mobileNav('/profile', <User className="h-5 w-5 text-muted-foreground" />, 'Profil')}
                  {mobileNav('/profile', <Heart className="h-5 w-5 text-muted-foreground" />, 'Ulubione')}
                  {mobileNav('/profile', <Package className="h-5 w-5 text-muted-foreground" />, 'Moje ogłoszenia')}
                  {user && mobileNav('/history', <HistoryIcon className="h-5 w-5 text-muted-foreground" />, 'Historia oglądania')}
                  {user && isModerator && mobileNav('/admin', <Shield className="h-5 w-5 text-primary" />, 'Panel admina')}
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-accent/80 transition-all duration-200 w-full text-left group"
                  >
                    {dark ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
                    <span className="font-medium group-hover:translate-x-0.5 transition-transform">{dark ? 'Jasny motyw' : 'Ciemny motyw'}</span>
                  </button>
                </div>

                <Separator className="opacity-50" />

                {/* Bottom actions */}
                <div className="p-4 space-y-2">
                  <Button
                    className="w-full gap-2 font-semibold rounded-xl h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                    onClick={() => { navigate('/add'); setMobileOpen(false); }}
                  >
                    <Plus className="h-4 w-4" />
                    Dodaj ogłoszenie
                  </Button>
                  {user ? (
                    <Button
                      variant="ghost"
                      className="w-full gap-2 text-muted-foreground rounded-xl h-11"
                      onClick={async () => { await signOut(); setMobileOpen(false); navigate('/'); }}
                    >
                      <LogOut className="h-4 w-4" />
                      Wyloguj się
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2 rounded-xl h-11"
                      onClick={() => { navigate('/auth'); setMobileOpen(false); }}
                    >
                      <User className="h-4 w-4" />
                      Zaloguj się
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
