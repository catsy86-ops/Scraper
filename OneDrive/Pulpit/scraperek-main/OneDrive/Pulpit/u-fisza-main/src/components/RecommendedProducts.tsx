import { useMemo } from "react";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { Sparkles } from "lucide-react";

interface RecommendedProductsProps {
  currentProductId: string;
  category: string;
  maxItems?: number;
}

const RecommendedProducts = ({ currentProductId, category, maxItems = 4 }: RecommendedProductsProps) => {
  const recommended = useMemo(() => {
    const sameCategory = products.filter(
      (p) => p.id !== currentProductId && p.category === category
    );
    const others = products.filter(
      (p) => p.id !== currentProductId && p.category !== category
    );
    const combined = [...sameCategory, ...others];
    // Shuffle a bit for variety
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    // Prioritize same category
    return [...sameCategory.slice(0, 2), ...others.slice(0, maxItems - 2)].slice(0, maxItems);
  }, [currentProductId, category, maxItems]);

  if (recommended.length === 0) return null;

  return (
    <section className="mt-20">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 bg-beer-gold/10 text-beer-gold text-sm font-bold px-4 py-2 rounded-full mb-4 border border-beer-gold/15">
          <Sparkles className="h-4 w-4" />
          Polecane dla Ciebie
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Może Ci się spodobać
        </h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          Odkryj inne smaki, które idealnie uzupełnią Twój wybór
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommended.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedProducts;
