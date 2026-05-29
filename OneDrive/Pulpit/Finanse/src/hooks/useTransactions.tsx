import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Transaction = {
  id: string;
  user_id: string;
  occurred_on: string;
  title: string;
  category: string;
  amount: number;
  recurring: boolean;
  note: string | null;
  created_at: string;
};

export type NewTransaction = {
  occurred_on?: string;
  title: string;
  category: string;
  amount: number;
  recurring?: boolean;
  note?: string | null;
};

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      console.error(error);
      toast.error("Nie udało się pobrać transakcji");
      return;
    }
    setTransactions((data ?? []) as Transaction[]);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`tx-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        (payload) => {
          setTransactions((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Transaction;
              if (prev.some((t) => t.id === row.id)) return prev;
              return [row, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Transaction;
              return prev.map((t) => (t.id === row.id ? row : t));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Transaction;
              return prev.filter((t) => t.id !== row.id);
            }
            return prev;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const add = useCallback(
    async (tx: NewTransaction) => {
      if (!userId) {
        toast.error("Zaloguj się, aby dodawać transakcje");
        return false;
      }
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        occurred_on: tx.occurred_on ?? new Date().toISOString().slice(0, 10),
        title: tx.title,
        category: tx.category,
        amount: tx.amount,
        recurring: tx.recurring ?? false,
        note: tx.note ?? null,
      });
      if (error) {
        console.error(error);
        toast.error("Nie udało się dodać transakcji");
        return false;
      }
      toast.success("Dodano transakcję");
      return true;
    },
    [userId],
  );

  const update = useCallback(async (id: string, patch: Partial<NewTransaction>) => {
    const { error } = await supabase
      .from("transactions")
      .update({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
        ...(patch.recurring !== undefined ? { recurring: patch.recurring } : {}),
        ...(patch.occurred_on !== undefined ? { occurred_on: patch.occurred_on } : {}),
        ...(patch.note !== undefined ? { note: patch.note } : {}),
      })
      .eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Nie udało się zapisać zmian");
      return false;
    }
    toast.success("Zaktualizowano transakcję");
    return true;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Nie udało się usunąć");
      return false;
    }
    toast.success("Usunięto transakcję");
    return true;
  }, []);

  return { transactions, loading, add, update, remove, reload };
}
