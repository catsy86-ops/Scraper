import { create } from "zustand";
import { toast } from "sonner";
import type { Product } from "@/types/product";

interface CartItem {
  product: Product;
  quantity: number;
}

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string;
  minTotal?: number;
  /** Optional expiration timestamp (epoch ms). Coupon stops working after this time. */
  expiresAt?: number;
  /** Max number of uses across all users (stored in localStorage). */
  maxUsage?: number;
}

const getCouponUsage = (code: string): number => {
  try {
    const raw = localStorage.getItem("fisz_coupon_usage");
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    return map[code] ?? 0;
  } catch { return 0; }
};

const incrementCouponUsage = (code: string) => {
  try {
    const raw = localStorage.getItem("fisz_coupon_usage");
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[code] = (map[code] ?? 0) + 1;
    localStorage.setItem("fisz_coupon_usage", JSON.stringify(map));
  } catch { /* noop */ }
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const AVAILABLE_COUPONS: Coupon[] = [
  { code: "FISZ10", type: "percent", value: 10, description: "10% rabatu na całe zamówienie" },
  { code: "BEER20", type: "percent", value: 20, description: "20% rabatu (od 80 zł)", minTotal: 80, expiresAt: Date.now() + 7 * DAY },
  { code: "WELCOME", type: "fixed", value: 15, description: "15 zł zniżki dla nowych", minTotal: 50, expiresAt: Date.now() + 3 * DAY },
  { code: "PIWOSZ50", type: "percent", value: 50, description: "50% rabatu (od 200 zł)", minTotal: 200, expiresAt: Date.now() + 6 * HOUR },
  { code: "HAPPYHOUR", type: "percent", value: 15, description: "Happy hour: 15% przez 2h!", expiresAt: Date.now() + 2 * HOUR },
  { code: "RYBKA", type: "percent", value: 1, description: "Fisz jest oszczędny... 1% zniżki 🐟💸" },
  { code: "PONIEDZIALEK", type: "percent", value: 5, description: "Współczujemy poniedziałku, masz 5% zniżki 😔", minTotal: 30 },
  { code: "JESTEMFISZEM", type: "percent", value: 100, description: "JESTEŚ FISZEM?! 100% ZNIŻKI! 🎩👑", minTotal: 1000 },
  { code: "PIATUNIO", type: "fixed", value: 13, description: "Fisz mówi: 13 to szczęśliwa liczba! 🍀", minTotal: 66 },
  { code: "FISZOWO", type: "percent", value: 12, description: "12% rabatu imieniny Fisza! (codziennie) 🎂🐟" },
  { code: "STUDENT", type: "fixed", value: 5, description: "5 zł mniej, bo Fisz pamięta czasy studenckie 🎓", maxUsage: 3 },
];

export type InvalidationReason = "minTotal" | "expired" | "emptyCart";

export interface InvalidatedCoupon {
  coupon: Coupon;
  reason: InvalidationReason;
  /** subtotal at the moment of invalidation (for context) */
  subtotalAtInvalidation: number;
  at: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  coupon: Coupon | null;
  lastInvalidated: InvalidatedCoupon | null;
  removalStreak: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  validateCoupon: () => void;
  dismissInvalidated: () => void;
  reapplyLastInvalidated: () => { ok: boolean; message: string };
  markCouponUsed: () => void;
  subtotal: () => number;
  discount: () => number;
  total: () => number;
  itemCount: () => number;
}

const calcSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

export const useCartStore = create<CartStore>((set, get) => {
  // Auto-validate the active coupon. Removes the coupon (with toast) and stores
  // an "invalidated" record so the UI can show a banner with reason + reapply CTA.
  const validate = () => {
    const { coupon, items } = get();
    if (!coupon) return;
    const sub = calcSubtotal(items);
    if (items.length === 0) {
      set({
        coupon: null,
        lastInvalidated: { coupon, reason: "emptyCart", subtotalAtInvalidation: 0, at: Date.now() },
      });
      return;
    }
    if (coupon.expiresAt && Date.now() >= coupon.expiresAt) {
      set({
        coupon: null,
        lastInvalidated: { coupon, reason: "expired", subtotalAtInvalidation: sub, at: Date.now() },
      });
      toast.warning(`Kod ${coupon.code} wygasł i został usunięty z koszyka ⏰`);
      return;
    }
    if (coupon.minTotal && sub < coupon.minTotal) {
      set({
        coupon: null,
        lastInvalidated: { coupon, reason: "minTotal", subtotalAtInvalidation: sub, at: Date.now() },
      });
      const missing = (coupon.minTotal - sub).toFixed(2);
      toast.warning(
        `Kod ${coupon.code} został usunięty — wymaga min. ${coupon.minTotal} zł (brakuje ${missing} zł)`
      );
    }
  };

  return {
    items: [],
    isOpen: false,
    coupon: null,
    lastInvalidated: null,
    removalStreak: 0,
    addItem: (product) => {
      set((state) => {
        const existing = state.items.find((i) => i.product.id === product.id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            removalStreak: 0,
          };
        }
        return { items: [...state.items, { product, quantity: 1 }], removalStreak: 0 };
      });
      validate();
    },
    removeItem: (productId) => {
      set((state) => {
        const streak = state.removalStreak + 1;
        const item = state.items.find((i) => i.product.id === productId);
        const name = item?.product.name ?? "Produkt";
        if (streak === 1) {
          toast("Fisz rozumie...", { description: `Usunięto ${name}`, duration: 2500 });
        } else if (streak === 2) {
          toast("Fisz się martwi...", { description: `Kolejny produkt znika...`, duration: 2500 });
        } else if (streak === 3) {
          toast.error("FISZ PŁACZE POD KAPELUSZEM! 😭🎩", { description: "Zostaw chociaż jedno piwo!", duration: 3500 });
        } else {
          toast.error("FISZ ZWĄTPIŁ W LUDZKOŚĆ 💔", { description: `Streak usuwania: ${streak}...`, duration: 4000 });
        }
        return {
          items: state.items.filter((i) => i.product.id !== productId),
          removalStreak: streak,
        };
      });
      validate();
    },
    updateQuantity: (productId, quantity) => {
      set((state) => ({
        items:
          quantity <= 0
            ? state.items.filter((i) => i.product.id !== productId)
            : state.items.map((i) =>
                i.product.id === productId ? { ...i, quantity } : i
              ),
      }));
      validate();
    },
    clearCart: () => set({ items: [], coupon: null, lastInvalidated: null }),
    toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    applyCoupon: (code) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return { ok: false, message: "Wpisz kod rabatowy" };
      const found = AVAILABLE_COUPONS.find((c) => c.code === normalized);
      if (!found) return { ok: false, message: "Nieprawidłowy kod rabatowy" };
      if (found.expiresAt && Date.now() >= found.expiresAt) {
        return { ok: false, message: `Kod ${found.code} wygasł ⏰` };
      }
      if (found.maxUsage !== undefined && getCouponUsage(found.code) >= found.maxUsage) {
        return { ok: false, message: `Kod ${found.code} został już wykorzystany maksymalną liczbę razy 😢` };
      }
      const sub = get().subtotal();
      if (found.minTotal && sub < found.minTotal) {
        return { ok: false, message: `Minimalna kwota: ${found.minTotal} zł` };
      }
      set({ coupon: found, lastInvalidated: null });
      // Defensive re-validation in case state changed between checks.
      validate();
      return { ok: true, message: `Kod "${found.code}" aktywowany! 🎉` };
    },
    removeCoupon: () => set({ coupon: null, lastInvalidated: null }),
    validateCoupon: validate,
    dismissInvalidated: () => set({ lastInvalidated: null }),
    reapplyLastInvalidated: () => {
      const inv = get().lastInvalidated;
      if (!inv) return { ok: false, message: "Brak kodu do przywrócenia" };
      return get().applyCoupon(inv.coupon.code);
    },
    markCouponUsed: () => {
      const { coupon } = get();
      if (coupon?.maxUsage !== undefined) {
        incrementCouponUsage(coupon.code);
      }
    },
    subtotal: () => calcSubtotal(get().items),
    discount: () => {
      const { coupon } = get();
      const sub = calcSubtotal(get().items);
      if (!coupon) return 0;
      if (coupon.expiresAt && Date.now() >= coupon.expiresAt) return 0;
      if (coupon.minTotal && sub < coupon.minTotal) return 0;
      if (coupon.type === "percent") return +(sub * (coupon.value / 100)).toFixed(2);
      return Math.min(coupon.value, sub);
    },
    total: () => Math.max(0, get().subtotal() - get().discount()),
    itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  };
});
