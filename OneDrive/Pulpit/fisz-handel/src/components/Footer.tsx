import { Link } from 'react-router-dom';
import { Heart, Cookie } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

const Footer = () => {
  const { openSettings } = useCookieConsent();
  return (
    <footer className="border-t border-border/40 bg-card/50 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-baseline select-none">
              <span className="text-2xl font-bold tracking-tight font-['Space_Grotesk']">
                <span className="text-primary">u</span>
                <span className="text-foreground">Fisza</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Twój marketplace używanych rzeczy. Kupuj tanio, sprzedawaj szybko!
            </p>
          </div>
          {[
            {
              title: 'Dla kupujących',
              links: ['Jak kupować', 'Ochrona kupujących', 'Dostawa'],
            },
            {
              title: 'Dla sprzedających',
              links: ['Jak sprzedawać', 'Cennik', 'Promowanie ogłoszeń'],
            },
            {
              title: 'Pomoc',
              links: ['Centrum pomocy', { label: 'Regulamin', to: '/terms' }, { label: 'Polityka prywatności', to: '/privacy' }, { label: 'O nas', to: '/about' }],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4 text-foreground">{title}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {links.map((link) => {
                  if (typeof link === 'object') {
                    return (
                      <li key={link.label}>
                        <Link to={link.to} className="hover:text-primary transition-colors duration-200">{link.label}</Link>
                      </li>
                    );
                  }
                  return (
                    <li key={link} className="hover:text-primary cursor-pointer transition-colors duration-200">
                      {link}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border/40 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} uFisza. Wszelkie prawa zastrzeżone.</span>
          <div className="flex items-center gap-4">
            <button
              onClick={openSettings}
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Cookie className="h-3.5 w-3.5" /> Ustawienia cookies
            </button>
            <span className="flex items-center gap-1">
              Zbudowane z <Heart className="h-3 w-3 text-primary fill-primary" /> w Polsce
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
