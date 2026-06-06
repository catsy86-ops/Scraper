import type { Product } from "@/types/product";
import vipBeer1 from "@/assets/vip-beer-1.png";
import vipBeer2 from "@/assets/vip-beer-2.png";
import vipBeer3 from "@/assets/vip-beer-3.png";

export const vipProducts: Product[] = [
  {
    id: "vip-1",
    name: "Złota Esencja Fisza",
    description: "Legendarne piwo z sekretnym składnikiem Fisza. Złociste, tajemnicze, niepowtarzalne.",
    price: 24.99,
    image: vipBeer1,
    category: "piwo",
    abv: 6.9,
    funFact: "Sekretny składnik jest przekazywany z pokolenia na pokolenie rybich mistrzów! 🐟✨",
  },
  {
    id: "vip-2",
    name: "Mroczny Sekret Fisza",
    description: "Ciemne piwo z podwójną dawką sekretnego składnika. Tylko dla odważnych VIP-ów.",
    price: 29.99,
    image: vipBeer2,
    category: "piwo",
    abv: 8.5,
    funFact: "Kto wypije trzy, ten zobaczy samego Fisza tańczącego na falach! 🌊🐟",
  },
  {
    id: "vip-3",
    name: "Kryształowy Eliksir Fisza",
    description: "Limitowana edycja. Piwo tak ekskluzywne, że butelki są numerowane.",
    price: 34.99,
    image: vipBeer3,
    category: "piwo",
    abv: 7.7,
    funFact: "Każda butelka jest błogosławiona przez Fisza osobiście! 👑🐟",
  },
];
