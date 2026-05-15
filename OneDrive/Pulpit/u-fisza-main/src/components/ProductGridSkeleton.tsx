import { motion } from "framer-motion";

const ProductCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm animate-pulse">
    {/* Image area */}
    <div className="bg-gradient-to-br from-muted/80 via-muted/60 to-muted/40 h-64 relative">
      <div className="absolute top-3 left-3 h-6 w-20 rounded-full bg-muted-foreground/10" />
      <div className="absolute top-3 right-3 h-6 w-14 rounded-full bg-muted-foreground/10" />
    </div>
    {/* Content */}
    <div className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="h-5 w-2/3 rounded-lg bg-muted-foreground/10" />
        <div className="h-6 w-16 rounded-lg bg-muted-foreground/10" />
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded bg-muted-foreground/8" />
        <div className="h-3.5 w-4/5 rounded bg-muted-foreground/8" />
      </div>
      <div className="flex items-center gap-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 w-3 rounded-full bg-muted-foreground/8" />
        ))}
        <div className="h-3 w-6 rounded bg-muted-foreground/8 ml-1" />
      </div>
      <div className="h-12 w-full rounded-xl bg-muted-foreground/8" />
      <div className="h-11 w-full rounded-xl bg-muted-foreground/10" />
    </div>
  </div>
);

const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08, duration: 0.4 }}
      >
        <ProductCardSkeleton />
      </motion.div>
    ))}
  </div>
);

export { ProductCardSkeleton, ProductGridSkeleton };
export default ProductGridSkeleton;
