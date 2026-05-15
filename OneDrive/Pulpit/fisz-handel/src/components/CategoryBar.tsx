import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryData } from '@/data/mockProducts';
import {
  Smartphone, Shirt, Home, Dumbbell, Car, BookOpen, Gamepad2, Music, Flame, ChevronDown, X, Grid3X3
} from 'lucide-react';

const iconComponents: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Dumbbell, Car, BookOpen, Gamepad2, Music,
};

interface CategoryBarProps {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

const CategoryBar = ({ selected, onSelect }: CategoryBarProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const selectedData = categoryData.find(c => c.name === selected);

  const handleCategoryClick = (catName: string) => {
    if (selected === catName) {
      onSelect(null);
      setExpandedCategory(null);
    } else {
      onSelect(catName);
      setExpandedCategory(expandedCategory === catName ? null : catName);
    }
  };

  const visibleCategories = showAll ? categoryData : categoryData.slice(0, 6);

  return (
    <div className="py-4" id="listings">
      {/* Desktop: horizontal bar */}
      <div className="hidden md:block">
        <div className="flex gap-2 justify-center flex-wrap">
          {/* All button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { onSelect(null); setExpandedCategory(null); }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              selected === null
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-card text-muted-foreground border border-border/50 hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Flame className="h-5 w-5" />
            Wszystko
          </motion.button>

          {categoryData.map((cat) => {
            const Icon = iconComponents[cat.icon];
            const isSelected = selected === cat.name;
            const isExpanded = expandedCategory === cat.name;

            return (
              <div key={cat.name} className="relative">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'bg-card text-muted-foreground border border-border/50 hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {cat.name}
                  {cat.subcategories.length > 0 && (
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded && isSelected ? 'rotate-180' : ''}`} />
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Subcategories dropdown */}
        <AnimatePresence>
          {selected && selectedData && expandedCategory === selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 justify-center flex-wrap pt-3 pb-1">
                {selectedData.subcategories.map((sub, i) => (
                  <motion.button
                    key={sub}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-secondary/80 text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-border/30 transition-all duration-200"
                  >
                    {sub}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: grid layout */}
      <div className="md:hidden space-y-3">
        <div className="grid grid-cols-4 gap-2 px-1">
          {/* All button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => { onSelect(null); setExpandedCategory(null); }}
            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl text-[11px] font-semibold transition-all ${
              selected === null
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-card text-muted-foreground border border-border/40'
            }`}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
              selected === null ? 'bg-primary-foreground/20' : 'bg-gradient-to-br from-muted to-secondary'
            }`}>
              <Flame className="h-4.5 w-4.5" />
            </div>
            <span className="truncate w-full text-center">Wszystko</span>
          </motion.button>

          {visibleCategories.map((cat) => {
            const Icon = iconComponents[cat.icon];
            const isSelected = selected === cat.name;

            return (
              <motion.button
                key={cat.name}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleCategoryClick(cat.name)}
                className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'bg-card text-muted-foreground border border-border/40'
                }`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-primary-foreground/20' : `bg-gradient-to-br ${cat.color}`
                }`}>
                  {Icon && <Icon className="h-4.5 w-4.5" />}
                </div>
                <span className="truncate w-full text-center leading-tight">{cat.name.split(' ')[0]}</span>
              </motion.button>
            );
          })}

          {/* Show more button on mobile */}
          {!showAll && categoryData.length > 6 && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowAll(true)}
              className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl text-[11px] font-semibold bg-card text-muted-foreground border border-border/40"
            >
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
                <Grid3X3 className="h-4.5 w-4.5" />
              </div>
              <span>Więcej</span>
            </motion.button>
          )}
        </div>

        {/* Mobile subcategories */}
        <AnimatePresence>
          {selected && selectedData && expandedCategory === selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-1"
            >
              <div className="bg-card border border-border/50 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">{selected}</span>
                  <button onClick={() => setExpandedCategory(null)} className="p-1 rounded-lg hover:bg-secondary">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedData.subcategories.map((sub, i) => (
                    <motion.button
                      key={sub}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-secondary/60 text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {sub}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CategoryBar;
