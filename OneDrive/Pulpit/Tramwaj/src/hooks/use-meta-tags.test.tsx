import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMetaTags } from "./use-meta-tags";

const getMeta = (selector: string) =>
  document.head.querySelector<HTMLMetaElement>(selector)?.getAttribute("content");

const getLink = (rel: string) =>
  document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)?.getAttribute("href");

describe("useMetaTags – Open Graph & Twitter Card for /route/:id", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  const routeMeta = {
    title: "Linia 1 – Potulicka → Głębokie | KaczTransit",
    description: "Potulicka → Głębokie · 28 przystanków. Rozkład jazdy linii 1 ZDiTM Szczecin w czasie rzeczywistym.",
    image: "https://example.com/og.png",
    url: "https://kacztrans.lovable.app/route/1",
    type: "article",
  };

  it("ustawia <title> oraz description", () => {
    renderHook(() => useMetaTags(routeMeta));
    expect(document.title).toBe(routeMeta.title);
    expect(getMeta('meta[name="description"]')).toBe(routeMeta.description);
  });

  it("ustawia tagi Open Graph", () => {
    renderHook(() => useMetaTags(routeMeta));
    expect(getMeta('meta[property="og:title"]')).toBe(routeMeta.title);
    expect(getMeta('meta[property="og:description"]')).toBe(routeMeta.description);
    expect(getMeta('meta[property="og:image"]')).toBe(routeMeta.image);
    expect(getMeta('meta[property="og:url"]')).toBe(routeMeta.url);
    expect(getMeta('meta[property="og:type"]')).toBe("article");
  });

  it("ustawia tagi Twitter Card", () => {
    renderHook(() => useMetaTags(routeMeta));
    expect(getMeta('meta[name="twitter:title"]')).toBe(routeMeta.title);
    expect(getMeta('meta[name="twitter:description"]')).toBe(routeMeta.description);
    expect(getMeta('meta[name="twitter:image"]')).toBe(routeMeta.image);
    expect(getMeta('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(getMeta('meta[name="twitter:site"]')).toBe("@kacztransit");
  });

  it("ustawia og:site_name oraz og:locale", () => {
    renderHook(() => useMetaTags(routeMeta));
    expect(getMeta('meta[property="og:site_name"]')).toBe("KaczTransit");
    expect(getMeta('meta[property="og:locale"]')).toBe("pl_PL");
  });

  it("ustawia canonical link dla URL trasy", () => {
    renderHook(() => useMetaTags(routeMeta));
    expect(getLink("canonical")).toBe(routeMeta.url);
  });

  it("nie duplikuje tagów przy ponownym renderze", () => {
    const { rerender } = renderHook((p: typeof routeMeta) => useMetaTags(p), {
      initialProps: routeMeta,
    });
    rerender({ ...routeMeta, title: "Linia 2 – A → B | KaczTransit" });
    expect(document.head.querySelectorAll('meta[property="og:title"]').length).toBe(1);
    expect(getMeta('meta[property="og:title"]')).toBe("Linia 2 – A → B | KaczTransit");
  });
});

describe("useMetaTags – bezpieczne domyślne dla nieistniejącego /route/:id", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
  });

  // Symuluje wywołanie hooka tak jak robi to RoutePage gdy route === null:
  // tylko title="KaczTransit", brak description/url/image, type domyślny.
  const fallbackMeta = { title: "KaczTransit" };

  const routeMetaForTransition = {
    title: "Linia 1 – Potulicka → Głębokie | KaczTransit",
    description: "Potulicka → Głębokie · 28 przystanków.",
    url: "https://kacztrans.lovable.app/route/1",
    type: "article",
  };

  it("ustawia bezpieczny tytuł fallback", () => {
    renderHook(() => useMetaTags(fallbackMeta));
    expect(document.title).toBe("KaczTransit");
  });

  it("nie tworzy tagów description / og:description / twitter:description", () => {
    renderHook(() => useMetaTags(fallbackMeta));
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:description"]')).toBeNull();
    expect(document.head.querySelector('meta[name="twitter:description"]')).toBeNull();
  });

  it("nie tworzy canonical ani og:url gdy URL nie jest znany", () => {
    renderHook(() => useMetaTags(fallbackMeta));
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
  });

  it("nie tworzy tagów image gdy brak obrazu", () => {
    renderHook(() => useMetaTags(fallbackMeta));
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.head.querySelector('meta[name="twitter:image"]')).toBeNull();
  });

  it("ustawia og:type na domyślny website", () => {
    renderHook(() => useMetaTags(fallbackMeta));
    expect(getMeta('meta[property="og:type"]')).toBe("website");
  });

  it("nie generuje duplikatów tagów po wielokrotnych re-renderach", () => {
    const { rerender } = renderHook((p: { title?: string }) => useMetaTags(p), {
      initialProps: fallbackMeta,
    });
    rerender({ title: "KaczTransit" });
    rerender({ title: "KaczTransit – 404" });
    rerender({ title: "KaczTransit" });

    const selectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'meta[property="og:type"]',
      'meta[property="og:url"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:card"]',
      'link[rel="canonical"]',
    ];
    for (const sel of selectors) {
      expect(document.head.querySelectorAll(sel).length).toBeLessThanOrEqual(1);
    }
  });

  it("przejście z trasy istniejącej do fallback aktualizuje tytuł bez duplikatów og:title", () => {
    const { rerender } = renderHook(
      (p: Parameters<typeof useMetaTags>[0]) => useMetaTags(p),
      { initialProps: routeMetaForTransition }
    );
    rerender({ title: "KaczTransit" });
    expect(document.title).toBe("KaczTransit");
    expect(document.head.querySelectorAll('meta[property="og:title"]').length).toBe(1);
    expect(getMeta('meta[property="og:title"]')).toBe("KaczTransit");
  });
});
