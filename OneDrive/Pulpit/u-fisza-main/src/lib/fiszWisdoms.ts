// Krótkie "Mądrości Fisza" do powiadomień o zamówieniach i wysyłkach.
// Trzymamy je centralnie, by można było ich używać w wielu miejscach.

export const ORDER_WISDOMS: string[] = [
  "Cierpliwość to chmiel duszy. 🍺",
  "Zamówione = już prawie wypite.",
  "Fisz odpalił grill i czeka na Twój toast.",
  'Każde dobre piwo zaczyna się od „kliknij kup".',
  "Pena opadła, sumienie spokojne. ✨",
  "Życie jest jak kufel — najlepsze na dnie.",
  "Fisz mówi: dobry wybór, łapa w górę! 🐟",
  "Zamówienie złożone — wszechświat się układa.",
  "Chmiel już szepcze Twoje imię.",
  "Tu się nie kupuje piwa — tu się kupuje wieczór.",
];

export const SHIPPING_WISDOMS: string[] = [
  "Twoja paczka płynie szybciej niż Fisz po drugim browarze. 🐟💨",
  "Kurier pedałuje, chmiel śpiewa.",
  "Schłodź lodówkę — jedzie towar!",
  "Paczka w drodze. Otwieracz na stół.",
  "Fisz osobiście pomachał kurierowi płetwą.",
  "Zegnij kolana, prostuj plecy — będzie ciężka i pyszna.",
  "Czas zmienia się w piankę. Już blisko.",
  "Kurier wie, że wiezie skarb. 👑🍺",
  "Lodówka, gotuj się — nadciąga legenda.",
  "Pena, piana, paczka. Trzy P sukcesu.",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const getOrderWisdom = () => pick(ORDER_WISDOMS);
export const getShippingWisdom = () => pick(SHIPPING_WISDOMS);

const pickStable = (arr: string[], seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
};

/**
 * Heurystyka: dobiera mądrość pasującą do treści powiadomienia.
 * - jeśli mowa o wysyłce/kurierze → SHIPPING
 * - w innych przypadkach (zamówienie złożone, status itp.) → ORDER
 * Gdy podany `seed` (np. id powiadomienia) — wynik jest stabilny.
 */
export const getWisdomForNotification = (
  title: string,
  message: string,
  type?: string,
  seed?: string,
) => {
  const text = `${title} ${message}`.toLowerCase();
  const isShipping =
    /wysył|wysłan|wysłał|kurier|paczka w drodz|w drodze|shipped|shipping|nadan/.test(text);
  const pool = isShipping
    ? SHIPPING_WISDOMS
    : type === "order" || /zamówieni|order/.test(text)
      ? ORDER_WISDOMS
      : null;
  if (!pool) return null;
  return seed ? pickStable(pool, seed) : pool[Math.floor(Math.random() * pool.length)];
};
