import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';

const CompareBar = () => {
  const { ids, remove, clear, max } = useCompare();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {ids.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl"
        >
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-elegant">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Scale className="h-4 w-4 text-primary" />
              {ids.length}/{max} do porównania
            </div>
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {ids.map((id) => (
                <button
                  key={id}
                  onClick={() => remove(id)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-mono hover:bg-primary/20"
                >
                  {id.slice(0, 8)}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
              Wyczyść
            </Button>
            <Button
              size="sm"
              disabled={ids.length < 2}
              onClick={() => navigate('/compare')}
              className="rounded-xl"
            >
              Porównaj
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompareBar;