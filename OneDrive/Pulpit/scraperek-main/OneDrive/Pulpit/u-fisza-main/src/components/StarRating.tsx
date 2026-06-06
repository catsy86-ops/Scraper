import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

const StarRating = ({ rating, onRate, size = "md", interactive = false }: StarRatingProps) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          className={cn(
            "transition-transform",
            interactive && "hover:scale-125 cursor-pointer",
            !interactive && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              "transition-colors",
              star <= rating
                ? "fill-beer-gold text-beer-gold"
                : "fill-none text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
