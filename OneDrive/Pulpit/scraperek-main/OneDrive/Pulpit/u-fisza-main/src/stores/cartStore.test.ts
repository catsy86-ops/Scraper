import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "./cartStore";
import type { Product } from "@/types/product";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const mkProduct = (id: string, price: number): Product => ({
  id,
  name: `Beer ${id}`,
  description: "test",
  price,
  image: "",
  category: "piwo",
  abv: 5,
  funFact: "",
});

const reset = () =>
  useCartStore.setState({ items: [], coupon: null, lastInvalidated: null, isOpen: false });

describe("cartStore — coupon validation on quantity changes", () => {
  beforeEach(() => reset());

  it("invalidates a minTotal coupon when quantity drops below threshold", () => {
    const p = mkProduct("p1", 30); // 3x = 90, below 100
    const { addItem, applyCoupon, updateQuantity } = useCartStore.getState();
    addItem(p);
    addItem(p);
    addItem(p);
    addItem(p); // 4x30 = 120
    const r = applyCoupon("WELCOME"); // minTotal 50, fixed 15
    expect(r.ok).toBe(true);
    expect(useCartStore.getState().coupon?.code).toBe("WELCOME");

    // Drop to 1x30 = 30 < 50
    updateQuantity("p1", 1);
    const s = useCartStore.getState();
    expect(s.coupon).toBeNull();
    expect(s.lastInvalidated?.reason).toBe("minTotal");
    expect(s.lastInvalidated?.coupon.code).toBe("WELCOME");
    expect(s.lastInvalidated?.subtotalAtInvalidation).toBe(30);
  });

  it("invalidates with reason emptyCart when removing all items", () => {
    const p = mkProduct("p1", 60);
    const { addItem, applyCoupon, removeItem } = useCartStore.getState();
    addItem(p);
    applyCoupon("WELCOME");
    removeItem("p1");
    const s = useCartStore.getState();
    expect(s.coupon).toBeNull();
    expect(s.lastInvalidated?.reason).toBe("emptyCart");
  });

  it("keeps coupon active while threshold is still met", () => {
    const p = mkProduct("p1", 60);
    const { addItem, applyCoupon, updateQuantity } = useCartStore.getState();
    addItem(p);
    addItem(p); // 120
    applyCoupon("WELCOME"); // minTotal 50
    updateQuantity("p1", 1); // 60 still >= 50
    expect(useCartStore.getState().coupon?.code).toBe("WELCOME");
  });

  it("discount() returns 0 when coupon is invalidated", () => {
    const p = mkProduct("p1", 60);
    const { addItem, applyCoupon, updateQuantity, discount } = useCartStore.getState();
    addItem(p);
    applyCoupon("WELCOME");
    updateQuantity("p1", 0); // empties cart
    expect(discount()).toBe(0);
  });
});

describe("cartStore — reapplyLastInvalidated", () => {
  beforeEach(() => reset());

  it("reapplies coupon when threshold is reached again", () => {
    const p = mkProduct("p1", 30);
    const { addItem, applyCoupon, updateQuantity, reapplyLastInvalidated } =
      useCartStore.getState();
    addItem(p);
    addItem(p); // 60
    applyCoupon("WELCOME"); // minTotal 50
    updateQuantity("p1", 1); // 30 -> invalidated
    expect(useCartStore.getState().coupon).toBeNull();

    updateQuantity("p1", 3); // 90 >= 50
    const r = reapplyLastInvalidated();
    expect(r.ok).toBe(true);
    const s = useCartStore.getState();
    expect(s.coupon?.code).toBe("WELCOME");
    expect(s.lastInvalidated).toBeNull();
  });

  it("fails to reapply when threshold is still not met", () => {
    const p = mkProduct("p1", 30);
    const { addItem, applyCoupon, updateQuantity, reapplyLastInvalidated } =
      useCartStore.getState();
    addItem(p);
    addItem(p); // 60
    applyCoupon("WELCOME");
    updateQuantity("p1", 1); // 30 -> invalidated
    const r = reapplyLastInvalidated();
    expect(r.ok).toBe(false);
    expect(useCartStore.getState().coupon).toBeNull();
  });

  it("returns error when there is no invalidated coupon to reapply", () => {
    const r = useCartStore.getState().reapplyLastInvalidated();
    expect(r.ok).toBe(false);
  });

  it("dismissInvalidated clears the invalidated record", () => {
    const p = mkProduct("p1", 30);
    const { addItem, applyCoupon, updateQuantity, dismissInvalidated } =
      useCartStore.getState();
    addItem(p);
    addItem(p);
    applyCoupon("WELCOME");
    updateQuantity("p1", 1);
    expect(useCartStore.getState().lastInvalidated).not.toBeNull();
    dismissInvalidated();
    expect(useCartStore.getState().lastInvalidated).toBeNull();
  });
});
