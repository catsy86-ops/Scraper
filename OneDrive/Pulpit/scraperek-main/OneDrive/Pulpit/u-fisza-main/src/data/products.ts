import type { Product } from "@/types/product";
import beerLager from "@/assets/beer-lager.png";
import beerIpa from "@/assets/beer-ipa.png";
import beerStout from "@/assets/beer-stout.png";
import beerWheat from "@/assets/beer-wheat.png";
import beerViking from "@/assets/beer-viking.png";
import beerSour from "@/assets/beer-sour.png";
import wineRed from "@/assets/wine-red.png";
import vodka from "@/assets/vodka.png";
import whisky from "@/assets/whisky.png";
import bourbon from "@/assets/bourbon.png";
import liqueurGreen from "@/assets/liqueur-green.png";
import liqueurCherry from "@/assets/liqueur-cherry.png";

export const products: Product[] = [
  {
    id: "1",
    name: "Złoty Fisz Lager",
    description: "Klasyczny lager, złocisty jak zachód słońca nad stawem pełnym ryb.",
    price: 8.99,
    image: beerLager,
    category: "piwo",
    abv: 5.0,
    funFact: "Ten lager jest tak dobry, że nawet ryby wychodzą z wody żeby go spróbować! 🐟",
  },
  {
    id: "2",
    name: "Hipster IPA",
    description: "Chmielowe szaleństwo z wąsem i okularami. Zanim było modne.",
    price: 12.99,
    image: beerIpa,
    category: "piwo",
    abv: 6.5,
    funFact: "Piłem IPA zanim to było cool. Teraz jest ciepłe. 🕶️",
  },
  {
    id: "3",
    name: "Mroczny Stout Boarthu",
    description: "Ciemny jak noc, mocny jak niedźwiedź. Z nutą czekolady i gniewu.",
    price: 14.99,
    image: beerStout,
    category: "piwo",
    abv: 7.2,
    funFact: "Nie patrz mu w oczy. On nie lubi gdy na niego patrzysz. 😠",
  },
  {
    id: "4",
    name: "Pszeniczny Siłacz",
    description: "Piwo pszeniczne, które chodzi na siłownię. Białko w każdym łyku.",
    price: 10.99,
    image: beerWheat,
    category: "piwo",
    abv: 4.8,
    funFact: "Jedyne piwo z licencjonowanym trenerem personalnym 💪",
  },
  {
    id: "5",
    name: "Wiking Amber Ale",
    description: "Bursztynowe piwo w hełmie wikinga. Smakiem podbija nowe lądy!",
    price: 11.99,
    image: beerViking,
    category: "piwo",
    abv: 5.8,
    funFact: "SKÅL! To piwo zdobyło już 3 kontynenty i 2 lodówki 🪓",
  },
  {
    id: "6",
    name: "Kwaśny Cytrynek",
    description: "Sour ale z miną tak kwaśną, że aż ci się usta złożą w dziubek.",
    price: 13.49,
    image: beerSour,
    category: "piwo",
    abv: 4.2,
    funFact: "Ostrzeżenie: po wypiciu twarz może pozostać w pozycji 'cytrynka' na 5 minut 🍋",
  },
  {
    id: "7",
    name: "Wino Kowboj",
    description: "Czerwone wino w kowbojskim kapeluszu. Yeehaw w każdym kieliszku!",
    price: 29.99,
    image: wineRed,
    category: "wino",
    abv: 13.5,
    funFact: "To wino przeszło Dziki Zachód i wróciło! 🤠",
  },
  {
    id: "8",
    name: "Wódka Góralska",
    description: "Czysta jak górski potok, mocna jak góralska tradycja. Na zdrowie!",
    price: 39.99,
    image: vodka,
    category: "wódka",
    abv: 40.0,
    funFact: "Oficjalnie zatwierdzona przez góralskich duchów! 🏔️",
  },
  {
    id: "9",
    name: "Whisky Dżentelmen",
    description: "Single malt z monoklą i muszką. Dla prawdziwych koneserów.",
    price: 89.99,
    image: whisky,
    category: "inne",
    abv: 43.0,
    funFact: "Ta whisky ma lepsze maniery niż większość ludzi na imprezie 🎩",
  },
  {
    id: "10",
    name: "Bourbon Szeryf",
    description: "Bourbon z odznaką szeryfa. Utrzymuje porządek w barze od 1849.",
    price: 69.99,
    image: bourbon,
    category: "inne",
    abv: 45.0,
    funFact: "Wanted: Dead or Alive. Najlepiej on the rocks 🌵",
  },
  {
    id: "11",
    name: "Zielony Tancerz",
    description: "Likier ziołowy, który nie może przestać tańczyć. 42 zioła w jednej butelce!",
    price: 54.99,
    image: liqueurGreen,
    category: "inne",
    abv: 35.0,
    funFact: "Po jednym kieliszku ty też będziesz tańczyć jak on 💃",
  },
  {
    id: "12",
    name: "Wiśniówka Kawaii",
    description: "Najsłodszy likier wiśniowy. Tak uroczy, że aż szkoda pić!",
    price: 34.99,
    image: liqueurCherry,
    category: "inne",
    abv: 18.0,
    funFact: "Uwaga: może powodować niekontrolowane mówienie 'kawaii!' po każdym łyku 🍒",
  },
];
