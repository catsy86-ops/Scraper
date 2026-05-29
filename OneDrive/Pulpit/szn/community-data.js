/**
 * Community Real-Time Data Module
 * Dane o mieszkańcach, aktywności społeczności, eventy, recenzje
 */

'use strict';

const COMMUNITY_DATA = {
  // Statystyki dzielnice
  stats: {
    population: 4250,
    households: 1680,
    avgAge: 38,
    families: 890,
    seniors: 520,
    students: 380,
    workingAge: 2460,
    growthRate: 2.1, // % per year
    areaSize: 0.42, // km²
    density: 10119, // persons/km²
  },

  // Raporty demograficzne
  demographics: {
    ageGroups: {
      '0-17': { count: 380, pct: 9 },
      '18-34': { count: 920, pct: 22 },
      '35-54': { count: 1580, pct: 37 },
      '55-74': { count: 980, pct: 23 },
      '75+': { count: 390, pct: 9 }
    },
    employment: {
      employed: 2100,
      unemployed: 85,
      retired: 890,
      students: 380,
      other: 795
    },
    housing: {
      apartments: 1480,
      houses: 150,
      avg_rooms: 3.2,
      avg_sqm: 58,
    }
  },

  // Live aktywność mieszkańców
  liveActivity: [
    {
      id: 'act1',
      time: 'teraz',
      icon: '🏃',
      title: 'Jogging w parku',
      desc: 'Około 8-12 osób biega w Skwerze przy Tarczowej',
      location: 'Skwer przy Tarczowej',
      participants: 10,
      trending: true
    },
    {
      id: 'act2',
      time: '15 min temu',
      icon: '⚽',
      title: 'Mecz piłkarski',
      desc: 'Gra toczy się na boisku sportowym - dwa zespoły po 6 osób',
      location: 'Boisko Sportowe Łucznicza',
      participants: 12,
      trending: true
    },
    {
      id: 'act3',
      time: '30 min temu',
      icon: '🎨',
      title: 'Warsztaty artystyczne',
      desc: 'Młodzież tworzy murale na ścianie szkoły',
      location: 'Szkoła Podstawowa nr 47',
      participants: 6,
      trending: false
    },
    {
      id: 'act4',
      time: '1h temu',
      icon: '👶',
      title: 'Spacerowiczka dla matek',
      desc: 'Mamy z wózkami się spotykają na spacerze',
      location: 'Skwer przy Tarczowej',
      participants: 15,
      trending: false
    },
    {
      id: 'act5',
      time: '2h temu',
      icon: '🍽️',
      title: 'Lunch w barze mlecznym',
      desc: 'Tłumy pracowników na obiad - kolejki na żurek',
      location: 'Bar Mleczny "Strzała"',
      participants: 25,
      trending: true
    }
  ],

  // Eventy społeczności - real time
  events: [
    {
      id: 'ev1',
      date: 'dzisiaj',
      time: '17:00',
      icon: '🎉',
      title: 'Spotkanie Mieszkańców',
      desc: 'Cotygodniowe spotkanie w świetlicy szkolnej - omówienie spraw dzielnice',
      location: 'Szkoła Podstawowa nr 47',
      attendees: 24,
      registered: 31,
      status: 'scheduled',
      organizer: 'Rada Osiedla'
    },
    {
      id: 'ev2',
      date: 'jutro',
      time: '09:00',
      icon: '🏃‍♀️',
      title: 'Zbiorowy Bieg',
      desc: '5km bieg przez dzielnicę - zawodnicy każdego poziomu zaproszeni',
      location: 'Park Poczta Główna',
      attendees: 0,
      registered: 47,
      status: 'upcoming',
      organizer: 'Klub Biegaczy Szczecin'
    },
    {
      id: 'ev3',
      date: '31 maja',
      time: '18:00',
      icon: '🎵',
      title: 'Koncert Lokalnych Zespołów',
      desc: 'Festiwal muzyki - punk, indie, folk na scenie w parku',
      location: 'Skwer przy Tarczowej',
      attendees: 0,
      registered: 156,
      status: 'upcoming',
      organizer: 'Stowarzyszenie Artystów'
    },
    {
      id: 'ev4',
      date: '1 czerwca',
      time: '14:00',
      icon: '👶',
      title: 'Dzień Dziecka w Parku',
      desc: 'Zabawy dla dzieci, konkursy, nagrody i darmowe lody',
      location: 'Skwer przy Tarczowej',
      attendees: 0,
      registered: 89,
      status: 'upcoming',
      organizer: 'Szkoła Podstawowa nr 47'
    }
  ],

  // Recenzje mieszkańców
  reviews: [
    {
      id: 'rev1',
      author: 'Anna M.',
      rating: 5,
      date: '2 dni temu',
      place: 'Bar Mleczny "Strzała"',
      text: 'Najlepsza żurówka w Szczecinie! Zawsze gorące i smaczne. Obsługa miła i szybka. Ceny przystępne. Polecam!',
      helpful: 24,
      category: 'food'
    },
    {
      id: 'rev2',
      author: 'Piotr K.',
      rating: 4,
      date: '5 dni temu',
      place: 'Skwer przy Tarczowej',
      text: 'Fajny park dla spacerów. Niestety brakuje więcej koszy na śmieci. Świetne miejsce dla rodzin z dziećmi.',
      helpful: 18,
      category: 'park'
    },
    {
      id: 'rev3',
      author: 'Magdalena T.',
      rating: 5,
      date: '1 dzień temu',
      place: 'Boisko Sportowe Łucznicza',
      text: 'Dzieci uwielbiają! Boisko w dobrym stanie, oświetlenie działa. Czasami jest za pełne, ale OK dla bezpłatnego boisku.',
      helpful: 31,
      category: 'sport'
    },
    {
      id: 'rev4',
      author: 'Jan S.',
      rating: 4,
      date: '3 dni temu',
      place: 'Szkoła Podstawowa nr 47',
      text: 'Szkoła dobrze zorganizowana. Nauczyciele zaangażowani. Mogłoby być więcej zajęć dodatkowych.',
      helpful: 12,
      category: 'edu'
    }
  ],

  // Społeczność i grupy
  groups: [
    {
      id: 'grp1',
      name: 'Rodzice Szkoły nr 47',
      icon: '👨‍👩‍👧‍👦',
      members: 287,
      activity: 'very_active',
      description: 'Grupa rodziców uczniów SP47 - porady, wspólne organizacje, spotkania',
      lastPost: '30 min temu'
    },
    {
      id: 'grp2',
      name: 'Biegacze Łuczniczej',
      icon: '🏃‍♂️',
      members: 142,
      activity: 'active',
      description: 'Wspólne biegi, treningi, zawody lokalnych biegaczy',
      lastPost: '2h temu'
    },
    {
      id: 'grp3',
      name: 'Rada Osiedla Łucznicza',
      icon: '🏛️',
      members: 38,
      activity: 'active',
      description: 'Oficjalny organ samodzielności terytorialnej',
      lastPost: '4h temu'
    },
    {
      id: 'grp4',
      name: 'Wolontariusze Okolicy',
      icon: '❤️',
      members: 56,
      activity: 'moderate',
      description: 'Pomagamy innym mieszkańcom - zakupy, reparacje, opieka',
      lastPost: '6h temu'
    },
    {
      id: 'grp5',
      name: 'Mieszkańcy Tarczowej',
      icon: '🏠',
      members: 203,
      activity: 'active',
      description: 'Nieformalna grupa mieszkańców ulicy Tarczowej - wymiana informacji',
      lastPost: '1h temu'
    }
  ],

  // Rekomendacje od mieszkańców
  recommendations: [
    {
      id: 'rec1',
      author: 'Krzysztof D.',
      type: 'must_see',
      title: 'Najlepszy spacer o zachodzie słońca',
      description: 'Idź przez Skwer przy Tarczowej o 20:00 - piękne widoki',
      poi: 'Skwer przy Tarczowej',
      votes: 87
    },
    {
      id: 'rec2',
      author: 'Elżbieta W.',
      type: 'tip',
      title: 'Gdzie kupić najlepsze bułki?',
      description: 'Codziennie o 6:30 w Sklepie Spożywczym świeże pieczywo z pieca',
      poi: 'Sklep Spożywczy',
      votes: 52
    },
    {
      id: 'rec3',
      author: 'Tomasz P.',
      type: 'event',
      title: 'Piątkowe mecze towarzyskie',
      description: 'Każdy piątek o 18:00 gra w piłkę nożną - dołącz do nas!',
      poi: 'Boisko Sportowe Łucznicza',
      votes: 64
    }
  ],

  // Ankiety społeczności
  surveys: [
    {
      id: 'surv1',
      question: 'Czy chciałbyś więcej zieleni w dzielnicy?',
      options: [
        { text: 'Zdecydowanie tak', votes: 234 },
        { text: 'Raczej tak', votes: 156 },
        { text: 'Nieważne', votes: 89 },
        { text: 'Raczej nie', votes: 34 },
        { text: 'Zdecydowanie nie', votes: 12 }
      ],
      total: 525,
      status: 'active'
    },
    {
      id: 'surv2',
      question: 'Jak oceniasz stan boiska sportowego?',
      options: [
        { text: 'Doskonały', votes: 127 },
        { text: 'Dobry', votes: 198 },
        { text: 'Zadowalający', votes: 142 },
        { text: 'Słaby', votes: 78 },
        { text: 'Niedostateczny', votes: 45 }
      ],
      total: 590,
      status: 'active'
    }
  ],

  // Wiadomości z okolicy
  news: [
    {
      id: 'news1',
      title: 'Remont drogi na Łuczniczej - wznowienie prac',
      desc: 'Prace drogowe wznawiane od przyszłego poniedziałku. Spodziewaj się utrudnień w ruchu.',
      date: '29 maja 2026',
      source: 'Urząd Miasta',
      category: 'infrastructure'
    },
    {
      id: 'news2',
      title: 'Nowe oświetlenie LED w parku',
      desc: 'Park przy Tarczowej wyposażony w nowoczesne energooszczędne lampki. Wejście od przyszłego tygodnia.',
      date: '28 maja 2026',
      source: 'Rada Osiedla',
      category: 'improvement'
    },
    {
      id: 'news3',
      title: 'Konsultacje społeczne - zagospodarowanie placu',
      desc: 'Mieszkańcy zaproszeni do głosowania na przyszłe zagospodarowanie nieruchomości obok szkoły.',
      date: '27 maja 2026',
      source: 'Rada Osiedla',
      category: 'community'
    }
  ]
};

// ===== FUNKCJE REAL-TIME =====

/**
 * Pobierz statystyki dzielnice
 */
function getNeighborhoodStats() {
  return {
    population: COMMUNITY_DATA.stats.population,
    households: COMMUNITY_DATA.stats.households,
    avgAge: COMMUNITY_DATA.stats.avgAge,
    density: COMMUNITY_DATA.stats.density,
    area: COMMUNITY_DATA.stats.areaSize,
    growth: COMMUNITY_DATA.stats.growthRate
  };
}

/**
 * Pobierz live aktywność
 */
function getLiveActivity() {
  // Sort by trending and time
  return COMMUNITY_DATA.liveActivity
    .sort((a, b) => {
      if (a.trending !== b.trending) return b.trending - a.trending;
      return a.participants - b.participants;
    })
    .slice(0, 5);
}

/**
 * Pobierz nadchodzące eventy
 */
function getUpcomingEvents(daysAhead = 7) {
  return COMMUNITY_DATA.events
    .filter(e => e.status === 'scheduled' || e.status === 'upcoming')
    .slice(0, 3);
}

/**
 * Pobierz najlepsze recenzje
 */
function getTopReviews(limit = 5) {
  return COMMUNITY_DATA.reviews
    .sort((a, b) => b.helpful - a.helpful)
    .slice(0, limit);
}

/**
 * Pobierz aktywne grupy
 */
function getActiveGroups() {
  return COMMUNITY_DATA.groups
    .filter(g => g.activity === 'very_active' || g.activity === 'active')
    .sort((a, b) => b.members - a.members);
}

/**
 * Pobierz rekomendacje
 */
function getRecommendations(type = null) {
  let recs = COMMUNITY_DATA.recommendations;
  if (type) recs = recs.filter(r => r.type === type);
  return recs.sort((a, b) => b.votes - a.votes);
}

/**
 * Pobierz wiadomości
 */
function getCommunityNews(limit = 3) {
  return COMMUNITY_DATA.news.slice(0, limit);
}

/**
 * Pobierz dane demograficzne
 */
function getDemographics() {
  return COMMUNITY_DATA.demographics;
}

/**
 * Pobierz ankiety
 */
function getSurveys() {
  return COMMUNITY_DATA.surveys;
}

/**
 * Symuluj zmianę aktywności (real-time effect)
 */
function simulateLiveActivity() {
  COMMUNITY_DATA.liveActivity.forEach(activity => {
    // Zmień liczbę uczestników ±
    activity.participants += Math.floor(Math.random() * 5) - 2;
    activity.participants = Math.max(1, activity.participants);
  });
}

// Zaktualizuj aktywność co 30 sekund
setInterval(simulateLiveActivity, 30000);

// ===== EXPORT =====
window.communityAPI = {
  getStats: getNeighborhoodStats,
  getLiveActivity: getLiveActivity,
  getEvents: getUpcomingEvents,
  getReviews: getTopReviews,
  getGroups: getActiveGroups,
  getRecommendations: getRecommendations,
  getNews: getCommunityNews,
  getDemographics: getDemographics,
  getSurveys: getSurveys,
  getAllData: () => COMMUNITY_DATA
};
