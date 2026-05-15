import { useState, useMemo, useEffect } from "react";
import { products } from "@/data/products";
import { SECRET_PRODUCT, isSecretUnlocked } from "@/data/secretProduct";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import ProductCard from "@/components/ProductCard";
import { Sparkles, Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

type SortOption = "default" | "price-asc" | "price-desc" | "abv-asc" | "abv-desc" | "name-az";

const sortOptions: { key: SortOption; label: string }[] = [
  { key: "default", label: "Domyślne" },
  { key: "price-asc", label: "Cena ↑" },
  { key: "price-desc", label: "Cena ↓" },
  { key: "abv-asc", label: "ABV ↑" },
  { key: "abv-desc", label: "ABV ↓" },
  { key: "name-az", label: "A–Z" },
];

const categories = [
  { key: "all", label: "Wszystko", icon: "🍻" },
  { key: "piwo", label: "Piwo", icon: "🍺" },
  { key: "wino", label: "Wino", icon: "🍷" },
  { key: "wódka", label: "Wódka", icon: "🥃" },
  { key: "inne", label: "Whisky & Likiery", icon: "🥂" },
];

const MAX_PRICE = Math.ceil(Math.max(...products.map((p) => p.price)));
const MAX_ABV = Math.ceil(Math.max(...products.map((p) => p.abv)));

const ProductGrid = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [abvRange, setAbvRange] = useState([0, MAX_ABV]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [isLoading, setIsLoading] = useState(true);

  const [secretUnlocked, setSecretUnlocked] = useState(() => isSecretUnlocked());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = () => setSecretUnlocked(true);
    window.addEventListener("fisz-secret-unlocked", handler);
    return () => window.removeEventListener("fisz-secret-unlocked", handler);
  }, []);

  const allProducts = useMemo(() => {
    const list = [...products];
    if (secretUnlocked) list.push(SECRET_PRODUCT);
    return list;
  }, [secretUnlocked]);

  const filtered = useMemo(() => {
    const result = allProducts.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (p.abv < abvRange[0] || p.abv > abvRange[1]) return false;
      return true;
    });

    switch (sortBy) {
      case "price-asc": return [...result].sort((a, b) => a.price - b.price);
      case "price-desc": return [...result].sort((a, b) => b.price - a.price);
      case "abv-asc": return [...result].sort((a, b) => a.abv - b.abv);
      case "abv-desc": return [...result].sort((a, b) => b.abv - a.abv);
      case "name-az": return [...result].sort((a, b) => a.name.localeCompare(b.name));
      default: return result;
    }
  }, [activeCategory, searchQuery, priceRange, abvRange, sortBy]);

  const hasActiveFilters = searchQuery || priceRange[0] > 0 || priceRange[1] < MAX_PRICE || abvRange[0] > 0 || abvRange[1] < MAX_ABV;

  const clearFilters = () => {
    setSearchQuery("");
    setPriceRange([0, MAX_PRICE]);
    setAbvRange([0, MAX_ABV]);
    setActiveCategory("all");
  };

  return (
    <section id="produkty" className="relative py-20 px-4 bg-grain">
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-beer-gold/3 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-beer-amber/3 blur-3xl" />

      <div className="relative container mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-beer-amber/10 text-beer-amber text-sm font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wider uppercase">
            <Sparkles className="h-4 w-4" />
            Premium Selection
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Nasza <span className="text-gradient-beer">Oferta</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Ręcznie wyselekcjonowane trunki od Fisza.
            Wybierz swoje ulubione i zamów z dostawą! 🚚
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Szukaj produktu po nazwie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 rounded-full border-beer-gold/20 bg-card focus-visible:ring-beer-amber/40 text-base"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${showFilters ? "bg-beer-amber text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="max-w-2xl mx-auto overflow-hidden"
            >
              <div className="p-5 rounded-2xl border border-beer-gold/20 bg-card/80 backdrop-blur-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-beer-amber" /> Filtry zaawansowane
                  </h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-beer-amber hover:underline flex items-center gap-1">
                      <X className="h-3 w-3" /> Wyczyść filtry
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Cena: <span className="text-foreground font-semibold">{priceRange[0]} zł – {priceRange[1]} zł</span>
                  </label>
                  <Slider
                    min={0} max={MAX_PRICE} step={1}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="[&_[data-radix-slider-range]]:bg-beer-amber [&_[data-radix-slider-thumb]]:border-beer-amber"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Mocność ABV: <span className="text-foreground font-semibold">{abvRange[0]}% – {abvRange[1]}%</span>
                  </label>
                  <Slider
                    min={0} max={MAX_ABV} step={0.5}
                    value={abvRange}
                    onValueChange={setAbvRange}
                    className="[&_[data-radix-slider-range]]:bg-beer-amber [&_[data-radix-slider-thumb]]:border-beer-amber"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
          {categories.map((cat) => (
            <motion.button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              whileTap={{ scale: 0.95 }}
              className={`px-5 md:px-6 py-2.5 rounded-full font-semibold transition-all duration-300 text-sm flex items-center gap-2 ${
                activeCategory === cat.key
                  ? "btn-beer shadow-md glow-gold"
                  : "bg-card text-muted-foreground border border-border hover:border-beer-amber/30 hover:text-foreground hover:shadow-sm"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Sort & count */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
          <motion.p
            key={filtered.length}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-muted-foreground text-sm"
          >
            {filtered.length} {filtered.length === 1 ? "produkt" : filtered.length < 5 ? "produkty" : "produktów"} w ofercie
          </motion.p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground mr-1" />
            {sortOptions.map((opt) => (
              <motion.button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                whileTap={{ scale: 0.93 }}
                className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  sortBy === opt.key
                    ? "text-white"
                    : "bg-card text-muted-foreground border border-border hover:border-beer-amber/30 hover:text-foreground"
                }`}
              >
                {sortBy === opt.key && (
                  <motion.span
                    layoutId="sort-pill"
                    className="absolute inset-0 bg-beer-amber rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={6} />
        ) : (
          <LayoutGroup>
            {filtered.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <p className="text-5xl mb-4">🍺</p>
                <p className="text-xl font-semibold text-foreground mb-2">Brak wyników</p>
                <p className="text-muted-foreground mb-4">Spróbuj zmienić filtry lub wyszukaj inny produkt</p>
                <button onClick={clearFilters} className="btn-beer px-6 py-2 rounded-full text-sm font-semibold">
                  Wyczyść filtry
                </button>
              </motion.div>
            )}
          </LayoutGroup>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
