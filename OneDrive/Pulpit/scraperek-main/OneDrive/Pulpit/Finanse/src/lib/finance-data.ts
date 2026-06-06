export type Transaction = {
  id: string;
  date: string; // ISO
  title: string;
  category: string;
  amount: number; // PLN, negative = wydatek
  recurring?: boolean;
};

export type Subscription = {
  id: string;
  name: string;
  monthly: number;
  category: string;
  alternative?: { name: string; price: number };
};

export const subscriptions: Subscription[] = [
  { id: "s1", name: "Netflix Premium", monthly: 67, category: "Rozrywka", alternative: { name: "Plan podstawowy", price: 29 } },
  { id: "s2", name: "Spotify Family", monthly: 29.99, category: "Muzyka", alternative: { name: "Spotify Duo", price: 19.99 } },
  { id: "s3", name: "Siłownia FitPlus", monthly: 149, category: "Zdrowie", alternative: { name: "MultiSport", price: 99 } },
  { id: "s4", name: "iCloud 2TB", monthly: 44.99, category: "Chmura", alternative: { name: "iCloud 200GB", price: 11.99 } },
  { id: "s5", name: "Disney+", monthly: 28.99, category: "Rozrywka" },
  { id: "s6", name: "Operator GSM", monthly: 89, category: "Telefon", alternative: { name: "Tańszy plan MVNO", price: 35 } },
  { id: "s7", name: "Internet domowy", monthly: 99, category: "Internet", alternative: { name: "Konkurencja", price: 69 } },
];

export const monthlyTrend = [
  { month: "Sty", przychody: 8500, wydatki: 6200, oszczednosci: 2300 },
  { month: "Lut", przychody: 8500, wydatki: 5800, oszczednosci: 2700 },
  { month: "Mar", przychody: 8900, wydatki: 6500, oszczednosci: 2400 },
  { month: "Kwi", przychody: 8500, wydatki: 5400, oszczednosci: 3100 },
  { month: "Maj", przychody: 9200, wydatki: 5900, oszczednosci: 3300 },
  { month: "Cze", przychody: 8500, wydatki: 5100, oszczednosci: 3400 },
];

export const categoryBreakdown = [
  { name: "Mieszkanie", value: 2400, color: "var(--chart-1)" },
  { name: "Jedzenie", value: 1350, color: "var(--chart-2)" },
  { name: "Transport", value: 620, color: "var(--chart-3)" },
  { name: "Subskrypcje", value: 508, color: "var(--chart-4)" },
  { name: "Rozrywka", value: 420, color: "var(--chart-5)" },
];

export const recentTransactions: Transaction[] = [
  { id: "t1", date: "2026-04-29", title: "Biedronka", category: "Jedzenie", amount: -127.45 },
  { id: "t2", date: "2026-04-28", title: "Wynagrodzenie", category: "Przychód", amount: 8500 },
  { id: "t3", date: "2026-04-27", title: "Netflix", category: "Subskrypcje", amount: -67, recurring: true },
  { id: "t4", date: "2026-04-26", title: "Orlen — paliwo", category: "Transport", amount: -245.8 },
  { id: "t5", date: "2026-04-25", title: "Allegro", category: "Zakupy", amount: -89.99 },
  { id: "t6", date: "2026-04-24", title: "Restauracja Sopot", category: "Jedzenie", amount: -154 },
  { id: "t7", date: "2026-04-23", title: "Spotify", category: "Subskrypcje", amount: -29.99, recurring: true },
];

export const formatPLN = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(n);
