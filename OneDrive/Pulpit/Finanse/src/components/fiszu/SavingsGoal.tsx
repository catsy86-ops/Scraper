import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Pencil, Check, X } from "lucide-react";
import { formatPLN } from "@/lib/finance-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

type GoalData = {
  name: string;
  target: number;
  current: number;
};

const DEMO_GOAL: GoalData = { name: "Wakacje 2026 · Japonia", target: 25000, current: 14250 };
const LS_KEY = "fiszu_savings_goal";

function loadLocalGoal(): GoalData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as GoalData;
  } catch {}
  return DEMO_GOAL;
}

export function SavingsGoal() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<GoalData>(DEMO_GOAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GoalData>(DEMO_GOAL);

  // Load from Supabase user_settings metadata or localStorage
  useEffect(() => {
    if (!user) {
      setGoal(loadLocalGoal());
      return;
    }
    supabase
      .from("user_settings")
      .select("sim_income")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(() => {
        // We store goal in localStorage keyed by user id for now
        const key = `${LS_KEY}_${user.id}`;
        try {
          const raw = localStorage.getItem(key);
          if (raw) setGoal(JSON.parse(raw) as GoalData);
          else setGoal(DEMO_GOAL);
        } catch {
          setGoal(DEMO_GOAL);
        }
      });
  }, [user]);

  const saveGoal = (g: GoalData) => {
    const key = user ? `${LS_KEY}_${user.id}` : LS_KEY;
    localStorage.setItem(key, JSON.stringify(g));
    setGoal(g);
    toast.success("Cel oszczędnościowy zaktualizowany");
  };

  const startEdit = () => {
    setDraft({ ...goal });
    setEditing(true);
  };

  const confirmEdit = () => {
    if (!draft.name.trim()) return toast.error("Podaj nazwę celu");
    if (draft.target <= 0) return toast.error("Cel musi być większy od 0");
    if (draft.current < 0) return toast.error("Aktualna kwota nie może być ujemna");
    saveGoal(draft);
    setEditing(false);
  };

  const pct = Math.min(100, goal.target > 0 ? (goal.current / goal.target) * 100 : 0);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          <h3 className="font-display text-lg font-semibold">Cel oszczędnościowy</h3>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Edytuj cel"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nazwa celu</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="np. Wakacje · Japonia"
              maxLength={80}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Cel (PLN)</label>
              <Input
                type="number"
                min={1}
                step={500}
                value={draft.target}
                onChange={(e) => setDraft((d) => ({ ...d, target: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Odłożono (PLN)</label>
              <Input
                type="number"
                min={0}
                step={100}
                value={draft.current}
                onChange={(e) => setDraft((d) => ({ ...d, current: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmEdit} className="flex-1 gap-1.5">
              <Check className="h-3.5 w-3.5" /> Zapisz
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Anuluj
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{goal.name}</p>

          <div className="mt-4 flex items-end justify-between">
            <span className="font-display text-3xl font-bold">{formatPLN(goal.current)}</span>
            <span className="text-sm text-muted-foreground">z {formatPLN(goal.target)}</span>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              key={goal.current}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "var(--gradient-brand)" }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{pct.toFixed(0)}% celu</span>
            <span>
              {goal.current >= goal.target
                ? "Cel osiągnięty 🎉"
                : `Zostało ${formatPLN(goal.target - goal.current)}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
