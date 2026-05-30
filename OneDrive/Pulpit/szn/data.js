// ===== DANE APLIKACJI =====
// Centrum obszaru: ul. Łucznicza / Tarczowa, Szczecin
// Współrzędne: ~53.4025, 14.5520

const APP_DATA = {

  center: [14.5520, 53.4025],

  // ===== MIEJSCA =====
  places: [
    {
      id: 1, cat: 'sport',
      name: 'Boisko Sportowe Łucznicza',
      addr: 'ul. Łucznicza, Szczecin',
      emoji: '⚽',
      desc: 'Ogólnodostępne boisko do piłki nożnej i koszykówki. Idealne miejsce dla aktywnych mieszkańców dzielnicy. Oświetlone wieczorami.',
      hours: 'Całą dobę',
      phone: null,
      website: null,
      coords: [14.5510, 53.4030],
      rating: 4.2,
      tags: ['boisko', 'piłka nożna', 'koszykówka', 'bezpłatne']
    },
    {
      id: 2, cat: 'park',
      name: 'Skwer przy Tarczowej',
      addr: 'ul. Tarczowa, Szczecin',
      emoji: '🌳',
      desc: 'Zielony skwer z ławkami i alejkami spacerowymi. Popularne miejsce odpoczynku dla rodzin z dziećmi. Plac zabaw w pobliżu.',
      hours: 'Całą dobę',
      phone: null,
      website: null,
      coords: [14.5535, 53.4018],
      rating: 4.5,
      tags: ['park', 'spacer', 'relaks', 'dzieci']
    },
    {
      id: 3, cat: 'shop',
      name: 'Sklep Spożywczy',
      addr: 'ul. Łucznicza 45, Szczecin',
      emoji: '🛒',
      desc: 'Lokalny sklep spożywczy z szerokim asortymentem produktów codziennego użytku. Świeże pieczywo każdego ranka.',
      hours: '6:00–22:00',
      phone: '+48 91 XXX XXX',
      website: null,
      coords: [14.5505, 53.4022],
      rating: 4.0,
      tags: ['sklep', 'spożywczy', 'pieczywo']
    },
    {
      id: 4, cat: 'food',
      name: 'Bar Mleczny "Strzała"',
      addr: 'ul. Tarczowa 12, Szczecin',
      emoji: '🍽️',
      desc: 'Tradycyjny bar mleczny serwujący domowe obiady w przystępnych cenach. Kultowe miejsce dla mieszkańców od lat 80. Bigos, pierogi, żurek.',
      hours: '8:00–18:00 (pon–pt)',
      phone: '+48 91 XXX XXX',
      website: null,
      coords: [14.5528, 53.4035],
      rating: 4.6,
      tags: ['bar mleczny', 'obiad', 'tanie jedzenie', 'tradycja']
    },
    {
      id: 5, cat: 'service',
      name: 'Apteka "Zdrowie"',
      addr: 'ul. Łucznicza 23, Szczecin',
      emoji: '💊',
      desc: 'Apteka ogólnodostępna z pełnym asortymentem leków i suplementów. Dyżury całodobowe w weekendy.',
      hours: '8:00–20:00',
      phone: '+48 91 XXX XXX',
      website: null,
      coords: [14.5515, 53.4040],
      rating: 4.3,
      tags: ['apteka', 'leki', 'zdrowie']
    },
    {
      id: 6, cat: 'edu',
      name: 'Szkoła Podstawowa nr 47',
      addr: 'ul. Tarczowa 8, Szczecin',
      emoji: '🏫',
      desc: 'Publiczna szkoła podstawowa obsługująca dzielnicę. Nowoczesna sala gimnastyczna, boisko szkolne i świetlica dla uczniów.',
      hours: '7:00–17:00 (dni szkolne)',
      phone: '+48 91 XXX XXX',
      website: 'sp47.szczecin.pl',
      coords: [14.5540, 53.4010],
      rating: 4.1,
      tags: ['szkoła', 'edukacja', 'dzieci']
    },
    {
      id: 7, cat: 'sport',
      name: 'Siłownia Plenerowa',
      addr: 'ul. Łucznicza (park), Szczecin',
      emoji: '💪',
      desc: 'Bezpłatna siłownia plenerowa z urządzeniami do ćwiczeń na świeżym powietrzu. Drążki, poręcze, orbitreki i wiele więcej.',
      hours: 'Całą dobę',
      phone: null,
      website: null,
      coords: [14.5498, 53.4028],
      rating: 4.4,
      tags: ['siłownia', 'ćwiczenia', 'bezpłatne', 'plener']
    },
    {
      id: 8, cat: 'food',
      name: 'Pizzeria "Tarcza"',
      addr: 'ul. Tarczowa 31, Szczecin',
      emoji: '🍕',
      desc: 'Lokalna pizzeria z wypiekiem w piecu opalanym drewnem. Dostawa w promieniu 3 km. Specjalność: pizza z łososiem i kaparami.',
      hours: '12:00–23:00',
      phone: '+48 91 XXX XXX',
      website: null,
      coords: [14.5545, 53.4025],
      rating: 4.7,
      tags: ['pizza', 'dostawa', 'włoska kuchnia']
    },
    {
      id: 9, cat: 'service',
      name: 'Poczta Polska',
      addr: 'ul. Łucznicza 67, Szczecin',
      emoji: '📮',
      desc: 'Placówka pocztowa oferująca pełen zakres usług: listy, paczki, przekazy pieniężne, usługi bankowe.',
      hours: '8:00–18:00 (pon–pt), 8:00–13:00 (sob)',
      phone: '800 888 888',
      website: 'poczta-polska.pl',
      coords: [14.5520, 53.4045],
      rating: 3.8,
      tags: ['poczta', 'paczki', 'usługi']
    },
    {
      id: 10, cat: 'park',
      name: 'Plac Zabaw "Łucznik"',
      addr: 'ul. Łucznicza (osiedle), Szczecin',
      emoji: '🎠',
      desc: 'Nowoczesny plac zabaw dla dzieci w wieku 2–12 lat. Zjeżdżalnie, huśtawki, piaskownica i ścianka wspinaczkowa. Ogrodzony i bezpieczny.',
      hours: 'Całą dobę',
      phone: null,
      website: null,
      coords: [14.5508, 53.4015],
      rating: 4.8,
      tags: ['plac zabaw', 'dzieci', 'rodzina']
    },
    {
      id: 11, cat: 'shop',
      name: 'Drogeria "Uroda"',
      addr: 'ul. Tarczowa 19, Szczecin',
      emoji: '🧴',
      desc: 'Drogeria z kosmetykami, środkami czystości i artykułami higienicznymi. Szeroki wybór marek krajowych i zagranicznych.',
      hours: '9:00–20:00',
      phone: null,
      website: null,
      coords: [14.5532, 53.4042],
      rating: 4.1,
      tags: ['drogeria', 'kosmetyki', 'chemia']
    },
    {
      id: 12, cat: 'service',
      name: 'Przychodnia Zdrowia',
      addr: 'ul. Łucznicza 15, Szczecin',
      emoji: '🏥',
      desc: 'Przychodnia POZ z lekarzem rodzinnym, pediatrą i pielęgniarką środowiskową. Rejestracja telefoniczna i online.',
      hours: '7:30–18:00 (pon–pt)',
      phone: '+48 91 XXX XXX',
      website: null,
      coords: [14.5502, 53.4035],
      rating: 3.9,
      tags: ['przychodnia', 'lekarz', 'zdrowie', 'NFZ']
    }
  ],

  // ===== TRASY =====
  routes: [
    {
      id: 1,
      name: 'Spacer po Łuczniczej',
      emoji: '🚶',
      color: '#6c63ff',
      distance: '1.2 km',
      time: '15 min',
      difficulty: 'Łatwa',
      desc: 'Krótki spacer wzdłuż ulicy Łuczniczej, mijając sklepy, aptekę i siłownię plenerową. Idealna trasa na poranny spacer.',
      stops: [
        'Start: Przychodnia Zdrowia (ul. Łucznicza 15)',
        'Siłownia Plenerowa',
        'Sklep Spożywczy (ul. Łucznicza 45)',
        'Poczta Polska (ul. Łucznicza 67)',
        'Meta: Boisko Sportowe'
      ],
      coords: [
        [14.5502, 53.4035],
        [14.5498, 53.4028],
        [14.5505, 53.4022],
        [14.5520, 53.4045],
        [14.5510, 53.4030]
      ]
    },
    {
      id: 2,
      name: 'Trasa Rodzinna',
      emoji: '👨‍👩‍👧',
      color: '#43e97b',
      distance: '2.1 km',
      time: '30 min',
      difficulty: 'Łatwa',
      desc: 'Trasa idealna dla rodzin z dziećmi. Prowadzi przez plac zabaw, skwer i szkołę podstawową. Wiele miejsc do odpoczynku.',
      stops: [
        'Start: Plac Zabaw "Łucznik"',
        'Skwer przy Tarczowej',
        'Szkoła Podstawowa nr 47',
        'Bar Mleczny "Strzała"',
        'Meta: Plac Zabaw "Łucznik"'
      ],
      coords: [
        [14.5508, 53.4015],
        [14.5535, 53.4018],
        [14.5540, 53.4010],
        [14.5528, 53.4035],
        [14.5508, 53.4015]
      ]
    },
    {
      id: 3,
      name: 'Obwód Gastronomiczny',
      emoji: '🍽️',
      color: '#ffd93d',
      distance: '1.8 km',
      time: '25 min',
      difficulty: 'Łatwa',
      desc: 'Trasa dla smakoszy — od baru mlecznego przez pizzerię do lokalnych kawiarni. Poznaj smaki dzielnicy.',
      stops: [
        'Start: Bar Mleczny "Strzała" (ul. Tarczowa 12)',
        'Pizzeria "Tarcza" (ul. Tarczowa 31)',
        'Drogeria "Uroda" (zakupy po drodze)',
        'Sklep Spożywczy',
        'Meta: Skwer przy Tarczowej'
      ],
      coords: [
        [14.5528, 53.4035],
        [14.5545, 53.4025],
        [14.5532, 53.4042],
        [14.5505, 53.4022],
        [14.5535, 53.4018]
      ]
    }
  ],

  // ===== INFO O DZIELNICY =====
  info: [
    {
      icon: '🏘️',
      title: 'Charakterystyka dzielnicy',
      text: 'Obszar ulic Łuczniczej i Tarczowej to spokojna dzielnica mieszkaniowa w Szczecinie, charakteryzująca się zabudową wielorodzinną z lat 70. i 80. XX wieku. Dzielnica jest dobrze skomunikowana z centrum miasta i oferuje pełną infrastrukturę dla mieszkańców.',
      stats: [
        { num: '~8 000', label: 'Mieszkańców' },
        { num: '2,4 km²', label: 'Powierzchnia' },
        { num: '1970s', label: 'Zabudowa' }
      ]
    },
    {
      icon: '🌿',
      title: 'Zieleń i rekreacja',
      text: 'Dzielnica wyróżnia się dużą ilością terenów zielonych — skwery, parki osiedlowe i alejki spacerowe tworzą przyjazną przestrzeń dla mieszkańców. Siłownia plenerowa i boiska sportowe zachęcają do aktywności fizycznej na świeżym powietrzu.',
      stats: [
        { num: '3', label: 'Parki/skwery' },
        { num: '2', label: 'Boiska' },
        { num: '1', label: 'Siłownia' }
      ]
    },
    {
      icon: '🏗️',
      title: 'Infrastruktura',
      text: 'Dzielnica posiada pełną infrastrukturę miejską: szkoły, przychodnie, apteki, sklepy i usługi. Trwają inwestycje w modernizację chodników i oświetlenia ulicznego. Planowana jest rozbudowa ścieżek rowerowych łączących dzielnicę z centrum.',
      stats: [
        { num: '1', label: 'Szkoła' },
        { num: '1', label: 'Przychodnia' },
        { num: '12+', label: 'Usług' }
      ]
    },
    {
      icon: '📅',
      title: 'Historia',
      text: 'Ulice Łucznicza i Tarczowa swoją nazwę zawdzięczają tradycji łucznictwa — sport ten był popularny w tym rejonie Szczecina. Dzielnica rozwijała się dynamicznie w latach 70. XX wieku jako część planu rozbudowy Szczecina po wojnie. Dziś jest spokojną, zieloną enklawą w tkance miejskiej.',
      stats: [
        { num: '50+', label: 'Lat historii' },
        { num: '1970', label: 'Rok budowy' },
        { num: '🏹', label: 'Symbol' }
      ]
    }
  ],

  // ===== TRANSPORT =====
  transport: [
    {
      type: 'tram',
      icon: '🚃',
      title: 'Tramwaje',
      subtitle: 'Linie tramwajowe w pobliżu',
      color: '#e74c3c',
      lines: [
        { num: '3', color: 'line-tram' },
        { num: '7', color: 'line-tram' },
        { num: '12', color: 'line-tram' }
      ],
      stops: [
        { name: 'Łucznicza', dist: '150 m' },
        { name: 'Tarczowa', dist: '200 m' },
        { name: 'Centrum Handlowe', dist: '450 m' }
      ]
    },
    {
      type: 'bus',
      icon: '🚌',
      title: 'Autobusy',
      subtitle: 'Linie autobusowe w pobliżu',
      color: '#3498db',
      lines: [
        { num: '51', color: 'line-bus' },
        { num: '64', color: 'line-bus' },
        { num: '78', color: 'line-bus' },
        { num: '103', color: 'line-bus' }
      ],
      stops: [
        { name: 'Łucznicza / Tarczowa', dist: '80 m' },
        { name: 'Szkoła Podstawowa', dist: '180 m' },
        { name: 'Osiedle Łucznicza', dist: '300 m' }
      ]
    },
    {
      type: 'night',
      icon: '🌙',
      title: 'Linie nocne',
      subtitle: 'Komunikacja nocna',
      color: '#2c3e50',
      lines: [
        { num: 'N1', color: 'line-night' },
        { num: 'N5', color: 'line-night' }
      ],
      stops: [
        { name: 'Łucznicza (nocna)', dist: '200 m' }
      ]
    },
    {
      type: 'bike',
      icon: '🚲',
      title: 'Rowery miejskie',
      subtitle: 'Stacje Bike_S Szczecin',
      color: '#27ae60',
      lines: [],
      stops: [
        { name: 'Stacja Łucznicza', dist: '120 m' },
        { name: 'Stacja Tarczowa', dist: '250 m' }
      ]
    }
  ],

  // ===== WYDARZENIA =====
  events: [
    {
      day: '07', month: 'CZE',
      name: 'Festyn Osiedlowy "Łucznicza Bawi"',
      place: 'Boisko Sportowe Łucznicza',
      desc: 'Coroczny festyn dla mieszkańców dzielnicy. Koncerty, zabawy dla dzieci, stoiska z jedzeniem i lokalnymi wyrobami.',
      tag: 'Festyn'
    },
    {
      day: '15', month: 'CZE',
      name: 'Turniej Piłki Nożnej Dzielnicy',
      place: 'Boisko Sportowe Łucznicza',
      desc: 'Amatorski turniej piłkarski dla drużyn z dzielnicy. Zapisy do 10 czerwca. Nagrody dla zwycięzców.',
      tag: 'Sport'
    },
    {
      day: '22', month: 'CZE',
      name: 'Noc Świętojańska na Tarczowej',
      place: 'Skwer przy Tarczowej',
      desc: 'Tradycyjne świętowanie nocy świętojańskiej. Ognisko, wianki, muzyka na żywo i wspólna zabawa do późna.',
      tag: 'Tradycja'
    },
    {
      day: '05', month: 'LIP',
      name: 'Warsztaty Łucznictwa dla Dzieci',
      place: 'Szkoła Podstawowa nr 47',
      desc: 'Bezpłatne warsztaty łucznictwa nawiązujące do nazwy ulicy. Dla dzieci w wieku 7–14 lat. Zapisy w szkole.',
      tag: 'Edukacja'
    },
    {
      day: '19', month: 'LIP',
      name: 'Kino Letnie pod Gwiazdami',
      place: 'Skwer przy Tarczowej',
      desc: 'Bezpłatne seanse filmowe na świeżym powietrzu. Filmy familijne i polskie kino. Przynieś koc i dobry humor.',
      tag: 'Kultura'
    },
    {
      day: '02', month: 'SIE',
      name: 'Bieg Uliczny "Łucznicza Run"',
      place: 'Start: ul. Łucznicza',
      desc: 'Lokalny bieg uliczny na dystansie 5 km i 10 km. Trasa przez dzielnicę i okoliczne parki. Zapisy online.',
      tag: 'Sport'
    }
  ]
};
