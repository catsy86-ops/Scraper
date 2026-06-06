import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Pencil, Check, X, Cloud, Loader2 } from "lucide-react";
import { formatPLN } from "@/lib/finance-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

export function SavingsGoal() {
  const { user } = useAuth();
  const { settings, update, loading, saving } = useUserSettings(user?.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", target: 0, current: 0 });

  const goal = {
    name: settings.goal_name,
    target: settings.goal_target,
    current: settings.goal_current,
  };

  const startEdit = () => {
    setDraft({ name: goal.name, target: goal.target, current: goal.current });
    setEditing(true);
  };

  const confirmEdit = () => {
    if (!draft.name.trim()) return toast.error("Podaj nazwę celu");
    if (draft.target <= 0) return toast.error("Cel musi być większy od 0");
    if (draft.current < 0) return toast.error("Aktualna kwota nie może być ujemna");
    if (draft.current > draft.target) return toast.error("Odłożona kwota nie może przekraczać celu");

    const result = update({
      goal_name: draft.name.trim(),
      goal_target: draft.target,
      goal_current: draft.current,
    });

    if (result.ok) {
      setEditing(false);
      if (user) toast.success("Cel oszczędnościowy zaktualizowany", { description: "Zapisano w chmurze." });
      else toast.success("Cel oszczędnościowy zaktualizowany");
    }
  };

  const pct = Math.min(100, goal.target > 0 ? (goal.current / goal.target) * 100 : 0);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          <h3 className="font-display text-lg font-semibold">Cel oszczędnościowy</h3>
        </div>
        <div className="flex items-center gap-2">
          {user && saving && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Zapisuję…
            </span>
          )}
          {user && !saving && !loading && !editing && (
            <span className="inline-flex items-center gap-1 text-[11px] text-success">
              <Cloud className="h-3 w-3" /> Zsynchronizowano
            </span>
          )}
          {!editing && (
            <button
              onClick={startEdit}
              disabled={loading}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-40"
              aria-label="Edytuj cel"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Nazwa celu</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="np. Wakacje · Japonia"
              maxLength={120}
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
