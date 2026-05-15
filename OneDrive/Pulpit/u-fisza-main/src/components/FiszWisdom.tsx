import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ThumbsUp, ThumbsDown, Heart, BookHeart, Trash2, Flame, Leaf } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";

const LS_FAVORITES = "fisz_wisdom_favorites";
const LS_DISLIKES = "fisz_wisdom_dislikes";
const LS_LIKES = "fisz_wisdom_likes";
const LS_MODE = "fisz_wisdom_mode";

type Mode = "calm" | "wild";

type SavedWisdom = { text: string; style: string; savedAt: number };

const loadSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};
const saveSet = (key: string, set: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* noop */
  }
};
const loadFavorites = (): SavedWisdom[] => {
  try {
    const raw = localStorage.getItem(LS_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveFavorites = (favs: SavedWisdom[]) => {
  try {
    localStorage.setItem(LS_FAVORITES, JSON.stringify(favs));
  } catch {
    /* noop */
  }
};

type Style =
  | "ipa"
  | "pils"
  | "pszeniczne"
  | "stout"
  | "porter"
  | "lager"
  | "apa"
  | "wino"
  | "wodka"
  | "mocne"
  | "lekkie"
  | "empty"
  | "mix";

const WISDOMS: Record<Style, string[]> = {
  ipa: [
    "IPA w koszyku? Twoje kubki smakowe właśnie kupiły bilet na rollercoaster. 🎢🍺",
    "Chmiel woła, Fisz odpowiada. Goryczka to charakter, nie wada. 🌿",
    "IPA dziennie odgania nudę skuteczniej niż jabłko lekarza.",
  ],
  pils:[
    "Pils — klasyka, której nawet Fisz nie śmie poprawiać. 🎩",
    "Złociste, czyste, uczciwe. Jak uścisk dłoni z czeskim browarmistrzem.",
    "Pils to małe czarne piwa: pasuje do wszystkiego.",
  ],
  pszeniczne: [
    "Pszeniczne = śniadanie mistrzów. (Nie mów lekarzowi.) 🌾",
    "Banan, goździk, chmurka piany — pszenica zna sekret szczęścia.",
    "Hefeweizen w kuflu, lato w sercu. Nawet w listopadzie. ☀️",
  ],
  stout: [
    "Stout to kawa dla dorosłych, którzy mają już dość udawania. ☕🖤",
    "Ciemne, gęste, mądre. Jak najlepszy przyjaciel po północy.",
    "Stout nie pyta. Stout odpowiada.",
  ],
  porter: [
    "Porter to filozof wśród piw. Każdy łyk to traktat. 📚",
    "Bałtycki Porter — bo czasem trzeba dorosłej decyzji w kuflu.",
    "Czekolada, kawa, karmel. Trzy sakramenty Portera.",
  ],
  lager: [
    "Lager to dyplomata: dogada się z każdym daniem i każdym wujkiem.",
    "Prosty? Nie. Klasyczny. Różnica jest jak między t-shirtem a koszulą Fisza. 🎩",
    "Lager nigdy nie zawiódł. Lager nigdy nie zawiedzie.",
  ],
  apa: [
    "APA — komik wśród piw. Owocowy żart, gorzka puenta. 🍊",
    "Amerykański chmiel, polska radość. Wszyscy wygrywają.",
    "APA to IPA, która chodziła na lekcje empatii.",
  ],
  wino: [
    "Wino w koszyku u Fisza? Śmiała decyzja. Szanuję. 🍷",
    "Fisz nie osądza. Fisz tylko unosi kapelusz i nalewa dalej.",
    "Wino to piwo z aspiracjami. Albo piwo to wino bez pretensji.",
  ],
  wodka: [
    "Wódka? Fisz mruga okiem i przygotowuje ogórka. 🥒",
    "Mała czarna kropka na liście zakupów = wielki wieczór.",
    "Pamiętaj: woda przed, woda po, Fisz w środku. 💧",
  ],
  mocne: [
    `Mocne trunki w koszyku — Fisz przypomina: "powoli, kapelusz musi zostać prosto". 🎩`,
    "Wysoki ABV, wysokie wymagania. Pij z szacunkiem.",
    "Jeden kufel = jedna opowieść. Dwa = legenda. Trzy = mit.",
  ],
  lekkie: [
    "Lekkie piwa to maraton, nie sprint. Tempo dla mistrzów. 🏃",
    "Niskie ABV, wysoka kultura picia. Fisz aprobuje.",
    "Sesyjne piwa wymyślono, żeby rozmowa nie umarła przed deserem.",
  ],
  empty: [
    "Pusty koszyk to puste serce. Fisz płacze pod kapeluszem. 😢🎩",
    "Nawet ryba w kapeluszu potrzebuje kufla. Dorzuć coś!",
    "Koszyk czeka. Piwo czeka. Fisz czeka. Tylko Ty zwlekasz.",
  ],
  mix: [
    "Ciekawy zestaw! Fisz widzi konesera (albo imprezę). 🎉",
    "Różnorodność to przyprawa życia. I koszyka.",
    "Mix w koszyku = degustacja w domu. Gratuluję planu.",
  ],
};

// Wariackie wersje — bardziej absurdalne, kapsy, więcej emoji
const WILD_WISDOMS: Record<Style, string[]> = {
  ipa: [
    "IPA?! 🤯 CHMIEL WBIJA NA TWÓJ JĘZYK Z DOSKOKU JAK NINJA W SANDAŁACH! 🥷🌿💥",
    "Twoja IPA dzwoniła. Chce SOLO. Bez przekąsek. BEZ ŚWIADKÓW. 📞🍺🔥",
    "GORYCZ?! To nie goryczka — to MOTYWACJA W PŁYNIE! 💪🍻⚡",
  ],
  pils: [
    "PILS! Złoto płynne! Skarb piratów! 🏴‍☠️🍺 Fisz tańczy poleczkę na barze! 💃",
    "Pils tak czysty, że widzisz w nim PRZYSZŁOŚĆ. A w niej? Kolejny pils. 🔮✨",
    "Czechy pukają. Mówią: „dobry wybór, ziomek”. 🇨🇿👏🍻",
  ],
  pszeniczne: [
    "PSZENICA! 🌾 Banan w kuflu! Goździk w nosie! KARNAWAŁ W GĘBIE! 🎭🍌",
    "Hefeweizen tak puszysty, że można na nim spać. NIE RÓB TEGO. 😴☁️🍺",
    "Pszeniczne o 8 rano = brunch. O 8 wieczorem = LEGENDA. 🌅🌃",
  ],
  stout: [
    "STOUT! 🖤 Ciemność tak gęsta, że łyżka stoi PIONOWO! 🥄⬆️",
    "Wypiłeś stout? Gratulacje, jesteś teraz POETĄ. 📜🎭",
    "Stout to nie piwo. To OŚWIADCZENIE FILOZOFICZNE w szkle. 🧠💥",
  ],
  porter: [
    "PORTER! 📚 Każdy łyk = jedna gwiazdka w recenzji życia! ⭐⭐⭐⭐⭐",
    "Bałtyk się kłania. Mocno. Bardzo mocno. ZA MOCNO! 🌊🤯",
    "Czekolada + kawa + karmel + ALKOHOL = matematyka miłości! 💘🍫",
  ],
  lager: [
    "LAGER! Klasyk! Hit lata! Hit zimy! HIT KAŻDEJ PORY DNIA! 🎵🍺",
    "Lager nigdy Cię nie zostawi. W przeciwieństwie do byłej. 💔➡️🍻",
    "Prosty jak konstrukcja cepa, smaczny jak BABCINY ROSÓŁ. 🍲😍",
  ],
  apa: [
    "APA! 🍊 Pomarańcza, mango, JEDNOROŻEC W KUFLU! 🦄✨",
    "APA to IPA po terapii. NADAL ŚWIRUJE ale UPRZEJMIE. 🧘‍♀️💥",
    "Amerykański chmiel + polska butelka = MIĘDZYNARODOWY INCYDENT SMAKU! 🌎🚨",
  ],
  wino: [
    "WINO?! U FISZA?! 🍷🐟 Fisz upuścił kapelusz! KAPELUSZ! UPUŚCIŁ! 🎩💨",
    "Wino w koszyku piwnym to jak Beyoncé na koncercie disco polo. RESPECT. 👑",
    "Fisz nalewa winko i mówi: „grunt to klasa, dziecino”. 🥂✨",
  ],
  wodka: [
    "WÓDKA! 🥃 Fisz właśnie wyjął ogórki i ZAWOŁAŁ KUMPLI. 🥒📞🎉",
    "Mała? Średnia? DUŻA?! Fisz nie ocenia. Fisz dolewa. 🍾💃",
    "Pamiętaj: ZAGRYZAJ! Albo Fisz się obrazi i schowa kapelusz! 🎩😤",
  ],
  mocne: [
    "MOCNE?! 💪 Fisz wyciąga awaryjny kapelusz i BUTELKĘ WODY! 🎩💧⚠️",
    "Wysokie ABV = wysokie ryzyko śpiewania na ulicy. SPRAWDZONE. 🎤🌃",
    "Tu nie ma „jeden mały”. TU SĄ TYLKO LEGENDY I LEKCJE. 📖🔥",
  ],
  lekkie: [
    "LEKKIE! 🪁 Możesz pić CAŁĄ NOC i nadal pamiętać imię psa! 🐕🏆",
    "Sesyjniak — wymysł geniusza dla maratończyków radości. 🏃‍♂️💨🍺",
    "Niskie ABV, ale wysoki POZIOM ZABAWY! Matematyka się nie zgadza, ale KOGO TO OBCHODZI! 🎉",
  ],
  empty: [
    "PUSTO?! 😱 FISZ PŁACZE! KAPELUSZ MOKNIE! RATUJ GO! 🎩💧🐟",
    "Twój koszyk dzwonił. PROSI O AZYL. PROSZĘ! ZRÓB COŚ! 🛒📞😭",
    "Pusty koszyk to TRAGEDIA WIĘKSZA NIŻ NIEDOLANY KUFEL! 🎭⚰️",
  ],
  mix: [
    "MIX! 🎲 Fisz widzi: konesera, imprezowicza i FILOZOFA W JEDNYM! 🧠🎉🍻",
    "Tyle stylów?! To nie koszyk. TO MANIFEST! 📜🔥",
    "Degustacja w domu? Fisz przybywa Z SAKSOFONEM! 🎷🐟🎩",
  ],
};

const STYLE_KEYWORDS: { style: Style; words: string[] }[] = [
  { style: "ipa", words: ["ipa", "neipa", "dipa"] },
  { style: "apa", words: ["apa", "pale ale"] },
  { style: "pszeniczne", words: ["pszen", "weizen", "witbier", "wheat"] },
  { style: "stout", words: ["stout", "imperial stout", "ris"] },
  { style: "porter", words: ["porter"] },
  { style: "pils", words: ["pils", "pilzn"] },
  { style: "lager", words: ["lager", "jasne pełne"] },
];

const detectStyles = (items: { product: { name: string; description: string; category: string; abv: number } }[]): Style[] => {
  if (items.length === 0) return ["empty"];
  const found = new Set<Style>();
  let hasMocne = false;
  let hasLekkie = false;
  for (const it of items) {
    const text = `${it.product.name} ${it.product.description}`.toLowerCase();
    for (const { style, words } of STYLE_KEYWORDS) {
      if (words.some((w) => text.includes(w))) found.add(style);
    }
    if (it.product.category === "wino") found.add("wino");
    if (it.product.category === "wódka") found.add("wodka");
    if (it.product.abv >= 8) hasMocne = true;
    if (it.product.abv > 0 && it.product.abv <= 4.5 && it.product.category === "piwo") hasLekkie = true;
  }
  if (hasMocne) found.add("mocne");
  if (hasLekkie) found.add("lekkie");
  if (found.size === 0) found.add("mix");
  if (found.size >= 3) found.add("mix");
  return Array.from(found);
};

const FiszWisdom = () => {
  const items = useCartStore((s) => s.items);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"current" | "favorites">("current");
  const [wisdom, setWisdom] = useState("");
  const [activeStyle, setActiveStyle] = useState<Style>("empty");
  const [shakeKey, setShakeKey] = useState(0);
  const [pulses, setPulses] = useState(0);

  const [favorites, setFavorites] = useState<SavedWisdom[]>(() => loadFavorites());
  const [likes, setLikes] = useState<Set<string>>(() => loadSet(LS_LIKES));
  const [dislikes, setDislikes] = useState<Set<string>>(() => loadSet(LS_DISLIKES));
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return (localStorage.getItem(LS_MODE) as Mode) === "wild" ? "wild" : "calm";
    } catch {
      return "calm";
    }
  });

  const styles = useMemo(() => detectStyles(items), [items]);

  useEffect(() => {
    const t = setInterval(() => setPulses((p) => p + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_MODE, mode);
    } catch {
      /* noop */
    }
  }, [mode]);

  const reveal = useCallback(
    (overrideMode?: Mode) => {
      const m = overrideMode ?? mode;
      const style = styles[Math.floor(Math.random() * styles.length)];
      const source = m === "wild" ? WILD_WISDOMS : WISDOMS;
      const fullPool = source[style];
      const pool = fullPool.filter((w) => !dislikes.has(w));
      const finalPool = pool.length > 0 ? pool : fullPool;
      let next = finalPool[Math.floor(Math.random() * finalPool.length)];
      if (next === wisdom && finalPool.length > 1) {
        next = finalPool[(finalPool.indexOf(next) + 1) % finalPool.length];
      }
      setActiveStyle(style);
      setWisdom(next);
      setShakeKey((k) => k + 1);
      setView("current");
      setOpen(true);
    },
    [styles, dislikes, wisdom, mode],
  );

  const toggleMode = () => {
    const next: Mode = mode === "calm" ? "wild" : "calm";
    setMode(next);
    toast(next === "wild" ? "🔥 TRYB WARIACKI WŁĄCZONY!" : "🍃 Tryb spokojny", {
      description: next === "wild" ? "Fisz zdejmuje kapelusz i puszcza disco." : "Fisz wraca do dżentelmeńskiej formy.",
    });
    if (open) reveal(next);
  };


  const isFavorited = useMemo(
    () => favorites.some((f) => f.text === wisdom),
    [favorites, wisdom],
  );
  const isLiked = likes.has(wisdom);
  const isDisliked = dislikes.has(wisdom);

  const handleLike = () => {
    const next = new Set(likes);
    if (next.has(wisdom)) next.delete(wisdom);
    else {
      next.add(wisdom);
      // remove from dislikes if previously disliked
      if (dislikes.has(wisdom)) {
        const d = new Set(dislikes);
        d.delete(wisdom);
        setDislikes(d);
        saveSet(LS_DISLIKES, d);
      }
      toast.success("Fisz uchyla kapelusz 🎩", { description: "Dzięki za feedback!" });
    }
    setLikes(next);
    saveSet(LS_LIKES, next);
  };

  const handleDislike = () => {
    const next = new Set(dislikes);
    if (next.has(wisdom)) next.delete(wisdom);
    else {
      next.add(wisdom);
      if (likes.has(wisdom)) {
        const l = new Set(likes);
        l.delete(wisdom);
        setLikes(l);
        saveSet(LS_LIKES, l);
      }
      toast("Zapamiętane — nie pokażę więcej", { description: "Fisz szuka lepszego dowcipu…" });
    }
    setDislikes(next);
    saveSet(LS_DISLIKES, next);
    // auto-rotate to next
    setTimeout(reveal, 350);
  };

  const handleSave = () => {
    if (isFavorited) {
      const next = favorites.filter((f) => f.text !== wisdom);
      setFavorites(next);
      saveFavorites(next);
      toast("Usunięto z ulubionych");
    } else {
      const entry: SavedWisdom = { text: wisdom, style: activeStyle, savedAt: Date.now() };
      const next = [entry, ...favorites].slice(0, 50);
      setFavorites(next);
      saveFavorites(next);
      toast.success("Zapisano w ulubionych ❤️");
    }
  };

  const removeFavorite = (text: string) => {
    const next = favorites.filter((f) => f.text !== text);
    setFavorites(next);
    saveFavorites(next);
  };

  const labelFor = (s: Style) =>
    ({
      ipa: "Dla Twojej IPA",
      apa: "Dla Twojej APA",
      pils: "Dla Twojego Pilsa",
      pszeniczne: "Dla Twojej pszenicy",
      stout: "Dla Twojego Stouta",
      porter: "Dla Twojego Portera",
      lager: "Dla Twojego Lagera",
      wino: "Dla wina w koszyku",
      wodka: "Dla wódki w koszyku",
      mocne: "Dla mocnych trunków",
      lekkie: "Dla lekkich piw",
      empty: "Pusty koszyk",
      mix: "Dla Twojego miksu",
    })[s];

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3 pointer-events-none">
      <AnimatePresence>
        {open && (
          <motion.div
            key={view + shakeKey}
            initial={{ opacity: 0, y: 20, scale: 0.8, rotate: mode === "wild" ? -6 : 0 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              rotate: mode === "wild" ? [-2, 2, -2, 2, 0] : 0,
            }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: mode === "wild" ? 400 : 260, damping: mode === "wild" ? 10 : 18 }}
            className={`pointer-events-auto relative w-[300px] max-w-[calc(100vw-3rem)] rounded-2xl border bg-card/95 backdrop-blur-md p-4 pr-8 shadow-2xl ${
              mode === "wild" ? "border-accent/60" : "border-beer-gold/30"
            }`}
            style={{
              boxShadow:
                mode === "wild"
                  ? "0 20px 60px -10px hsl(var(--accent) / 0.6)"
                  : "0 20px 60px -10px hsl(var(--beer-amber) / 0.4)",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Zamknij"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 text-beer-amber text-[10px] font-bold tracking-[0.2em] uppercase">
                <Sparkles className="h-3 w-3" />
                Mądrość Fisza
              </div>
              <button
                onClick={() => setView(view === "favorites" ? "current" : "favorites")}
                className="flex items-center gap-1 text-[10px] font-semibold text-beer-hop hover:text-beer-amber transition-colors"
                aria-label="Przełącz widok ulubionych"
              >
                <BookHeart className="h-3 w-3" />
                {view === "favorites" ? "Wróć" : `Ulubione (${favorites.length})`}
              </button>
            </div>

            <button
              onClick={toggleMode}
              className={`mb-3 flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                mode === "wild"
                  ? "border-accent/50 bg-accent/15 text-accent animate-pulse"
                  : "border-beer-hop/40 bg-beer-hop/10 text-beer-hop"
              }`}
              aria-label="Przełącz tryb humoru"
              title={mode === "wild" ? "Wyłącz tryb wariacki" : "Włącz tryb wariacki"}
            >
              {mode === "wild" ? (
                <>
                  <Flame className="h-3 w-3" /> Tryb: Wariacki 🔥
                </>
              ) : (
                <>
                  <Leaf className="h-3 w-3" /> Tryb: Spokojny 🍃
                </>
              )}
            </button>

            {view === "current" ? (
              <>
                <div className="mb-2 inline-block rounded-full bg-beer-hop/15 px-2 py-0.5 text-[10px] font-semibold text-beer-hop">
                  {labelFor(activeStyle)}
                </div>
                <p className="font-body text-sm leading-snug text-foreground min-h-[3rem]">{wisdom}</p>

                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      isLiked
                        ? "bg-beer-hop text-beer-foam"
                        : "bg-muted text-muted-foreground hover:bg-beer-hop/20 hover:text-beer-hop"
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Śmieszne
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDislike}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      isDisliked
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                    }`}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Nie moje
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSave}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      isFavorited
                        ? "bg-beer-amber text-beer-dark"
                        : "bg-muted text-muted-foreground hover:bg-beer-amber/20 hover:text-beer-amber"
                    }`}
                    aria-label="Zapisz do ulubionych"
                  >
                    <Heart className={`h-3 w-3 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Zapisane" : "Zapisz"}
                  </motion.button>
                  <button
                    onClick={() => reveal()}
                    className="ml-auto text-[11px] font-semibold text-beer-hop hover:text-beer-amber transition-colors"
                  >
                    🎲 Kolejna
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {favorites.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    Brak ulubionych. Zapisz mądrość sercem ❤️
                  </p>
                ) : (
                  favorites.map((f) => (
                    <div
                      key={f.savedAt}
                      className="group relative rounded-lg border border-border/60 bg-muted/40 p-2 pr-7"
                    >
                      <div className="text-[9px] font-bold uppercase tracking-wider text-beer-hop mb-0.5">
                        {labelFor(f.style as Style) ?? "Mądrość"}
                      </div>
                      <p className="text-xs leading-snug text-foreground">{f.text}</p>
                      <button
                        onClick={() => removeFavorite(f.text)}
                        className="absolute top-1.5 right-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        aria-label="Usuń z ulubionych"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-card/95 border-r border-b border-beer-gold/30" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={open ? () => setOpen(false) : () => reveal()}
        className="pointer-events-auto relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-beer-gold to-beer-amber text-beer-dark text-2xl shadow-xl border-2 border-beer-foam/30"
        whileHover={{ scale: 1.1, rotate: [0, -8, 8, -8, 0] }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
        aria-label="Mądrość Fisza"
        title="Kliknij, aby poznać mądrość Fisza dopasowaną do koszyka"
      >
        <span className="drop-shadow-sm">🐟</span>
        <span className="absolute -top-1 -right-1 text-base">🎩</span>
        {favorites.length > 0 && (
          <span className="absolute -bottom-1 -right-1 flex items-center justify-center h-5 min-w-5 rounded-full bg-beer-hop text-beer-foam text-[10px] font-bold px-1 border-2 border-background">
            {favorites.length}
          </span>
        )}
        <motion.span
          key={pulses}
          className="absolute inset-0 rounded-full border-2 border-beer-gold"
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </motion.button>
    </div>
  );
};

export default FiszWisdom;
