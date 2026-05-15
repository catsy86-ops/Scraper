import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "@/types/product";
import { useCartStore } from "@/stores/cartStore";
import { ShoppingCart, Star, Droplets, ArrowUpRight, Sparkles, Heart, Eye } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BlurImage from "@/components/BlurImage";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((s) => s.addItem);
  const [isFav, setIsFav] = useState(false);
  const [quickView, setQuickView] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["review-stats", product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("product_id", product.id);
      if (error) throw error;
      if (!data || data.length === 0) return { avg: 0, count: 0 };
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      return { avg: Math.round(avg * 10) / 10, count: data.length };
    },
  });

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} dodano do koszyka! 🎉`);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav(!isFav);
    toast(isFav ? "Usunięto z ulubionych" : "Dodano do ulubionych ❤️");
  };

  return (
    <Link to={`/produkt/${product.id}`} className="block group">
      <motion.div
        className="relative bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm"
        whileHover={{
          y: -8,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
      >
        {/* Hover overlays */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none z-10 bg-gradient-to-t from-beer-gold/8 via-transparent to-beer-amber/3" />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-10 shadow-[inset_0_0_0_1.5px_hsl(var(--beer-gold)/0.2),0_20px_60px_-15px_hsl(var(--beer-amber)/0.2)]" />

        {/* Image area */}
        <div className="relative bg-gradient-to-br from-beer-foam/80 via-card to-secondary/20 p-6 flex items-center justify-center h-64 overflow-hidden">
          {/* Animated decorative rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-36 h-36 rounded-full border border-beer-gold/[0.04]"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute w-52 h-52 rounded-full border border-beer-gold/[0.03]"
              animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          <BlurImage
            src={product.image}
            alt={product.name}
            className="relative h-48 w-auto object-contain drop-shadow-xl"
            loading="lazy"
          />

          {/* ABV badge */}
          <div className="absolute top-3 right-3 bg-beer-dark/85 backdrop-blur-xl text-beer-gold text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-beer-gold/15 shadow-lg">
            <Droplets className="h-3 w-3" />
            {product.abv}%
          </div>

          {/* Category */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-beer-amber to-beer-gold text-beer-dark text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            {product.category === "piwo" ? "🍺 Piwo" : product.category === "wino" ? "🍷 Wino" : product.category === "wódka" ? "🥃 Wódka" : "🥂 Premium"}
          </div>

          {/* Floating action buttons */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <motion.button
              onClick={handleFav}
              whileTap={{ scale: 0.85 }}
              className={`p-2.5 rounded-xl backdrop-blur-md border transition-colors ${
                isFav
                  ? "bg-red-500/90 text-white border-red-400/30"
                  : "bg-beer-dark/70 text-beer-gold border-beer-gold/10 hover:bg-beer-dark/90"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
            </motion.button>
            <div className="p-2.5 rounded-xl bg-beer-dark/70 backdrop-blur-md text-beer-gold border border-beer-gold/10">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-foreground leading-tight group-hover:text-beer-amber transition-colors duration-300">
              {product.name}
            </h3>
            <div className="text-right shrink-0">
              <span className="text-beer-amber font-bold text-xl tabular-nums block leading-none">
                {product.price.toFixed(2)}
              </span>
              <span className="text-beer-amber/60 text-xs font-semibold">zł</span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{product.description}</p>

          {stats && stats.count > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.round(stats.avg) ? "fill-beer-gold text-beer-gold" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-foreground text-xs">{stats.avg}</span>
              <span className="text-muted-foreground text-xs">({stats.count})</span>
            </div>
          )}

          <div className="bg-muted/40 rounded-xl px-3.5 py-2.5 text-[13px] italic text-muted-foreground border border-border/20">
            💡 {product.funFact}
          </div>

          <motion.button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-beer font-semibold text-sm group/btn relative overflow-hidden"
            whileTap={{ scale: 0.97 }}
            whileHover={{ gap: "10px" }}
          >
            <ShoppingCart className="h-4 w-4" />
            Dodaj do koszyka
            <Sparkles className="h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </motion.button>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
