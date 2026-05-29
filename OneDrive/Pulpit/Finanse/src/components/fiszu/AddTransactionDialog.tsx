import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTransactions, type NewTransaction, type Transaction } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_CATEGORIES = [
  "Jedzenie", "Transport", "Subskrypcje", "Zakupy", "Rozrywka",
  "Mieszkanie", "Zdrowie", "Edukacja", "Inne",
];

const LS_CUSTOM_CATS = "fiszu_custom_categories";

function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_CATS);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return [...DEFAULT_CATEGORIES, ...parsed.filter((c) => !DEFAULT_CATEGORIES.includes(c))];
    }
  } catch {}
  return DEFAULT_CATEGORIES;
}

function saveCustomCategory(cat: string) {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_CATS);
    const existing: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!existing.includes(cat) && !DEFAULT_CATEGORIES.includes(cat)) {
      localStorage.setItem(LS_CUSTOM_CATS, JSON.stringify([...existing, cat]));
    }
  } catch {}
}

type Props = {
  trigger?: React.ReactNode;
  editing?: Transaction | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddTransactionDialog({ trigger, editing, open: controlledOpen, onOpenChange }: Props) {
  const { user } = useAuth();
  const { add, update } = useTransactions(user?.id);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const isEdit = !!editing;
  const initialType: "expense" | "income" = editing
    ? Number(editing.amount) >= 0 ? "income" : "expense"
    : "expense";

  const [type, setType] = useState<"expense" | "income">(initialType);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [category, setCategory] = useState(editing && editing.category !== "Przychód" ? editing.category : "Jedzenie");
  const [amount, setAmount] = useState(editing ? String(Math.abs(Number(editing.amount))) : "");
  const [recurring, setRecurring] = useState(editing?.recurring ?? false);
  const [date, setDate] = useState(editing?.occurred_on ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(editing?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [customCat, setCustomCat] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [categories, setCategories] = useState<string[]>(loadCategories);

  // Sync when editing target changes / dialog opens
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(Number(editing.amount) >= 0 ? "income" : "expense");
      setTitle(editing.title);
      setCategory(editing.category !== "Przychód" ? editing.category : "Jedzenie");
      setAmount(String(Math.abs(Number(editing.amount))));
      setRecurring(editing.recurring);
      setDate(editing.occurred_on);
      setNote(editing.note ?? "");
    }
  }, [editing, open]);

  const reset = () => {
    setType("expense");
    setTitle("");
    setAmount("");
    setNote("");
    setRecurring(false);
    setCategory("Jedzenie");
    setDate(new Date().toISOString().slice(0, 10));
    setCustomCat("");
    setShowCustom(false);
  };

  const addCustomCategory = () => {
    const trimmed = customCat.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setCategory(trimmed);
      setShowCustom(false);
      return;
    }
    saveCustomCategory(trimmed);
    const updated = [...categories, trimmed];
    setCategories(updated);
    setCategory(trimmed);
    setCustomCat("");
    setShowCustom(false);
  };

  const submit = async () => {
    const numeric = parseFloat(amount.replace(",", "."));
    if (!title.trim()) return toast.error("Podaj tytuł transakcji");
    if (!Number.isFinite(numeric) || numeric <= 0) return toast.error("Podaj poprawną kwotę większą od zera");
    setBusy(true);
    const payload: NewTransaction = {
      title: title.trim(),
      category: type === "income" ? "Przychód" : category,
      amount: type === "income" ? Math.abs(numeric) : -Math.abs(numeric),
      recurring,
      occurred_on: date,
      note: note.trim() || null,
    };
    const ok = isEdit && editing
      ? await update(editing.id, payload)
      : await add(payload);
    setBusy(false);
    if (ok) {
      if (!isEdit) reset();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && !isEdit) reset(); }}>
      {trigger !== undefined || !isEdit ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.78_0.17_165)] to-[oklch(0.72_0.15_200)] px-5 py-3 font-medium text-primary-foreground shadow-glow transition hover:opacity-90">
              <Plus className="h-4 w-4" />
              Dodaj transakcję
            </button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Edytuj transakcję" : "Nowa transakcja"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${type === "expense" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <ArrowDownCircle className="h-4 w-4" /> Wydatek
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${type === "income" ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            <ArrowUpCircle className="h-4 w-4" /> Przychód
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="tx-title">Tytuł</Label>
            <Input id="tx-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Biedronka" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tx-amount">Kwota (PLN)</Label>
              <Input id="tx-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label htmlFor="tx-date">Data</Label>
              <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {type === "expense" && (
            <div>
              <Label htmlFor="tx-cat">Kategoria</Label>
              <div className="flex gap-2">
                <select
                  id="tx-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {categories.filter((c) => c !== "Przychód").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustom((v) => !v)}
                  className="rounded-md border border-border px-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  title="Dodaj własną kategorię"
                >
                  + własna
                </button>
              </div>
              {showCustom && (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value)}
                    placeholder="Nazwa kategorii…"
                    maxLength={40}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={addCustomCategory} className="h-8 px-2 text-xs">
                    Dodaj
                  </Button>
                </div>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="tx-note">Notatka (opcjonalna)</Label>
            <Input id="tx-note" value={note ?? ""} onChange={(e) => setNote(e.target.value)} maxLength={250} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label htmlFor="tx-rec" className="cursor-pointer text-sm">Transakcja cykliczna</Label>
            <Switch id="tx-rec" checked={recurring} onCheckedChange={setRecurring} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button onClick={submit} disabled={busy || !user}>
            {user ? (busy ? "Zapisuję…" : isEdit ? "Zapisz zmiany" : "Zapisz") : "Zaloguj się"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
