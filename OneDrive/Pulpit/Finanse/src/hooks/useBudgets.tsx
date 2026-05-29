import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
};

export type NewBudget = {
  category: string;
  monthly_limit: number;
  alert_threshold?: number;
};

export function useBudgets(userId: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("category_budgets")
      .select("*")
      .eq("user_id", userId)
      .order("category");
    setLoading(false);
    if (error) {
      console.error(error);
      toast.error("Nie udało się pobrać budżetów");
      return;
    }
    setBudgets((data ?? []) as Budget[]);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`budgets-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "category_budgets", filter: `user_id=eq.${userId}` },
        () => reload(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, reload]);

  const upsert = useCallback(
    async (b: NewBudget) => {
      if (!userId) {
        toast.error("Zaloguj się, aby ustawiać budżety");
        return false;
      }
      const { error } = await supabase
        .from("category_budgets")
        .upsert(
          {
            user_id: userId,
            category: b.category,
            monthly_limit: b.monthly_limit,
            alert_threshold: b.alert_threshold ?? 80,
          },
          { onConflict: "user_id,category" },
        );
      if (error) {
        console.error(error);
        toast.error("Nie udało się zapisać budżetu");
        return false;
      }
      toast.success("Zapisano budżet");
      return true;
    },
    [userId],
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("category_budgets").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Nie udało się usunąć");
      return false;
    }
    toast.success("Usunięto budżet");
    return true;
  }, []);

  return { budgets, loading, upsert, remove, reload };
}
