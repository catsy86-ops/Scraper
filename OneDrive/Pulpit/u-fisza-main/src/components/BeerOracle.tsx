import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, RotateCcw, Heart, BookHeart, Trash2, X, Eye, Search, Download, Upload, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tone = "yes" | "no" | "maybe";
interface Answer {
  text: string;
  tone: Tone;
}

interface SavedFortune {
  id: string;
  question: string;
  text: string;
  tone: Tone;
  savedAt: number;
}

const ANSWERS: Answer[] = [
  { text: "Tak, ale tylko po drugim piwie. 🍺", tone: "yes" },
  { text: "Pena mówi: ZDECYDOWANIE TAK!", tone: "yes" },
  { text: "Fisz kiwa płetwą — bierz to.", tone: "yes" },
  { text: "Niebo, chmiel i Ty — zgrane idealnie.", tone: "yes" },
  { text: "Tak, ale weź ze sobą przekąskę. 🥨", tone: "yes" },
  { text: "Lepiej zapytaj jutro, dziś chmiel śpi.", tone: "maybe" },
  { text: "Hmm... rzuć monetą do kufla.", tone: "maybe" },
  { text: "Połowa Fisza mówi tak, druga połowa już śpi.", tone: "maybe" },
  { text: "Mgła nad piwem zbyt gęsta. Spróbuj znów.", tone: "maybe" },
  { text: "Nie. Stanowczo nie. 🚫", tone: "no" },
  { text: "Nie ma takiej opcji nawet po IPA.", tone: "no" },
  { text: "Fisz odpływa. Zły moment.", tone: "no" },
  { text: "Pomyśl jeszcze raz po stoucie.", tone: "no" },
  { text: "Tylko jeśli postawisz Fiszowi browar.", tone: "maybe" },
  { text: "Tak — ale zapamiętaj, że Cię ostrzegałem. 😎", tone: "yes" },
];

const toneStyle: Record<Tone, string> = {
  yes: "from-beer-gold/30 to-beer-wheat/20 border-beer-gold/40 text-beer-gold",
  no: "from-destructive/30 to-destructive/10 border-destructive/40 text-destructive",
  maybe: "from-beer-foam/20 to-muted/10 border-beer-foam/30 text-beer-foam",
};

const toneLabel: Record<Tone, string> = { yes: "TAK", no: "NIE", maybe: "MOŻE" };

const LS_FORTUNES = "fisz_oracle_favorites";
const MAX_FAVORITES = 30;

const loadFavorites = (): SavedFortune[] => {
  try {
    const raw = localStorage.getItem(LS_FORTUNES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favs: SavedFortune[]) => {
  try {
    localStorage.setItem(LS_FORTUNES, JSON.stringify(favs));
  } catch {
    /* ignore */
  }
};

const BeerOracle = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [shaking, setShaking] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [view, setView] = useState<"oracle" | "favorites">("oracle");
  const [favorites, setFavorites] = useState<SavedFortune[]>(() => loadFavorites());
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ kind: "one"; id: string } | { kind: "all" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const currentSavedId = answer
    ? favorites.find((f) => f.text === answer.text && f.question === lastQuestion)?.id
    : undefined;

  const ask = () => {
    if (!question.trim()) {
      inputRef.current?.focus();
      return;
    }
    setShaking(true);
    setAnswer(null);
    const askedAbout = question.trim();
    setTimeout(() => {
      const next = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
      setAnswer(next);
      setLastQuestion(askedAbout);
      setShaking(false);
      setShakeKey((k) => k + 1);
    }, 900);
  };

  const reset = () => {
    setQuestion("");
    setAnswer(null);
    setLastQuestion("");
    inputRef.current?.focus();
  };

  const toggleFavorite = () => {
    if (!answer) return;
    if (currentSavedId) {
      setFavorites((prev) => prev.filter((f) => f.id !== currentSavedId));
      toast("Wróżba usunięta z ulubionych");
      return;
    }
    const entry: SavedFortune = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: lastQuestion,
      text: answer.text,
      tone: answer.tone,
      savedAt: Date.now(),
    };
    setFavorites((prev) => [entry, ...prev].slice(0, MAX_FAVORITES));
    toast.success("Zapisano w księdze wróżb 📖", {
      description: 'Znajdziesz ją w zakładce „Moje wróżby"',
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const replayFavorite = (f: SavedFortune) => {
    setAnswer({ text: f.text, tone: f.tone });
    setLastQuestion(f.question);
    setQuestion(f.question);
    setShakeKey((k) => k + 1);
    setView("oracle");
  };

  const randomFavorite = () => {
    if (favorites.length === 0) {
      toast("Brak zapisanych wróżb — najpierw zapisz kilka ❤️");
      return;
    }
    const pool = favorites.length > 1 && answer
      ? favorites.filter((f) => !(f.text === answer.text && f.question === lastQuestion))
      : favorites;
    const choice = (pool.length ? pool : favorites)[
      Math.floor(Math.random() * (pool.length ? pool.length : favorites.length))
    ];
    replayFavorite(choice);
    toast("🎲 Fisz wylosował wróżbę z księgi");
  };

  const clearAllFavorites = () => {
    if (favorites.length === 0) return;
    setFavorites([]);
    setSearchQuery("");
    toast("Księga wróżb wyczyszczona");
  };

  const filteredFavorites = favorites.filter((f) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      f.question.toLowerCase().includes(q) ||
      f.text.toLowerCase().includes(q)
    );
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportFavorites = () => {
    if (favorites.length === 0) {
      toast("Brak wróżb do eksportu");
      return;
    }
    const payload = {
      app: "u-fisza",
      kind: "oracle-favorites",
      version: 1,
      exportedAt: new Date().toISOString(),
      fortunes: favorites,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fisz-wrozby-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Wyeksportowano ${favorites.length} wróżb 📦`);
  };

  const importFavorites = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const arr: unknown = Array.isArray(data) ? data : data?.fortunes;
      if (!Array.isArray(arr)) throw new Error("Nieprawidłowy format pliku");
      const validTones: Tone[] = ["yes", "no", "maybe"];
      const incoming: SavedFortune[] = arr
        .filter(
          (x: any) =>
            x &&
            typeof x.text === "string" &&
            typeof x.question === "string" &&
            validTones.includes(x.tone),
        )
        .map((x: any) => ({
          id:
            typeof x.id === "string"
              ? x.id
              : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          question: x.question,
          text: x.text,
          tone: x.tone as Tone,
          savedAt: typeof x.savedAt === "number" ? x.savedAt : Date.now(),
        }));
      if (incoming.length === 0) throw new Error("Brak wróżb w pliku");
      setFavorites((prev) => {
        const map = new Map<string, SavedFortune>();
        [...incoming, ...prev].forEach((f) => {
          const key = `${f.question}::${f.text}`;
          if (!map.has(key)) map.set(key, f);
        });
        return Array.from(map.values()).slice(0, MAX_FAVORITES);
      });
      const added = incoming.length;
      toast.success(`Zaimportowano ${added} wróżb 📥`, {
        description: "Duplikaty pominięto",
      });
    } catch (err: any) {
      toast.error("Nie udało się wczytać pliku", {
        description: err?.message || "Sprawdź czy plik to JSON z księgi wróżb",
      });
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-beer-gold/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 max-w-2xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-beer-gold/10 text-beer-gold text-xs font-bold px-4 py-2 rounded-full mb-4 border border-beer-gold/20 tracking-widest uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Kufel Wyroczni
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
            Zapytaj <span className="shimmer-text">Fisza</span> o cokolwiek
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Mistyczny kufel zna odpowiedź. Wpisz pytanie, potrząśnij i poznaj wyrok piany.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card rounded-3xl p-6 md:p-8 border border-beer-gold/15"
        >
          {/* Tab switcher */}
          <div className="flex items-center justify-between mb-5">
            <div className="inline-flex rounded-xl bg-background/40 p-1 border border-beer-gold/15">
              <button
                onClick={() => setView("oracle")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  view === "oracle"
                    ? "bg-beer-gold text-beer-dark shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wand2 className="inline h-3.5 w-3.5 mr-1" />
                Wyrocznia
              </button>
              <button
                onClick={() => setView("favorites")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  view === "favorites"
                    ? "bg-beer-gold text-beer-dark shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookHeart className="inline h-3.5 w-3.5 mr-1" />
                Moje wróżby ({favorites.length})
              </button>
            </div>
            {view === "favorites" && (
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importFavorites(file);
                    e.target.value = "";
                  }}
                />
                {favorites.length > 0 && (
                  <button
                    onClick={randomFavorite}
                    className="text-[11px] text-beer-gold/80 hover:text-beer-gold font-semibold px-2 py-1 rounded-lg hover:bg-beer-gold/10 transition-colors inline-flex items-center gap-1"
                    title="Wylosuj zapisaną wróżbę"
                  >
                    <Shuffle className="h-3 w-3" />
                    Losuj
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-beer-gold/80 hover:text-beer-gold font-semibold px-2 py-1 rounded-lg hover:bg-beer-gold/10 transition-colors inline-flex items-center gap-1"
                  title="Importuj z pliku JSON"
                >
                  <Upload className="h-3 w-3" />
                  Import
                </button>
                <button
                  onClick={exportFavorites}
                  disabled={favorites.length === 0}
                  className="text-[11px] text-beer-gold/80 hover:text-beer-gold font-semibold px-2 py-1 rounded-lg hover:bg-beer-gold/10 transition-colors inline-flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-transparent"
                  title="Eksportuj do pliku JSON"
                >
                  <Download className="h-3 w-3" />
                  Export
                </button>
                {favorites.length > 0 && (
                  <button
                    onClick={() => setPendingDelete({ kind: "all" })}
                    className="text-[11px] text-destructive/70 hover:text-destructive font-semibold px-2 py-1 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {view === "oracle" ? (
              <motion.div
                key="oracle"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Mug */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={
                      shaking
                        ? { rotate: [-12, 12, -10, 10, -6, 6, 0], y: [0, -4, 0, -2, 0] }
                        : { y: [0, -6, 0] }
                    }
                    transition={
                      shaking
                        ? { duration: 0.9 }
                        : { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }
                    className="text-7xl md:text-8xl select-none"
                    aria-hidden
                  >
                    🍺
                  </motion.div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Input
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && ask()}
                    placeholder="Np. Czy dziś otworzyć stout?"
                    className="bg-background/50 border-beer-gold/20 focus-visible:ring-beer-gold/40"
                    maxLength={120}
                  />
                  <Button
                    onClick={ask}
                    disabled={shaking}
                    className="bg-beer-gold hover:bg-beer-gold/90 text-beer-dark font-bold gap-2 shrink-0"
                  >
                    <Wand2 className="h-4 w-4" />
                    {shaking ? "Pyta..." : "Wróżby"}
                  </Button>
                </div>

                {favorites.length > 0 && (
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={randomFavorite}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-beer-gold/90 hover:text-beer-gold px-3 py-1.5 rounded-full border border-beer-gold/30 hover:border-beer-gold/60 hover:bg-beer-gold/10 transition-all"
                      title="Wylosuj jedną z zapisanych wróżb"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      Losuj ulubioną ({favorites.length})
                    </button>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {answer && (
                    <motion.div
                      key={shakeKey}
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 280, damping: 20 }}
                      className={`relative rounded-2xl p-5 pr-12 bg-gradient-to-br border ${toneStyle[answer.tone]}`}
                    >
                      <div className="text-xs uppercase tracking-widest opacity-70 mb-1">
                        Fisz prorokuje:
                      </div>
                      <p className="font-display text-lg md:text-xl font-bold leading-snug">
                        „{answer.text}"
                      </p>
                      {lastQuestion && (
                        <p className="text-[11px] opacity-60 italic mt-2">
                          w odpowiedzi na: „{lastQuestion}"
                        </p>
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        <button
                          onClick={toggleFavorite}
                          className={`p-1.5 rounded-lg transition-all ${
                            currentSavedId
                              ? "bg-beer-gold/30 text-beer-gold"
                              : "opacity-60 hover:opacity-100 hover:bg-beer-foam/10"
                          }`}
                          aria-label={currentSavedId ? "Usuń z ulubionych" : "Zapisz wróżbę"}
                          title={currentSavedId ? "Zapisana — kliknij aby usunąć" : "Zapisz w księdze wróżb"}
                        >
                          <Heart
                            className="h-4 w-4"
                            fill={currentSavedId ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          onClick={reset}
                          className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-beer-foam/10 transition-all"
                          aria-label="Zapytaj ponownie"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {!answer && !shaking && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      className="text-center text-xs text-muted-foreground italic"
                    >
                      ✨ Piana milczy. Zadaj pytanie i potrząśnij kuflem ✨
                    </motion.p>
                  )}
                  {shaking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-sm text-beer-gold font-bold tracking-wider"
                    >
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        Mieszamy chmielowe wróżby...
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-h-[260px]"
              >
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <BookHeart className="h-10 w-10 text-beer-gold/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Twoja księga wróżb jest pusta.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Kliknij ❤️ przy odpowiedzi, by zapisać ulubione przepowiednie.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Szukaj wróżby..."
                        className="pl-9 bg-background/50 border-beer-gold/20 focus-visible:ring-beer-gold/40 text-sm"
                        maxLength={60}
                      />
                    </div>
                    {filteredFavorites.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Brak wyników dla „{searchQuery}"
                        </p>
                        <button
                          onClick={() => setSearchQuery("")}
                          className="text-xs text-beer-gold hover:underline mt-1"
                        >
                          Pokaż wszystkie
                        </button>
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {filteredFavorites.map((f) => (
                          <motion.li
                            key={f.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className={`group relative rounded-xl p-3 pr-20 bg-gradient-to-br border ${toneStyle[f.tone]}`}
                          >
                            <div className="text-[10px] font-bold tracking-widest opacity-70 mb-1">
                              {toneLabel[f.tone]}
                              {f.question && (
                                <span className="ml-2 opacity-60 normal-case font-normal italic tracking-normal">
                                  · „{f.question}"
                                </span>
                              )}
                            </div>
                            <p className="font-display text-sm font-bold leading-snug">
                              „{f.text}"
                            </p>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => replayFavorite(f)}
                                className="p-1.5 rounded-lg bg-background/30 hover:bg-background/60 transition-colors"
                                aria-label="Pokaż ponownie"
                                title="Pokaż w wyroczni"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setPendingDelete({ kind: "one", id: f.id })}
                                className="p-1.5 rounded-lg bg-background/30 hover:bg-destructive/30 transition-colors"
                                aria-label="Usuń"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === "all"
                ? "Wyczyścić całą księgę wróżb?"
                : "Usunąć tę wróżbę?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "all"
                ? `Bezpowrotnie usuniesz wszystkie zapisane wróżby (${favorites.length}). Fisz nic nie pamięta po tym kroku 🐟`
                : "Wpis zniknie z księgi i nie da się go przywrócić."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete?.kind === "all") {
                  clearAllFavorites();
                } else if (pendingDelete?.kind === "one") {
                  removeFavorite(pendingDelete.id);
                  toast("Wróżba usunięta z księgi");
                }
                setPendingDelete(null);
              }}
            >
              {pendingDelete?.kind === "all" ? "Wyczyść wszystko" : "Usuń"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default BeerOracle;
