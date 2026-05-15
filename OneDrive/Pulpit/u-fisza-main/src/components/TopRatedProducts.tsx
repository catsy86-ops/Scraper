import { motion } from "framer-motion";
import { Star, Trophy, TrendingUp, Flame, ArrowRight } from "lucide-react";
import { products } from "@/data/products";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import BlurImage from "@/components/BlurImage";

interface ProductWithRating {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  abv: number;
  description: string;
  avg: number;
  count: number;
}

const TopRatedProducts = () => {
  const addItem = useCartStore((s) => s.addItem);

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top-rated-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("product_id, rating");
      if (error) throw error;

      const statsMap: Record<string, { sum: number; count: number }> = {};
      data?.forEach((r) => {
        if (!statsMap[r.product_id]) statsMap[r.product_id] = { sum: 0, count: 0 };
        statsMap[r.product_id].sum += r.rating;
        statsMap[r.product_id].count += 1;
      });

      const rated: ProductWithRating[] = products
        .map((p) => {
          const s = statsMap[p.id];
          if (!s || s.count === 0) return null;
          return { ...p, avg: Math.round((s.sum / s.count) * 10) / 10, count: s.count };
        })
        .filter(Boolean) as ProductWithRating[];

      return rated.sort((a, b) => b.avg - a.avg || b.count - a.count).slice(0, 4);
    },
  });

  // If no reviews yet, show top products by default with placeholder ratings
  const displayProducts =
    topProducts.length > 0
      ? topProducts
      : products.slice(0, 4).map((p) => ({ ...p, avg: 4.8, count: 0 }));

  const handleAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} dodano do koszyka! 🎉`);
  };

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <motion.div
        className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-beer-gold/[0.04] blur-[120px]"
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-beer-amber/[0.05] blur-[100px]"
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      <div className="relative container mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-6 text-sm font-semibold tracking-wider uppercase border border-beer-gold/20 bg-gradient-to-r from-beer-gold/10 via-beer-amber/5 to-beer-gold/10 text-beer-amber"
            whileHover={{ scale: 1.05 }}
          >
            <Trophy className="h-4 w-4" />
            Najwyżej oceniane
            <Flame className="h-4 w-4 text-beer-gold" />
          </motion.div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Hity od <span className="shimmer-text">Fisza</span> 🏆
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Produkty, które pokochali nasi klienci — sprawdź sam!
          </p>
        </motion.div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {displayProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={`/produkt/${product.id}`} className="block group">
                <motion.div
                  className="relative rounded-2xl overflow-hidden border border-border/40 bg-card/80 backdrop-blur-sm"
                  whileHover={{ y: -10, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                >
                  {/* Rank badge */}
                  {i < 3 && (
                    <div className="absolute top-3 left-3 z-20">
                      <motion.div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-sm shadow-lg ${
                          i === 0
                            ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-900"
                            : i === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700"
                            : "bg-gradient-to-br from-amber-600 to-amber-700 text-amber-200"
                        }`}
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300 }}
                      >
                        #{i + 1}
                      </motion.div>
                    </div>
                  )}

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none z-10 bg-gradient-to-t from-beer-gold/10 via-transparent to-beer-amber/5" />
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-10 shadow-[inset_0_0_0_1.5px_hsl(var(--beer-gold)/0.25),0_20px_60px_-15px_hsl(var(--beer-amber)/0.2)]" />

                  {/* Image */}
                  <div className="relative bg-gradient-to-br from-beer-foam/60 via-card to-secondary/20 p-5 flex items-center justify-center h-52 overflow-hidden">
                    <motion.div
                      className="absolute w-28 h-28 rounded-full border border-beer-gold/[0.06]"
                      animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <BlurImage
                      src={product.image}
                      alt={product.name}
                      className="relative h-40 w-auto object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="font-display text-base font-bold text-foreground leading-tight group-hover:text-beer-amber transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className={`h-3.5 w-3.5 ${
                              j < Math.round(product.avg)
                                ? "fill-beer-gold text-beer-gold"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-sm text-foreground">{product.avg}</span>
                      {product.count > 0 && (
                        <span className="text-xs text-muted-foreground">({product.count})</span>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-beer-amber font-bold text-xl tabular-nums">{product.price.toFixed(2)}</span>
                        <span className="text-beer-amber/60 text-xs font-semibold ml-0.5">zł</span>
                      </div>
                      <motion.button
                        onClick={(e) => handleAdd(product, e)}
                        className="p-2.5 rounded-xl bg-gradient-to-br from-beer-amber to-beer-gold text-beer-dark shadow-md hover:shadow-lg transition-shadow"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <motion.a
            href="#produkty"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl glass-light text-foreground font-semibold hover:text-beer-amber transition-colors border border-border/50 hover:border-beer-gold/30"
            whileHover={{ scale: 1.05, gap: "12px" }}
            whileTap={{ scale: 0.97 }}
          >
            Zobacz całą ofertę
            <ArrowRight className="h-4 w-4" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default TopRatedProducts;
