import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

const ReviewSection = ({ productId, productName }: ReviewSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Musisz być zalogowany");
      if (rating === 0) throw new Error("Wybierz ocenę");
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonim",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      setRating(0);
      setComment("");
      toast.success("Recenzja dodana! 🎉");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      toast.success("Recenzja usunięta");
    },
  });

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-beer-amber" />
        <h3 className="font-display text-2xl font-bold text-foreground">
          Recenzje ({reviews.length})
        </h3>
        {avgRating && (
          <div className="flex items-center gap-2 ml-auto">
            <StarRating rating={Math.round(Number(avgRating))} size="sm" />
            <span className="text-beer-gold font-bold text-lg">{avgRating}</span>
          </div>
        )}
      </div>

      {/* Add review form */}
      {user ? (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="font-semibold text-foreground">Oceń {productName}</p>
          <StarRating rating={rating} onRate={setRating} size="lg" interactive />
          <Textarea
            placeholder="Napisz swoją recenzję... (opcjonalnie)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            className="resize-none"
          />
          <Button
            onClick={() => addReview.mutate()}
            disabled={rating === 0 || addReview.isPending}
            className="bg-primary text-primary-foreground"
          >
            {addReview.isPending ? "Dodawanie..." : "Dodaj recenzję ⭐"}
          </Button>
        </div>
      ) : (
        <div className="bg-muted rounded-xl p-5 text-center text-muted-foreground">
          <a href="/auth" className="text-beer-amber hover:underline font-semibold">
            Zaloguj się
          </a>{" "}
          aby dodać recenzję
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <p className="text-muted-foreground text-center">Ładowanie recenzji...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-center italic">
          Brak recenzji. Bądź pierwszy! 🍺
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-card border border-border rounded-xl p-4 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-beer-amber/20 flex items-center justify-center text-beer-amber font-bold text-sm">
                    {(review.user_name || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {review.user_name || "Anonim"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: pl,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} size="sm" />
                  {user?.id === review.user_id && (
                    <button
                      onClick={() => deleteReview.mutate(review.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-muted-foreground text-sm mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
