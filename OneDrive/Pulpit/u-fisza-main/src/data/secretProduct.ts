import type { Product } from "@/types/product";
import secretBeer from "@/assets/beer-stout.png"; // reuse existing image

const LS_SECRET_CLICKS = "fisz_secret_clicks";
const NIGHT_START = 23;
const NIGHT_END = 4;

export const getSecretClicks = (): number => {
  try {
    return parseInt(localStorage.getItem(LS_SECRET_CLICKS) || "0", 10) || 0;
  } catch { return 0; }
};

export const addSecretClick = (): number => {
  const next = getSecretClicks() + 1;
  try { localStorage.setItem(LS_SECRET_CLICKS, String(next)); } catch { /* noop */ }
  return next;
};

export const isSecretUnlocked = (): boolean => {
  const clicks = getSecretClicks();
  const hour = new Date().getHours();
  const isNight = hour >= NIGHT_START || hour < NIGHT_END;
  return clicks >= 10 || isNight;
};

export const SECRET_PRODUCT: Product = {
  id: "secret-fisz-666",
  name: "Szatański Stout Fisza 👁️",
  description: "Ciemny stout z ognistą duszą i tajemniczym blaskiem. Warzony tylko o północy przez samego Fisza. Osoby postronne mogą ujrzeć kapelusz z rogami.",
  price: 66.66,
  image: secretBeer,
  category: "piwo",
  abv: 16.6,
  funFact: "Podobno każda butelka jest ochrzczona w wodzie ze stawu, gdzie Fisz uczył się pływać pod prąd. Smak piekielnie dobry! 🔥🐟",
};
