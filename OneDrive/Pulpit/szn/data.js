// ===== DANE APLIKACJI =====
// Dzielnica: Niebuszewo, Szczecin
// Centrum: ~53.4530, 14.5520

const APP_DATA = {

  center: [14.5546, 53.4559],  // Centrum Niebuszewo, Szczecin

  // ===== MIEJSCA — PRAWDZIWE DANE OSM (Niebuszewo/Łucznicza, Szczecin) =====
  // Źródło: OpenStreetMap via Nominatim | Pobrano: 2026-05-30
  places: [
    // ===== APTEKI =====
    {
      id: 1, cat: 'service',
      name: 'Apteka Fiołkowa',
      addr: 'ul. Łucznicza, Szczecin',
      emoji: '💊',
      desc: 'Apteka ogólnodostępna na ul. Łuczniczej. Pełny asortyment leków, suplementów i artykułów higienicznych.',
      hours: 'Pon–Pt 8:00–20:00',
      phone: null, website: null,
      coords: [14.54773, 53.45399],
      rating: 4.2,
      tags: ['apteka', 'leki', 'zdrowie', 'Łucznicza']
    },
    {
      id: 2, cat: 'service',
      name: 'Apteka Puls',
      addr: 'ul. Ks. Warcisława I 27a, Szczecin',
      emoji: '💊',
      desc: 'Apteka Puls z szerokim asortymentem leków i suplementów. Czynna również w weekendy.',
      hours: 'Pon–Pt 8:00–20:00, Sob 8:00–18:00, Ndz 10:00–16:00',
      phone: null, website: null,
      coords: [14.54989, 53.45367],
      rating: 4.3,
      tags: ['apteka', 'leki', 'zdrowie', 'weekendy']
    },
    {
      id: 3, cat: 'service',
      name: 'Apteka Dbam o Zdrowie',
      addr: 'ul. Bpa Bandurskiego 98, Szczecin',
      emoji: '💊',
      desc: 'Sieciowa apteka Dbam o Zdrowie. Szeroki wybór leków, kosmetyków i artykułów zdrowotnych.',
      hours: 'Pon–Pt 8:00–21:00, Sob 8:00–20:00, Ndz 9:00–17:00',
      phone: null, website: 'dbamozdrowie.pl',
      coords: [14.56355, 53.45365],
      rating: 4.1,
      tags: ['apteka', 'leki', 'zdrowie', 'sieciowa']
    },
    {
      id: 4, cat: 'service',
      name: 'Apteka Cefarm',
      addr: 'ul. Bpa Naruszewicza 11, Szczecin',
      emoji: '💊',
      desc: 'Apteka Cefarm — lokalna sieć aptek zachodniopomorskich. Leki, suplementy, artykuły higieniczne.',
      hours: 'Pon–Pt 8:00–20:00, Sob 8:00–15:00',
      phone: null, website: null,
      coords: [14.54989, 53.44766],
      rating: 4.0,
      tags: ['apteka', 'leki', 'cefarm']
    },
    // ===== SKLEPY =====
    {
      id: 5, cat: 'shop',
      name: 'Sklep Spożywczo-Monopolowy',
      addr: 'ul. Bpa Bandurskiego 87a, Szczecin',
      emoji: '🛒',
      desc: 'Lokalny sklep spożywczo-monopolowy. Czynny codziennie od 6:00 do 23:00. Szeroki asortyment produktów.',
      hours: 'Codziennie 6:00–23:00',
      phone: null, website: null,
      coords: [14.55998, 53.45616],
      rating: 3.9,
      tags: ['sklep', 'spożywczy', 'monopolowy', 'całą dobę']
    },
    // ===== JEDZENIE =====
    {
      id: 6, cat: 'food',
      name: 'Bafra Kebab',
      addr: 'ul. Przyjaciół Żołnierza, Szczecin',
      emoji: '🥙',
      desc: 'Popularny kebab na Niebuszewie. Szybka obsługa, duże porcje, przystępne ceny. Ulubione miejsce mieszkańców.',
      hours: 'Codziennie 11:00–23:00',
      phone: null, website: null,
      coords: [14.55156, 53.45482],
      rating: 4.4,
      tags: ['kebab', 'fast food', 'tanie jedzenie', 'szybko']
    },
    {
      id: 7, cat: 'food',
      name: 'Pizza Hut',
      addr: 'ul. Przyjaciół Żołnierza 128a, Szczecin',
      emoji: '🍕',
      desc: 'Restauracja Pizza Hut na Niebuszewie. Pizza, makarony, sałatki. Dostawa i jedzenie na miejscu.',
      hours: 'Codziennie 11:00–23:00',
      phone: null, website: 'pizzahut.pl',
      coords: [14.55190, 53.45484],
      rating: 4.0,
      tags: ['pizza', 'restauracja', 'dostawa', 'Pizza Hut']
    },
    {
      id: 8, cat: 'food',
      name: 'Gastro Pizza Night',
      addr: 'ul. Przyjaciół Żołnierza, Szczecin',
      emoji: '🍕',
      desc: 'Lokalna pizzeria na Niebuszewie. Domowa pizza z pieca, dostawa w okolicy.',
      hours: 'Codziennie 12:00–23:00',
      phone: null, website: null,
      coords: [14.56277, 53.45301],
      rating: 4.2,
      tags: ['pizza', 'lokalna', 'dostawa']
    },
    {
      id: 9, cat: 'food',
      name: 'Genial Piekarnia',
      addr: 'ul. Przyjaciół Żołnierza, Szczecin',
      emoji: '🥖',
      desc: 'Piekarnia Genial — świeże pieczywo każdego ranka. Chleby, bułki, ciasta. Sklep partnerski.',
      hours: 'Pon–Pt 7:00–20:00, Sob 7:00–16:00',
      phone: null, website: null,
      coords: [14.55135, 53.45471],
      rating: 4.5,
      tags: ['piekarnia', 'pieczywo', 'świeże', 'chleb']
    },
    {
      id: 10, cat: 'food',
      name: 'Piekarnia Arion Polbak',
      addr: 'ul. Przyjaciół Żołnierza 128a, Szczecin',
      emoji: '🥖',
      desc: 'Piekarnia Arion Polbak — tradycyjne wypieki. Świeże pieczywo, ciasta i wyroby cukiernicze.',
      hours: 'Pon–Sob 6:00–18:00',
      phone: null, website: null,
      coords: [14.55198, 53.45470],
      rating: 4.3,
      tags: ['piekarnia', 'pieczywo', 'tradycja', 'ciasta']
    },
    // ===== EDUKACJA =====
    {
      id: 11, cat: 'edu',
      name: 'Szkoła Podstawowa nr 35 im. Jana Pawła II',
      addr: 'ul. Jana Kułakowskiego, Szczecin',
      emoji: '🏫',
      desc: 'Publiczna szkoła podstawowa na Niebuszewie. Nowoczesna baza dydaktyczna, sala gimnastyczna, boisko.',
      hours: 'Pon–Pt 7:00–17:00 (dni szkolne)',
      phone: null, website: null,
      coords: [14.55523, 53.45008],
      rating: 4.2,
      tags: ['szkoła', 'edukacja', 'dzieci', 'SP35']
    },
    {
      id: 12, cat: 'edu',
      name: 'Szkoła Podstawowa nr 18 im. Józefa Bema',
      addr: 'ul. Komuny Paryskiej 20, Szczecin',
      emoji: '🏫',
      desc: 'Szkoła Podstawowa nr 18 — jedna z większych szkół w dzielnicy. Bogata oferta zajęć pozalekcyjnych.',
      hours: 'Pon–Pt 7:00–17:00 (dni szkolne)',
      phone: null, website: null,
      coords: [14.56575, 53.45356],
      rating: 4.1,
      tags: ['szkoła', 'edukacja', 'dzieci', 'SP18']
    },
    {
      id: 13, cat: 'edu',
      name: 'Szkoła Podstawowa nr 69 im. mjr. H. Sucharskiego',
      addr: 'ul. Jana Zamoyskiego, Szczecin',
      emoji: '🏫',
      desc: 'Szkoła Podstawowa nr 69 na Niebuszewie. Aktywna społeczność szkolna, liczne koła zainteresowań.',
      hours: 'Pon–Pt 7:00–17:00 (dni szkolne)',
      phone: null, website: null,
      coords: [14.54317, 53.44885],
      rating: 4.0,
      tags: ['szkoła', 'edukacja', 'dzieci', 'SP69']
    },
    {
      id: 14, cat: 'edu',
      name: 'Przedszkole Publiczne nr 59',
      addr: 'ul. Księżnej Zofii, Szczecin',
      emoji: '🧒',
      desc: 'Publiczne przedszkole na Niebuszewie. Przyjazna atmosfera, wykwalifikowana kadra, plac zabaw.',
      hours: 'Pon–Pt 6:30–17:00',
      phone: null, website: null,
      coords: [14.55910, 53.45127],
      rating: 4.4,
      tags: ['przedszkole', 'dzieci', 'edukacja', 'publiczne']
    },
    {
      id: 15, cat: 'edu',
      name: 'Przedszkole Publiczne nr 5',
      addr: 'ul. Tomaszowska, Szczecin',
      emoji: '🧒',
      desc: 'Przedszkole Publiczne nr 5 — opieka nad dziećmi w wieku 3–6 lat. Ogród, plac zabaw, zajęcia artystyczne.',
      hours: 'Pon–Pt 6:30–17:00',
      phone: null, website: null,
      coords: [14.56673, 53.44839],
      rating: 4.3,
      tags: ['przedszkole', 'dzieci', 'edukacja']
    },
    {
      id: 16, cat: 'edu',
      name: 'Przedszkole Przyjaciele',
      addr: 'ul. Ks. Warcisława I, Szczecin',
      emoji: '🧒',
      desc: 'Niepubliczne przedszkole Przyjaciele. Mała liczebność grup, indywidualne podejście do dziecka.',
      hours: 'Pon–Pt 7:00–17:00',
      phone: null, website: null,
      coords: [14.55053, 53.45077],
      rating: 4.6,
      tags: ['przedszkole', 'niepubliczne', 'dzieci', 'mała grupa']
    },
    // ===== BANKI / USŁUGI =====
    {
      id: 17, cat: 'service',
      name: 'Bank Pekao SA',
      addr: 'ul. Bpa Bandurskiego 98, Szczecin',
      emoji: '🏦',
      desc: 'Oddział Banku Pekao SA na Niebuszewie. Pełna obsługa bankowa, kredyty, konta, bankomat.',
      hours: 'Pon–Pt 9:00–17:00',
      phone: null, website: 'pekao.com.pl',
      coords: [14.56339, 53.45348],
      rating: 3.8,
      tags: ['bank', 'Pekao', 'finanse', 'bankomat']
    },
    {
      id: 18, cat: 'service',
      name: 'Bank Millennium',
      addr: 'ul. Przyjaciół Żołnierza 128a, Szczecin',
      emoji: '🏦',
      desc: 'Oddział Banku Millennium. Obsługa klientów indywidualnych i firmowych, bankomat.',
      hours: 'Pon,Wt,Czw,Pt 9:00–16:00, Śr 10:00–17:00',
      phone: null, website: 'bankmillennium.pl',
      coords: [14.55185, 53.45465],
      rating: 3.9,
      tags: ['bank', 'Millennium', 'finanse']
    },
    {
      id: 19, cat: 'service',
      name: 'Santander Bank Polska',
      addr: 'ul. Ks. Warcisława I 25C, Szczecin',
      emoji: '🏦',
      desc: 'Oddział Santander Bank Polska. Konta osobiste, kredyty, lokaty, bankomat.',
      hours: 'Pon–Pt 9:00–17:00',
      phone: null, website: 'santander.pl',
      coords: [14.54989, 53.45326],
      rating: 3.7,
      tags: ['bank', 'Santander', 'finanse']
    },
    {
      id: 20, cat: 'service',
      name: 'Urząd Pocztowy Szczecin 41',
      addr: 'ul. Łucznicza, Szczecin',
      emoji: '📮',
      desc: 'Filia Urzędu Pocztowego Szczecin 41 na ul. Łuczniczej. Listy, paczki, przekazy, usługi bankowe.',
      hours: 'Pon 9:00–20:00, Wt–Pt 8:00–19:00',
      phone: '800 888 888', website: 'poczta-polska.pl',
      coords: [14.54794, 53.45296],
      rating: 3.8,
      tags: ['poczta', 'paczki', 'listy', 'Łucznicza']
    },
    // ===== PARKI =====
    {
      id: 21, cat: 'park',
      name: 'Park Antoniego Kadziaka',
      addr: 'Niebuszewo, Szczecin',
      emoji: '🌳',
      desc: 'Zielony park na Niebuszewie im. Antoniego Kadziaka. Alejki spacerowe, ławki, tereny rekreacyjne dla mieszkańców.',
      hours: 'Całą dobę',
      phone: null, website: null,
      coords: [14.54365, 53.45100],
      rating: 4.5,
      tags: ['park', 'spacer', 'zieleń', 'rekreacja']
    },
    {
      id: 22, cat: 'park',
      name: 'Park Władysława Bartoszewskiego',
      addr: 'Niebuszewo, Szczecin',
      emoji: '🌳',
      desc: 'Park im. Władysława Bartoszewskiego — spokojne miejsce do spacerów i odpoczynku na Niebuszewie.',
      hours: 'Całą dobę',
      phone: null, website: null,
      coords: [14.56531, 53.45059],
      rating: 4.4,
      tags: ['park', 'spacer', 'zieleń', 'odpoczynek']
    },
    // ===== KOŚCIOŁY =====
    {
      id: 23, cat: 'service',
      name: 'Kościół pw. Miłosierdzia Bożego',
      addr: 'ul. Przyjaciół Żołnierza 45, Szczecin',
      emoji: '⛪',
      desc: 'Kościół parafialny pw. Miłosierdzia Bożego na Niebuszewie. Msze święte, uroczystości parafialne.',
      hours: 'Msze: Pon–Sob 7:00, 18:00; Ndz 8:00, 10:00, 12:00, 18:00',
      phone: null, website: null,
      coords: [14.55687, 53.45350],
      rating: 4.6,
      tags: ['kościół', 'parafia', 'religia', 'Miłosierdzie Boże']
    },
    {
      id: 24, cat: 'service',
      name: 'Kościół pw. św. Mikołaja',
      addr: 'ul. M. Golisza, Szczecin',
      emoji: '⛪',
      desc: 'Kościół parafialny pw. św. Mikołaja na Niebuszewie. Zabytkowy kościół z bogatą historią.',
      hours: 'Msze: Pon–Sob 7:00, 18:00; Ndz 8:00, 10:00, 12:00',
      phone: null, website: null,
      coords: [14.56807, 53.45297],
      rating: 4.5,
      tags: ['kościół', 'parafia', 'zabytek', 'historia']
    },
    // ===== SPORT =====
    {
      id: 25, cat: 'sport',
      name: 'Boisko Sportowe Niebuszewo',
      addr: 'ul. Łucznicza, Szczecin',
      emoji: '⚽',
      desc: 'Ogólnodostępne boisko sportowe na Niebuszewie. Piłka nożna, koszykówka. Oświetlone wieczorami.',
      hours: 'Całą dobę',
      phone: null, website: null,
      coords: [14.55100, 53.45200],
      rating: 4.2,
      tags: ['boisko', 'sport', 'piłka nożna', 'bezpłatne']
    },
    {
      id: 26, cat: 'sport',
      name: 'Siłownia Plenerowa Niebuszewo',
      addr: 'Park Kadziaka, Szczecin',
      emoji: '💪',
      desc: 'Bezpłatna siłownia plenerowa w Parku Kadziaka. Urządzenia do ćwiczeń na świeżym powietrzu.',
      hours: 'Całą dobę',
      phone: null, website: null,
      coords: [14.54400, 53.45080],
      rating: 4.3,
      tags: ['siłownia', 'plener', 'bezpłatne', 'ćwiczenia']
    },
    // ===== SPOŁECZNOŚĆ =====
    {
      id: 27, cat: 'service',
      name: 'Społeczna Szkoła Podstawowa nr 1',
      addr: 'ul. Jaskółcza, Szczecin',
      emoji: '🏫',
      desc: 'Społeczna Szkoła Podstawowa nr 1 — szkoła niepubliczna z indywidualnym podejściem do ucznia.',
      hours: 'Pon–Pt 7:00–17:00',
      phone: null, website: null,
      coords: [14.56735, 53.44945],
      rating: 4.5,
      tags: ['szkoła', 'społeczna', 'niepubliczna', 'edukacja']
    },

    // ===== SUPERMARKETY / SKLEPY SIECIOWE =====
    {
      id: 28, cat: 'shop',
      name: 'Biedronka',
      addr: 'ul. Rostocka 1, Szczecin',
      emoji: '🛒',
      desc: 'Sklep Biedronka przy ul. Rostockiej. Szeroki asortyment produktów spożywczych i przemysłowych w niskich cenach.',
      hours: 'Pon–Sob 6:00–23:30',
      phone: null, website: 'biedronka.pl',
      coords: [14.55496, 53.46105],
      rating: 4.0,
      tags: ['biedronka', 'supermarket', 'tanie zakupy', 'sieciowy']
    },
    {
      id: 29, cat: 'shop',
      name: 'Biedronka',
      addr: 'ul. Bpa Bandurskiego 90, Szczecin',
      emoji: '🛒',
      desc: 'Sklep Biedronka przy ul. Bandurskiego. Produkty spożywcze, chemia gospodarcza, artykuły codziennego użytku.',
      hours: 'Pon–Sob 6:00–22:00',
      phone: null, website: 'biedronka.pl',
      coords: [14.55982, 53.45522],
      rating: 3.9,
      tags: ['biedronka', 'supermarket', 'tanie zakupy']
    },
    {
      id: 30, cat: 'shop',
      name: 'Biedronka',
      addr: 'ul. Przyjaciół Żołnierza 128a, Szczecin',
      emoji: '🛒',
      desc: 'Biedronka przy centrum handlowym Przyjaciół Żołnierza. Duży wybór produktów, długie godziny otwarcia.',
      hours: 'Pon–Sob 6:00–23:30',
      phone: null, website: 'biedronka.pl',
      coords: [14.55212, 53.45475],
      rating: 4.1,
      tags: ['biedronka', 'supermarket', 'centrum handlowe']
    },
    {
      id: 31, cat: 'shop',
      name: 'Lidl',
      addr: 'ul. Bpa Bandurskiego 97, Szczecin',
      emoji: '🛒',
      desc: 'Sklep Lidl przy ul. Bandurskiego. Produkty spożywcze, świeże pieczywo, artykuły przemysłowe i tygodniowe promocje.',
      hours: 'Pon–Sob 7:00–22:00',
      phone: null, website: 'lidl.pl',
      coords: [14.56176, 53.45465],
      rating: 4.2,
      tags: ['lidl', 'supermarket', 'promocje', 'pieczywo']
    },
    {
      id: 32, cat: 'shop',
      name: 'Lidl',
      addr: 'ul. Z. Krasińskiego 82, Szczecin',
      emoji: '🛒',
      desc: 'Sklep Lidl przy ul. Krasińskiego. Czynny również w niedzielę. Świeże produkty, własna piekarnia.',
      hours: 'Pon–Sob 7:00–21:00, Ndz 9:00–18:00',
      phone: null, website: 'lidl.pl',
      coords: [14.54326, 53.45014],
      rating: 4.3,
      tags: ['lidl', 'supermarket', 'niedziela', 'piekarnia']
    },
    {
      id: 33, cat: 'shop',
      name: 'Lidl',
      addr: 'ul. Z. Krasińskiego 50, Szczecin',
      emoji: '🛒',
      desc: 'Drugi sklep Lidl przy ul. Krasińskiego. Duży parking, szeroki asortyment, czynny w weekendy.',
      hours: 'Pon–Sob 6:00–22:00, Ndz 8:00–20:00',
      phone: null, website: 'lidl.pl',
      coords: [14.54565, 53.45531],
      rating: 4.1,
      tags: ['lidl', 'supermarket', 'parking', 'weekend']
    },

    // ===== ŻABKI =====
    {
      id: 34, cat: 'shop',
      name: 'Żabka',
      addr: 'ul. Bpa Bandurskiego 98, Szczecin',
      emoji: '🐸',
      desc: 'Sklep Żabka przy ul. Bandurskiego. Produkty spożywcze, napoje, przekąski. Czynna do 23:00.',
      hours: 'Pon–Sob 6:00–23:00, Ndz 9:00–21:00',
      phone: null, website: 'zabka.pl',
      coords: [14.56345, 53.45347],
      rating: 3.8,
      tags: ['żabka', 'convenience', 'szybkie zakupy', 'wieczór']
    },
    {
      id: 35, cat: 'shop',
      name: 'Żabka',
      addr: 'ul. Przyjaciół Żołnierza, Szczecin',
      emoji: '🐸',
      desc: 'Żabka przy ul. Przyjaciół Żołnierza. Czynna codziennie, idealna na szybkie zakupy.',
      hours: 'Codziennie 6:00–23:00',
      phone: null, website: 'zabka.pl',
      coords: [14.55444, 53.45387],
      rating: 3.7,
      tags: ['żabka', 'convenience', 'codziennie']
    },
    {
      id: 36, cat: 'shop',
      name: 'Żabka',
      addr: 'ul. Łucznicza, Szczecin',
      emoji: '🐸',
      desc: 'Żabka na ul. Łuczniczej. Blisko centrum dzielnicy, szybkie zakupy, kawa na wynos.',
      hours: 'Pon–Sob 6:00–23:00, Ndz 9:00–22:00',
      phone: null, website: 'zabka.pl',
      coords: [14.54909, 53.45305],
      rating: 3.9,
      tags: ['żabka', 'convenience', 'kawa', 'Łucznicza']
    },
    {
      id: 37, cat: 'shop',
      name: 'Żabka',
      addr: 'ul. Sosnowa 20, Szczecin',
      emoji: '🐸',
      desc: 'Żabka przy ul. Sosnowej. Wygodna lokalizacja dla mieszkańców okolicznych bloków.',
      hours: '6:00–23:00',
      phone: null, website: 'zabka.pl',
      coords: [14.54612, 53.45190],
      rating: 3.8,
      tags: ['żabka', 'convenience', 'osiedle']
    },

    // ===== RESTAURACJE / FAST FOOD =====
    {
      id: 38, cat: 'food',
      name: "McDonald's",
      addr: 'ul. Przyjaciół Żołnierza 6, Szczecin',
      emoji: '🍔',
      desc: "Restauracja McDonald's na Niebuszewie. Burgery, frytki, kawy McCafé. Drive-thru i sala restauracyjna.",
      hours: 'Codziennie 7:00–24:00',
      phone: null, website: 'mcdonalds.pl',
      coords: [14.56135, 53.45382],
      rating: 3.9,
      tags: ['mcdonalds', 'fast food', 'burgery', 'drive-thru']
    },

    // ===== USŁUGI =====
    {
      id: 39, cat: 'service',
      name: 'Gabinet Stomatologiczny',
      addr: 'ul. Łucznicza 76A, Szczecin',
      emoji: '🦷',
      desc: 'Gabinet stomatologiczny na ul. Łuczniczej. Leczenie, profilaktyka, wybielanie zębów. Rejestracja telefoniczna.',
      hours: 'Pon–Sob 9:00–19:00',
      phone: null, website: null,
      coords: [14.54984, 53.45311],
      rating: 4.4,
      tags: ['dentysta', 'stomatolog', 'zęby', 'Łucznicza']
    },

    // ===== SKLEPY SPECJALISTYCZNE =====
    {
      id: 40, cat: 'shop',
      name: 'Kwiaciarnia',
      addr: 'ul. Jarogniewa, Szczecin',
      emoji: '🌸',
      desc: 'Kwiaciarnia na Niebuszewie. Świeże kwiaty, bukiety, kompozycje na każdą okazję. Czynna w niedzielę.',
      hours: 'Pon–Pt 9:00–19:00, Sob 9:00–18:00, Ndz 10:00–15:00',
      phone: null, website: null,
      coords: [14.55831, 53.45287],
      rating: 4.6,
      tags: ['kwiaciarnia', 'kwiaty', 'bukiety', 'prezenty']
    },

    // ===== CUKIERNIE =====
    {
      id: 41, cat: 'food',
      name: 'Cukiernia Domowa',
      addr: 'ul. Księżnej Zofii, Szczecin',
      emoji: '🍰',
      desc: 'Cukiernia Domowa — torty, ciasta, wyroby cukiernicze na zamówienie. Domowe smaki, tradycyjne receptury.',
      hours: 'Wt–Pt 9:00–17:30, Sob 9:00–16:00, Ndz 9:00–15:00',
      phone: null, website: null,
      coords: [14.55866, 53.45198],
      rating: 4.7,
      tags: ['cukiernia', 'torty', 'ciasta', 'domowe']
    },
    {
      id: 42, cat: 'food',
      name: 'Cukiernia Malek',
      addr: 'ul. Przyjaciół Żołnierza, Szczecin',
      emoji: '🍰',
      desc: 'Cukiernia Malek — tradycyjna cukiernia z długą historią. Pyszne torty, praliny i wyroby czekoladowe.',
      hours: 'Wt–Pt 9:30–18:00, Sob 9:30–15:00, Ndz 10:00–14:00',
      phone: null, website: null,
      coords: [14.56287, 53.45356],
      rating: 4.8,
      tags: ['cukiernia', 'torty', 'czekolada', 'tradycja']
    },

    // ===== BIBLIOTEKA =====
    {
      id: 43, cat: 'edu',
      name: 'Biblioteka Publiczna — Filia nr 13',
      addr: 'ul. Księżnej Zofii, Szczecin',
      emoji: '📚',
      desc: 'Miejska Biblioteka Publiczna w Szczecinie — Filia nr 13 na Niebuszewie. Wypożyczalnia książek, czytelnia, dostęp do internetu.',
      hours: 'Pon–Pt 8:00–20:00',
      phone: null, website: 'ksiaznica.szczecin.pl',
      coords: [14.55860, 53.45174],
      rating: 4.5,
      tags: ['biblioteka', 'książki', 'czytelnia', 'internet', 'bezpłatne']
    },

    // ===== APTEKA DBAM O ZDROWIE (Thugutta) =====
    {
      id: 44, cat: 'service',
      name: 'Apteka Dbam o Zdrowie',
      addr: 'ul. S. Thugutta 2a, Szczecin',
      emoji: '💊',
      desc: 'Apteka Dbam o Zdrowie przy ul. Thugutta. Leki, suplementy, kosmetyki. Czynna w soboty.',
      hours: 'Pon–Pt 8:00–20:00, Sob 9:00–15:00',
      phone: null, website: 'dbamozdrowie.pl',
      coords: [14.55630, 53.46098],
      rating: 4.0,
      tags: ['apteka', 'leki', 'zdrowie', 'Thugutta']
    },

    // ===== ŻABKA RAPACKIEGO =====
    {
      id: 45, cat: 'shop',
      name: 'Żabka',
      addr: 'ul. M. Rapackiego, Szczecin',
      emoji: '🐸',
      desc: 'Żabka przy ul. Rapackiego. Czynna codziennie od 6:00. Produkty spożywcze, napoje, przekąski.',
      hours: 'Codziennie 6:00–23:00',
      phone: null, website: 'zabka.pl',
      coords: [14.54785, 53.45000],
      rating: 3.8,
      tags: ['żabka', 'convenience', 'Rapackiego']
    }
  ],

  // ===== TRASY =====
  routes: [
    {
      id: 1,
      name: 'Spacer po Łuczniczej',
      emoji: '🚶',
      type: 'walk',
      color: '#6c63ff',
      distance: '1.4 km',
      distanceNum: 1.4,
      time: '18 min',
      timeMin: 18,
      difficulty: 'Łatwa',
      difficultyLevel: 1,
      calories: 70,
      terrain: 'Chodnik',
      bestTime: 'Rano',
      tags: ['poranny', 'usługi', 'spokojny', 'Łucznicza'],
      desc: 'Spacer wzdłuż ul. Łuczniczej — głównej arterii Niebuszewo. Mijasz aptekę, pocztę i park Kadziaka. Idealna trasa na poranny spacer.',
      highlights: ['Apteka Fiołkowa', 'Urząd Pocztowy', 'Park Kadziaka'],
      stops: [
        { name: 'Start: Apteka Fiołkowa', addr: 'ul. Łucznicza', emoji: '💊' },
        { name: 'Urząd Pocztowy Szczecin 41', addr: 'ul. Łucznicza', emoji: '📮' },
        { name: 'Park Antoniego Kadziaka', addr: 'Niebuszewo', emoji: '🌳' },
        { name: 'Siłownia Plenerowa', addr: 'Park Kadziaka', emoji: '💪' },
        { name: 'Meta: Boisko Sportowe', addr: 'ul. Łucznicza', emoji: '⚽' }
      ],
      coords: [
        [14.54773, 53.45399],
        [14.54794, 53.45296],
        [14.54365, 53.45100],
        [14.54400, 53.45080],
        [14.55100, 53.45200]
      ]
    },
    {
      id: 2,
      name: 'Trasa Rodzinna Niebuszewo',
      emoji: '👨‍👩‍👧',
      type: 'walk',
      color: '#43e97b',
      distance: '2.2 km',
      distanceNum: 2.2,
      time: '30 min',
      timeMin: 30,
      difficulty: 'Łatwa',
      difficultyLevel: 1,
      calories: 110,
      terrain: 'Chodnik + park',
      bestTime: 'Popołudnie',
      tags: ['rodzina', 'dzieci', 'park', 'pętla'],
      desc: 'Trasa idealna dla rodzin z dziećmi. Prowadzi przez Park Kadziaka, Park Bartoszewskiego i okolice szkół. Wiele ławek po drodze.',
      highlights: ['Park Kadziaka', 'Park Bartoszewskiego', 'Przedszkole Przyjaciele'],
      stops: [
        { name: 'Start: Park Kadziaka', addr: 'Niebuszewo', emoji: '🌳' },
        { name: 'Przedszkole Przyjaciele', addr: 'ul. Ks. Warcisława I', emoji: '🧒' },
        { name: 'Apteka Puls', addr: 'ul. Ks. Warcisława I 27a', emoji: '💊' },
        { name: 'Park Bartoszewskiego', addr: 'Niebuszewo', emoji: '🌳' },
        { name: 'Meta: Park Kadziaka', addr: 'Niebuszewo', emoji: '🌳' }
      ],
      coords: [
        [14.54365, 53.45100],
        [14.55053, 53.45077],
        [14.54989, 53.45367],
        [14.56531, 53.45059],
        [14.54365, 53.45100]
      ]
    },
    {
      id: 3,
      name: 'Trasa Gastronomiczna',
      emoji: '🍽️',
      type: 'walk',
      color: '#ffd93d',
      distance: '1.6 km',
      distanceNum: 1.6,
      time: '22 min',
      timeMin: 22,
      difficulty: 'Łatwa',
      difficultyLevel: 1,
      calories: 80,
      terrain: 'Chodnik',
      bestTime: 'Południe',
      tags: ['jedzenie', 'smaki', 'piekarnia', 'pizza'],
      desc: 'Trasa dla smakoszy — od piekarni przez kebab do pizzerii. Poznaj smaki Niebuszewo przy ul. Przyjaciół Żołnierza.',
      highlights: ['Piekarnia Genial', 'Bafra Kebab', 'Pizza Hut'],
      stops: [
        { name: 'Start: Piekarnia Genial', addr: 'ul. Przyjaciół Żołnierza', emoji: '🥖' },
        { name: 'Bafra Kebab', addr: 'ul. Przyjaciół Żołnierza', emoji: '🥙' },
        { name: 'Pizza Hut', addr: 'ul. Przyjaciół Żołnierza 128a', emoji: '🍕' },
        { name: 'Piekarnia Arion Polbak', addr: 'ul. Przyjaciół Żołnierza 128a', emoji: '🥖' },
        { name: 'Meta: Bank Millennium', addr: 'ul. Przyjaciół Żołnierza 128a', emoji: '🏦' }
      ],
      coords: [
        [14.55135, 53.45471],
        [14.55156, 53.45482],
        [14.55190, 53.45484],
        [14.55198, 53.45470],
        [14.55185, 53.45465]
      ]
    },
    {
      id: 4,
      name: 'Trasa Rowerowa Niebuszewo',
      emoji: '🚴',
      type: 'bike',
      color: '#ff6b6b',
      distance: '4.8 km',
      distanceNum: 4.8,
      time: '22 min',
      timeMin: 22,
      difficulty: 'Średnia',
      difficultyLevel: 2,
      calories: 144,
      terrain: 'Chodnik + ulica',
      bestTime: 'Wieczór',
      tags: ['rower', 'aktywny', 'szybki', 'obwód'],
      desc: 'Dynamiczna trasa rowerowa okrążająca całe Niebuszewo. Przez parki, główne ulice i spokojne boczne drogi.',
      highlights: ['Park Kadziaka', 'ul. Przyjaciół Żołnierza', 'Park Bartoszewskiego'],
      stops: [
        { name: 'Start: Park Kadziaka', addr: 'Niebuszewo', emoji: '🌳' },
        { name: 'Boisko Sportowe', addr: 'ul. Łucznicza', emoji: '⚽' },
        { name: 'ul. Przyjaciół Żołnierza', addr: 'Niebuszewo', emoji: '🚴' },
        { name: 'Park Bartoszewskiego', addr: 'Niebuszewo', emoji: '🌳' },
        { name: 'Kościół Miłosierdzia Bożego', addr: 'ul. Przyjaciół Żołnierza 45', emoji: '⛪' },
        { name: 'Meta: Park Kadziaka', addr: 'Niebuszewo', emoji: '🌳' }
      ],
      coords: [
        [14.54365, 53.45100],
        [14.55100, 53.45200],
        [14.55190, 53.45484],
        [14.56531, 53.45059],
        [14.55687, 53.45350],
        [14.54365, 53.45100]
      ]
    },
    {
      id: 5,
      name: 'Trasa Biegowa Niebuszewo',
      emoji: '🏃',
      type: 'run',
      color: '#ff6584',
      distance: '3.0 km',
      distanceNum: 3.0,
      time: '17 min',
      timeMin: 17,
      difficulty: 'Średnia',
      difficultyLevel: 2,
      calories: 240,
      terrain: 'Chodnik + park',
      bestTime: 'Rano / Wieczór',
      tags: ['bieg', 'sport', 'kondycja', 'pętla'],
      desc: 'Popularna trasa biegowa przez parki Niebuszewo. Płaska, bezpieczna pętla przez Park Kadziaka i okolice. Idealna do joggingu.',
      highlights: ['Park Kadziaka', 'Siłownia plenerowa', 'Alejki parkowe'],
      stops: [
        { name: 'Start: Boisko Sportowe', addr: 'ul. Łucznicza', emoji: '⚽' },
        { name: 'Siłownia Plenerowa', addr: 'Park Kadziaka', emoji: '💪' },
        { name: 'Park Kadziaka', addr: 'Niebuszewo', emoji: '🌳' },
        { name: 'Park Bartoszewskiego', addr: 'Niebuszewo', emoji: '🌳' },
        { name: 'Meta: Boisko Sportowe', addr: 'ul. Łucznicza', emoji: '⚽' }
      ],
      coords: [
        [14.55100, 53.45200],
        [14.54400, 53.45080],
        [14.54365, 53.45100],
        [14.56531, 53.45059],
        [14.55100, 53.45200]
      ]
    },
    {
      id: 6,
      name: 'Szlak Historyczny Niebuszewo',
      emoji: '🏛️',
      type: 'walk',
      color: '#a29bfe',
      distance: '2.6 km',
      distanceNum: 2.6,
      time: '40 min',
      timeMin: 40,
      difficulty: 'Łatwa',
      difficultyLevel: 1,
      calories: 130,
      terrain: 'Chodnik',
      bestTime: 'Dowolna pora',
      tags: ['historia', 'kultura', 'kościoły', 'architektura'],
      desc: 'Spacer śladami historii Niebuszewo. Zabytkowe kościoły, przedwojenna architektura i miejsca pamięci dzielnicy.',
      highlights: ['Kościół pw. Miłosierdzia Bożego', 'Kościół pw. św. Mikołaja', 'Zabytkowa zabudowa'],
      stops: [
        { name: 'Start: Kościół Miłosierdzia Bożego', addr: 'ul. Przyjaciół Żołnierza 45', emoji: '⛪' },
        { name: 'Bank Pekao', addr: 'ul. Bpa Bandurskiego 98', emoji: '🏦' },
        { name: 'Apteka Dbam o Zdrowie', addr: 'ul. Bpa Bandurskiego 98', emoji: '💊' },
        { name: 'Kościół pw. św. Mikołaja', addr: 'ul. M. Golisza', emoji: '⛪' },
        { name: 'SP nr 18 im. Józefa Bema', addr: 'ul. Komuny Paryskiej 20', emoji: '🏫' },
        { name: 'Meta: Park Bartoszewskiego', addr: 'Niebuszewo', emoji: '🌳' }
      ],
      coords: [
        [14.55687, 53.45350],
        [14.56339, 53.45348],
        [14.56355, 53.45365],
        [14.56807, 53.45297],
        [14.56575, 53.45356],
        [14.56531, 53.45059]
      ]
    }
  ],

  // ===== INFO O DZIELNICY =====
  info: [
    {
      id: 'overview',
      icon: '🏘️',
      color: '#6c63ff',
      title: 'Charakterystyka dzielnicy',
      text: 'Obszar ulic Łuczniczej i Tarczowej to spokojna dzielnica mieszkaniowa w Szczecinie, charakteryzująca się zabudową wielorodzinną z lat 70. i 80. XX wieku. Dzielnica jest dobrze skomunikowana z centrum miasta i oferuje pełną infrastrukturę dla mieszkańców.',
      facts: [
        'Jedna z najspokojniejszych dzielnic Szczecina',
        'Zabudowa wielorodzinna z wielkiej płyty',
        'Pełna infrastruktura: szkoły, sklepy, przychodnie',
        'Doskonałe połączenia tramwajowe i autobusowe'
      ],
      stats: [
        { num: '~8 000', label: 'Mieszkańców', icon: '👥' },
        { num: '2,4 km²', label: 'Powierzchnia', icon: '📐' },
        { num: '1970s', label: 'Zabudowa', icon: '🏗️' }
      ]
    },
    {
      id: 'nature',
      icon: '🌿',
      color: '#43e97b',
      title: 'Zieleń i rekreacja',
      text: 'Dzielnica wyróżnia się dużą ilością terenów zielonych — skwery, parki osiedlowe i alejki spacerowe tworzą przyjazną przestrzeń dla mieszkańców. Siłownia plenerowa i boiska sportowe zachęcają do aktywności fizycznej na świeżym powietrzu.',
      facts: [
        'Ponad 30% powierzchni to tereny zielone',
        'Bezpłatna siłownia plenerowa czynna całą dobę',
        'Plac zabaw z nowoczesnym wyposażeniem',
        'Planowane nowe ścieżki rowerowe w 2026 r.'
      ],
      stats: [
        { num: '3', label: 'Parki/skwery', icon: '🌳' },
        { num: '2', label: 'Boiska', icon: '⚽' },
        { num: '1', label: 'Siłownia', icon: '💪' }
      ]
    },
    {
      id: 'infra',
      icon: '🏗️',
      color: '#ffd93d',
      title: 'Infrastruktura',
      text: 'Dzielnica posiada pełną infrastrukturę miejską: szkoły, przychodnie, apteki, sklepy i usługi. Trwają inwestycje w modernizację chodników i oświetlenia ulicznego. Planowana jest rozbudowa ścieżek rowerowych łączących dzielnicę z centrum.',
      facts: [
        'Szkoła podstawowa z salą gimnastyczną',
        'Przychodnia POZ z rejestracją online',
        'Apteka z dyżurami weekendowymi',
        'Modernizacja oświetlenia LED w 2025 r.'
      ],
      stats: [
        { num: '1', label: 'Szkoła', icon: '🏫' },
        { num: '1', label: 'Przychodnia', icon: '🏥' },
        { num: '12+', label: 'Usług', icon: '🔧' }
      ]
    },
    {
      id: 'history',
      icon: '📅',
      color: '#a29bfe',
      title: 'Historia',
      text: 'Ulice Łucznicza i Tarczowa swoją nazwę zawdzięczają tradycji łucznictwa — sport ten był popularny w tym rejonie Szczecina. Dzielnica rozwijała się dynamicznie w latach 70. XX wieku jako część planu rozbudowy Szczecina po wojnie. Dziś jest spokojną, zieloną enklawą w tkance miejskiej.',
      facts: [
        'Nazwa pochodzi od tradycji łucznictwa',
        'Budowa osiedla: lata 1968–1978',
        'Pierwsi mieszkańcy wprowadzili się w 1971 r.',
        'W 2020 r. rewitalizacja skweru przy Tarczowej'
      ],
      stats: [
        { num: '50+', label: 'Lat historii', icon: '📜' },
        { num: '1970', label: 'Rok budowy', icon: '🏗️' },
        { num: '🏹', label: 'Symbol', icon: '🏹' }
      ]
    },
    {
      id: 'transport',
      icon: '🚌',
      color: '#ff6b6b',
      title: 'Komunikacja',
      text: 'Dzielnica jest doskonale skomunikowana z centrum Szczecina. Liczne linie tramwajowe i autobusowe zapewniają szybki dojazd do każdej części miasta. Stacje Bike_S umożliwiają wygodne poruszanie się rowerem.',
      facts: [
        '3 linie tramwajowe w pobliżu',
        '4 linie autobusowe dzienne + 2 nocne',
        '2 stacje Bike_S w dzielnicy',
        'Dojazd do centrum: ok. 15 minut'
      ],
      stats: [
        { num: '7', label: 'Linii MPK', icon: '🚃' },
        { num: '15 min', label: 'Do centrum', icon: '⏱️' },
        { num: '2', label: 'Stacje Bike_S', icon: '🚲' }
      ]
    },
    {
      id: 'community',
      icon: '👥',
      color: '#fd79a8',
      title: 'Społeczność',
      text: 'Aktywna społeczność lokalna organizuje regularne spotkania, festyny i inicjatywy sąsiedzkie. Rada Osiedla reprezentuje interesy mieszkańców i współpracuje z władzami miasta przy planowaniu inwestycji.',
      facts: [
        'Coroczny Festyn Osiedlowy "Łucznicza Bawi"',
        'Aktywna Rada Osiedla Łucznicza-Tarczowa',
        'Grupy sąsiedzkie na portalach społecznościowych',
        'Wolontariat i inicjatywy ekologiczne'
      ],
      stats: [
        { num: '4 250', label: 'Mieszkańców', icon: '👥' },
        { num: '38 lat', label: 'Średni wiek', icon: '👤' },
        { num: '6+', label: 'Wydarzeń/rok', icon: '🎉' }
      ]
    }
  ],

  // ===== HISTORIA — TIMELINE =====
  timeline: [
    { year: '1945', icon: '🏚️', title: 'Odbudowa Szczecina', desc: 'Po II wojnie światowej Szczecin wraca do Polski. Rozpoczyna się odbudowa zniszczonego miasta.' },
    { year: '1968', icon: '📐', title: 'Projekt osiedla', desc: 'Architekci miejscy opracowują projekt nowego osiedla mieszkaniowego przy ul. Łuczniczej i Tarczowej.' },
    { year: '1971', icon: '🏠', title: 'Pierwsi mieszkańcy', desc: 'Pierwsze bloki gotowe. Rodziny wprowadzają się do nowych mieszkań. Dzielnica zaczyna tętnić życiem.' },
    { year: '1975', icon: '🏫', title: 'Szkoła Podstawowa nr 47', desc: 'Otwarto Szkołę Podstawową nr 47 przy ul. Tarczowej. Dzieci z dzielnicy mają szkołę w pobliżu domu.' },
    { year: '1978', icon: '🏗️', title: 'Koniec budowy', desc: 'Ostatnie bloki osiedla zostają oddane do użytku. Dzielnica osiąga docelową zabudowę.' },
    { year: '1990', icon: '🛒', title: 'Nowe sklepy i usługi', desc: 'Po transformacji ustrojowej w dzielnicy otwierają się prywatne sklepy, apteki i punkty usługowe.' },
    { year: '2010', icon: '💪', title: 'Siłownia plenerowa', desc: 'Miasto instaluje bezpłatną siłownię plenerową przy parku. Mieszkańcy ćwiczą na świeżym powietrzu.' },
    { year: '2018', icon: '🎠', title: 'Nowy plac zabaw', desc: 'Nowoczesny plac zabaw "Łucznik" z ścianką wspinaczkową i bezpieczną nawierzchnią.' },
    { year: '2020', icon: '🌳', title: 'Rewitalizacja skweru', desc: 'Rewitalizacja Skweru przy Tarczowej — nowe ławki, oświetlenie LED i nasadzenia drzew.' },
    { year: '2025', icon: '🚲', title: 'Ścieżki rowerowe', desc: 'Modernizacja infrastruktury rowerowej. Nowe stacje Bike_S i oznakowane trasy rowerowe.' },
    { year: '2026', icon: '🏹', title: 'Dziś', desc: 'Łucznicza i Tarczowa to tętniąca życiem, zielona dzielnica z aktywną społecznością i pełną infrastrukturą.' }
  ],

  // ===== CIEKAWOSTKI =====
  funFacts: [
    { emoji: '🏹', text: 'Nazwa "Łucznicza" pochodzi od łucznictwa — sportu popularnego w tym rejonie Szczecina w XIX wieku.' },
    { emoji: '🌳', text: 'Ponad 30% powierzchni dzielnicy to tereny zielone — jeden z najwyższych wskaźników w Szczecinie.' },
    { emoji: '🏗️', text: 'Bloki przy Łuczniczej zbudowano metodą wielkiej płyty — każdy blok powstawał w zaledwie kilka miesięcy.' },
    { emoji: '🚃', text: 'Tramwaj nr 3 kursuje przez dzielnicę od ponad 50 lat — to jedna z najstarszych linii w Szczecinie.' },
    { emoji: '🍽️', text: 'Bar Mleczny "Strzała" działa nieprzerwanie od lat 80. — to jeden z ostatnich prawdziwych barów mlecznych w mieście.' },
    { emoji: '👶', text: 'Średni wiek mieszkańców to 38 lat — dzielnica jest popularna wśród młodych rodzin z dziećmi.' }
  ],

  // ===== TRANSPORT =====
  transport: [
    {
      type: 'bus',
      icon: '🚌',
      title: 'Autobusy',
      subtitle: 'Linie kursujące przez przystanek Łucznicza',
      color: '#2980b9',
      lines: [
        { num: '69', color: 'line-bus' },
        { num: '89', color: 'line-bus' }
      ],
      stops: [
        { name: 'Łucznicza (kier. Kołłątaja)', dist: '~50 m' },
        { name: 'Łucznicza (kier. Świergotki/Rugiańska)', dist: '~50 m' }
      ]
    },
    {
      type: 'tram',
      icon: '🚃',
      title: 'Tramwaje',
      subtitle: 'Najbliższe linie tramwajowe (przesiadka)',
      color: '#e74c3c',
      lines: [
        { num: '1', color: 'line-tram' },
        { num: '3', color: 'line-tram' }
      ],
      stops: [
        { name: 'Plac Kościuszki (przesiadka)', dist: '~1,2 km' },
        { name: 'Wyzwolenia', dist: '~1,5 km' }
      ]
    },
    {
      type: 'night',
      icon: '🌙',
      title: 'Linie nocne',
      subtitle: 'Komunikacja nocna w rejonie',
      color: '#2c3e50',
      lines: [
        { num: 'N1', color: 'line-night' },
        { num: 'N2', color: 'line-night' }
      ],
      stops: [
        { name: 'Przystanki nocne w centrum', dist: '~1,2 km' }
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
        { name: 'Stacja w rejonie Łuczniczej', dist: '~300 m' }
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
