import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
};

type Props = {
  kind: 'terms' | 'privacy';
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: LegalSection[];
  intro?: ReactNode;
};

const LegalLayout = ({ kind, title, subtitle, updatedAt, sections, intro }: Props) => {
  const Icon = kind === 'terms' ? FileText : ShieldCheck;
  const otherTo = kind === 'terms' ? '/privacy' : '/terms';
  const otherLabel = kind === 'terms' ? 'Polityka prywatności' : 'Regulamin';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-primary rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Strona główna
          </Button>
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-['Space_Grotesk']">{title}</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          <p className="mt-2 text-xs text-muted-foreground/70 uppercase tracking-wider">Ostatnia aktualizacja: {updatedAt}</p>
        </motion.header>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Spis treści</p>
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block px-3 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="text-primary/70 mr-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="prose-content space-y-10">
            {intro && (
              <div className="rounded-2xl border border-border/60 bg-card/50 p-5 text-sm text-muted-foreground leading-relaxed">
                {intro}
              </div>
            )}

            {sections.map((s, i) => (
              <motion.section
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.2) }}
                className="scroll-mt-24"
              >
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3 flex items-baseline gap-3">
                  <span className="text-primary tabular-nums text-base">§{i + 1}</span>
                  <span>{s.title}</span>
                </h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed text-sm md:text-base">
                  {s.paragraphs?.map((p, idx) => <p key={idx}>{p}</p>)}
                  {s.list && (
                    <ul className="list-disc pl-5 space-y-1.5 marker:text-primary">
                      {s.list.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  )}
                </div>
              </motion.section>
            ))}

            <div className="pt-8 mt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">Pytania? Napisz na <a href="mailto:kontakt@ufisza.pl" className="text-primary hover:underline">kontakt@ufisza.pl</a></p>
              <Link to={otherTo}>
                <Button variant="outline" className="rounded-xl">Zobacz: {otherLabel}</Button>
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalLayout;