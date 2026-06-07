import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "kacztransit-favorites";

function readFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggle = useCallback((routeId: string) => {
    setFavorites((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
    );
  }, []);

  const isFavorite = useCallback(
    (routeId: string) => favorites.includes(routeId),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
