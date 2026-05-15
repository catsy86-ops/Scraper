import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Zap, Heart, Users, Crown, Star, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const faq = [
  { q: 'Jak dodać ogłoszenie?', a: 'Zaloguj się na swoje konto, kliknij „Dodaj ogłoszenie" w nawigacji, wypełnij formularz z tytułem, opisem, ceną i zdjęciami, a następnie opublikuj.' },
  { q: 'Czy korzystanie z uFisza jest darmowe?', a: 'Tak! Rejestracja i dodawanie ogłoszeń jest całkowicie bezpłatne. Oferujemy również opcję promowania ogłoszeń.' },
  { q: 'Jak mogę skontaktować się ze sprzedającym?', a: 'Na stronie ogłoszenia kliknij „Napisz wiadomość". Wiadomości znajdziesz w zakładce „Wiadomości" w menu.' },
  { q: 'Czy mogę edytować opublikowane ogłoszenie?', a: 'Tak — wejdź w swój profil, znajdź ogłoszenie i kliknij ikonę edycji, aby zmienić treść, cenę lub zdjęcia.' },
  { q: 'Jak działa system ulubionych?', a: 'Kliknij ikonę serca na dowolnym ogłoszeniu, aby dodać je do ulubionych. Listę ulubionych znajdziesz w swoim profilu.' },
  { q: 'Jak wyróżnić swoje ogłoszenie?', a: 'W profilu przy swoim ogłoszeniu kliknij ikonę gwiazdki. Wyróżnione ogłoszenia wyświetlają się na górze wyników.' },
  { q: 'Czy moje dane są bezpieczne?', a: 'Tak — stosujemy szyfrowanie i nowoczesne zabezpieczenia. Więcej informacji znajdziesz w naszej Polityce Prywatności.' },
];

const team = [
  {
    name: 'Łukasz K.',
    role: 'CEO & Założyciel',
    icon: Crown,
    description: 'Wizjoner i lider zespołu. Odpowiada za strategię rozwoju platformy i kierunek produktu.',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    name: 'Grzegorz K.',
    role: 'Zastępca & COO',
    icon: Star,
    description: 'Prawa ręka szefa od strony operacyjnej. Dba o sprawne działanie platformy i zadowolenie użytkowników.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Bruno',
    role: 'Prawa Ręka & CTO',
    icon: Gem,
    description: 'Technologiczny geniusz zespołu. Odpowiada za architekturę, bezpieczeństwo i innowacje.',
    color: 'from-emerald-500 to-teal-600',
  },
];

const values = [
  { icon: Shield, title: 'Bezpieczeństwo', desc: 'Każda transakcja jest chroniona. Dbamy o Twoje dane i bezpieczeństwo zakupów.' },
  { icon: Zap, title: 'Szybkość', desc: 'Dodaj ogłoszenie w minutę. Znajdź to, czego szukasz w kilka sekund.' },
  { icon: Heart, title: 'Społeczność', desc: 'Budujemy przyjazną społeczność kupujących i sprzedających w całej Polsce.' },
  { icon: Users, title: 'Zaufanie', desc: 'System recenzji i weryfikacji, byś zawsze wiedział z kim handlujesz.' },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Back */}
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-primary rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Strona główna
          </Button>
        </Link>

        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-['Space_Grotesk'] mb-4">
            O <span className="text-primary">u</span>Fisza
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Jesteśmy polską platformą marketplace, która łączy ludzi chcących kupować i sprzedawać używane rzeczy — szybko, bezpiecznie i bez zbędnych komplikacji.
          </p>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Nasze wartości</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <Icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Nasz zespół</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map(({ name, role, icon: Icon, description, color }) => (
              <div key={name} className="group relative p-6 rounded-2xl border border-border/60 bg-card text-center hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className={`mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">{name}</h3>
                <p className="text-sm font-medium text-primary mb-2">{role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Najczęściej zadawane pytania</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/60 rounded-2xl px-5 data-[state=open]:bg-accent/30 transition-colors">
                <AccordionTrigger className="hover:no-underline text-left font-semibold text-[15px]">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
          <h2 className="text-xl font-bold mb-2">Dołącz do nas!</h2>
          <p className="text-muted-foreground mb-4">Zacznij kupować i sprzedawać już dziś.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button className="rounded-xl font-semibold shadow-lg shadow-primary/25">
                Załóż konto za darmo
              </Button>
            </Link>
            <Link to="/terms">
              <Button variant="outline" className="rounded-xl font-semibold">
                Regulamin i prywatność
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
