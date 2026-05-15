export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  condition: 'nowy' | 'jak nowy' | 'dobry' | 'używany';
  location: string;
  seller: string;
  sellerAvatar: string;
  description: string;
  createdAt: string;
  isFavorite?: boolean;
  isPromoted?: boolean;
}

export interface CategoryData {
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export const categoryData: CategoryData[] = [
  {
    name: 'Elektronika',
    icon: 'Smartphone',
    color: 'from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400',
    subcategories: ['Telefony', 'Laptopy', 'Tablety', 'Słuchawki', 'Aparaty', 'TV i Audio', 'Akcesoria'],
  },
  {
    name: 'Moda',
    icon: 'Shirt',
    color: 'from-pink-500/20 to-pink-600/10 text-pink-600 dark:text-pink-400',
    subcategories: ['Damska', 'Męska', 'Dziecięca', 'Buty', 'Torebki', 'Zegarki', 'Biżuteria'],
  },
  {
    name: 'Dom i Ogród',
    icon: 'Home',
    color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400',
    subcategories: ['Meble', 'Dekoracje', 'Narzędzia', 'Ogród', 'Kuchnia', 'Łazienka', 'Oświetlenie'],
  },
  {
    name: 'Sport',
    icon: 'Dumbbell',
    color: 'from-orange-500/20 to-orange-600/10 text-orange-600 dark:text-orange-400',
    subcategories: ['Fitness', 'Rowery', 'Bieganie', 'Sporty zimowe', 'Piłka nożna', 'Siłownia'],
  },
  {
    name: 'Motoryzacja',
    icon: 'Car',
    color: 'from-red-500/20 to-red-600/10 text-red-600 dark:text-red-400',
    subcategories: ['Samochody', 'Motocykle', 'Części', 'Opony', 'Akcesoria', 'Narzędzia'],
  },
  {
    name: 'Książki',
    icon: 'BookOpen',
    color: 'from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400',
    subcategories: ['Beletrystyka', 'Naukowe', 'Podręczniki', 'Komiksy', 'Poradniki', 'Dla dzieci'],
  },
  {
    name: 'Zabawki',
    icon: 'Gamepad2',
    color: 'from-purple-500/20 to-purple-600/10 text-purple-600 dark:text-purple-400',
    subcategories: ['Gry planszowe', 'Klocki', 'Lalki', 'Puzzle', 'Edukacyjne', 'Zdalnie sterowane'],
  },
  {
    name: 'Muzyka',
    icon: 'Music',
    color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-600 dark:text-indigo-400',
    subcategories: ['Gitary', 'Klawiszowe', 'Perkusja', 'Dęte', 'DJ', 'Akcesoria'],
  },
];

export const categories = categoryData.map(c => c.name);

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'iPhone 13 Pro 256GB Grafitowy',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1632661674596-df8be86a1e4a?w=400&h=400&fit=crop',
    category: 'Elektronika',
    condition: 'jak nowy',
    location: 'Warszawa',
    seller: 'TechMarek',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop',
    description: 'Telefon w idealnym stanie, używany z etui i folią. Komplet z pudełkiem, ładowarką i słuchawkami.',
    createdAt: '2024-03-15',
  },
  {
    id: '2',
    title: 'Kurtka zimowa The North Face L',
    price: 350,
    image: 'https://images.unsplash.com/photo-1544923246-77307dd270cf?w=400&h=400&fit=crop',
    category: 'Moda',
    condition: 'dobry',
    location: 'Kraków',
    seller: 'AnnaStyle',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
    description: 'Ciepła kurtka zimowa, noszona jeden sezon. Bez śladów użytkowania.',
    createdAt: '2024-03-14',
  },
  {
    id: '3',
    title: 'Konsola PlayStation 5 + 2 pady',
    price: 1899,
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=400&fit=crop',
    category: 'Elektronika',
    condition: 'jak nowy',
    location: 'Wrocław',
    seller: 'GamerPiotr',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    description: 'PS5 w wersji z napędem, 2 kontrolery DualSense. Stan idealny.',
    createdAt: '2024-03-13',
  },
  {
    id: '4',
    title: 'Rower górski Trek Marlin 7',
    price: 2200,
    image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=400&fit=crop',
    category: 'Sport',
    condition: 'dobry',
    location: 'Gdańsk',
    seller: 'SportowySeba',
    sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
    description: 'Rower górski Trek Marlin 7, rama M, koła 29". Przegląd zrobiony.',
    createdAt: '2024-03-12',
  },
  {
    id: '5',
    title: 'Sofa narożna IKEA Kivik szara',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    category: 'Dom i Ogród',
    condition: 'używany',
    location: 'Poznań',
    seller: 'DomowaMarta',
    sellerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop',
    description: 'Wygodna sofa narożna, idealna do salonu. Pokrowce prane.',
    createdAt: '2024-03-11',
  },
  {
    id: '6',
    title: 'MacBook Air M2 2022 256GB',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    category: 'Elektronika',
    condition: 'jak nowy',
    location: 'Warszawa',
    seller: 'AppleFan',
    sellerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
    description: 'MacBook Air M2 w kolorze Midnight. 8GB RAM, 256GB SSD. Gwarancja do 2025.',
    createdAt: '2024-03-10',
  },
  {
    id: '7',
    title: 'Gitara akustyczna Yamaha FG800',
    price: 650,
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop',
    category: 'Muzyka',
    condition: 'dobry',
    location: 'Łódź',
    seller: 'MuzykJanek',
    sellerAvatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop',
    description: 'Świetna gitara akustyczna dla początkujących i średniozaawansowanych. Z pokrowcem.',
    createdAt: '2024-03-09',
  },
  {
    id: '8',
    title: 'Nike Air Max 90 r.43 białe',
    price: 280,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    category: 'Moda',
    condition: 'jak nowy',
    location: 'Katowice',
    seller: 'SneakerHead',
    sellerAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?w=80&h=80&fit=crop',
    description: 'Buty Nike Air Max 90, noszone 2 razy. Stan idealny, z pudełkiem.',
    createdAt: '2024-03-08',
  },
];
