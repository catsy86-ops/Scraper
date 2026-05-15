import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import { useCartStore } from "@/stores/cartStore";
import { ShoppingCart, ArrowLeft, Droplets, Tag, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import ReviewSection from "@/components/ReviewSection";
import BlurImage from "@/components/BlurImage";
import RecommendedProducts from "@/components/RecommendedProducts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const addItem = useCartStore((s) => s.addItem);
  const [isFav, setIsFav] = useState(false);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-6xl mb-4">🍺</p>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Produkt nie znaleziony</h1>
          <Link to="/" className="text-beer-amber hover:underline font-semibold">
            ← Wróć do sklepu
          </Link>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    toast.success(`${product.name} x${qty} dodano do koszyka! 🎉`);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link skopiowany! 📋");
    } catch {
      toast.error("Nie udało się skopiować linku");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Wróć do sklepu
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-16">
          {/* Image */}
          <motion.div
            className="relative bg-gradient-to-br from-beer-foam via-card to-secondary/30 rounded-3xl p-8 md:p-12 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-60 h-60 rounded-full border border-beer-gold/8" />
              <div className="absolute w-80 h-80 rounded-full border border-beer-gold/4" />
            </div>
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
            >
              <BlurImage
                src={product.image}
                alt={product.name}
                className="relative h-72 md:h-96 w-auto object-contain drop-shadow-2xl"
              />
            </motion.div>
          </motion.div>

          {/* Details */}
          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-beer-dark/80 text-beer-gold text-xs font-bold px-3 py-1.5 rounded-full border border-beer-gold/10">
                <Droplets className="h-3 w-3" />
                {product.abv}% ABV
              </span>
              <span className="inline-flex items-center gap-1.5 bg-beer-amber/15 text-beer-amber text-xs font-bold px-3 py-1.5 rounded-full">
                <Tag className="h-3 w-3" />
                {product.category === "piwo" ? "Piwo" : product.category === "wino" ? "Wino" : product.category === "wódka" ? "Wódka" : "Premium"}
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {product.name}
            </h1>

            <p className="text-muted-foreground text-base md:text-lg mb-5 leading-relaxed">{product.description}</p>

            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm italic text-muted-foreground border border-border/30">
              💡 {product.funFact}
            </div>

            <div className="flex items-end gap-3 mb-4">
              <span className="text-beer-amber font-display font-bold text-4xl">
                {product.price.toFixed(2)}
              </span>
              <span className="text-muted-foreground text-lg mb-1">zł</span>
              {qty > 1 && (
                <span className="text-muted-foreground text-sm mb-1.5">
                  × {qty} = <span className="text-foreground font-semibold">{(product.price * qty).toFixed(2)} zł</span>
                </span>
              )}
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-muted-foreground">Ilość:</span>
              <div className="flex items-center rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3.5 py-2 text-foreground hover:bg-muted transition-colors font-bold"
                >
                  −
                </button>
                <span className="px-4 py-2 font-bold text-foreground tabular-nums min-w-[2.5rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(20, qty + 1))}
                  className="px-3.5 py-2 text-foreground hover:bg-muted transition-colors font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <motion.button
                onClick={handleAdd}
                className="flex-1 inline-flex items-center justify-center gap-3 btn-beer px-8 py-4 rounded-xl font-bold text-base glow-amber"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <ShoppingCart className="h-5 w-5" />
                Dodaj do koszyka
              </motion.button>
              <motion.button
                onClick={() => { setIsFav(!isFav); toast(isFav ? "Usunięto z ulubionych" : "Dodano do ulubionych ❤️"); }}
                whileTap={{ scale: 0.85 }}
                className={`p-4 rounded-xl border transition-colors ${
                  isFav ? "bg-red-500/10 border-red-400/30 text-red-500" : "bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
              </motion.button>
              <motion.button
                onClick={handleShare}
                whileTap={{ scale: 0.85 }}
                className="p-4 rounded-xl border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <ReviewSection productId={product.id} productName={product.name} />
        </motion.div>

        {/* Recommended products */}
        <RecommendedProducts currentProductId={product.id} category={product.category} />
      </div>
      <Footer />
    </div>
  );
};

export default ProductPage;
