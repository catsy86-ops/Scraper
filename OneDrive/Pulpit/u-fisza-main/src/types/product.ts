export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "piwo" | "wino" | "wódka" | "inne";
  abv: number;
  funFact: string;
}
