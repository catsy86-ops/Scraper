import { Heart, Star, MapPin, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/data/mockProducts';
import { useCompare } from '@/hooks/useCompare';

interface ProductCardProps {
  product: Product;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const conditionColors: Record<string, string> = {
  'nowy': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'jak nowy': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'dobry': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'używany': 'bg-muted text-muted-foreground border-border',
};

const ProductCard = ({ product, isFavorite, onToggleFavorite }: ProductCardProps) => {
  const isFav = isFavorite ?? false;
  const navigate = useNavigate();
  const { isInCompare, toggle, isFull } = useCompare();
  const inCompare = isInCompare(product.id);

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className={`cursor-pointer group relative rounded-2xl overflow-hidden bg-gradient-card transition-all duration-300 hover:-translate-y-1.5 ${
        product.isPromoted
          ? 'border-2 border-primary/50 shadow-elegant hover:shadow-glow'
          : 'border border-border/50 hover:shadow-elegant hover:border-primary/30'
      }`}
    >
      {/* Promoted badge */}
      {product.isPromoted && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-warm text-primary-foreground text-[10px] font-bold uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5">
          <Star className="h-3 w-3 fill-current" />
          Wyróżnione
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary/50">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 ${
            isFav
              ? 'bg-primary/20 hover:bg-primary/30 scale-110'
              : 'bg-background/70 hover:bg-background/90'
          }`}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${
              isFav ? 'fill-primary text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground'
            }`}
          />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!inCompare && isFull) return;
            toggle(product.id);
          }}
          disabled={!inCompare && isFull}
          aria-label={inCompare ? 'Usuń z porównania' : 'Dodaj do porównania'}
          title={!inCompare && isFull ? 'Limit 4 ofert do porównania' : (inCompare ? 'W porównaniu' : 'Porównaj')}
          className={`absolute top-3 right-14 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            inCompare ? 'bg-primary/20 hover:bg-primary/30 scale-110' : 'bg-background/70 hover:bg-background/90'
          }`}
        >
          <Scale
            className={`h-4 w-4 transition-all duration-200 ${
              inCompare ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground'
            }`}
          />
        </button>

        <div className="absolute bottom-3 left-3">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${conditionColors[product.condition]}`}>
            {product.condition}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
          {product.title}
        </h3>
        <p className="text-lg font-bold text-primary font-['Space_Grotesk'] tracking-tight">
          {product.price.toLocaleString('pl-PL')} zł
        </p>
        <div className="flex items-center gap-2 pt-0.5">
          {product.sellerAvatar ? (
            <img
              src={product.sellerAvatar}
              alt={product.seller}
              loading="lazy"
              className="w-5 h-5 rounded-full object-cover ring-1 ring-border/50"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary">{product.seller[0]}</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground truncate">{product.seller}</span>
          {product.location && (
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-0.5 flex-shrink-0">
              <MapPin className="h-3 w-3" />
              {product.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
