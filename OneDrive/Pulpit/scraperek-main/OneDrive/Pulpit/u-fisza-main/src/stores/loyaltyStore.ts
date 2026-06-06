const LS_LOYALTY = "fisz_loyalty_stamps";

export interface LoyaltyMilestone {
  stamps: number;
  title: string;
  description: string;
  emoji: string;
  reward: string;
}

export const MILESTONES: LoyaltyMilestone[] = [
  { stamps: 1, title: "Pierwszy łyk", description: "Fisz Cię zauważył", emoji: "👀", reward: "Odznaka 'Nowicjusz'" },
  { stamps: 3, title: "Stały gość", description: "Fisz kiwa płetwą", emoji: "🐟", reward: "Odznaka 'Stały Gość' + kod RYBKA3 (-3%)" },
  { stamps: 5, title: "Przyjaciel Fisza", description: "Fisz zna Twoje imię", emoji: "🎩", reward: "Odznaka 'Przyjaciel Fisza' + kod FISZ5 (-5%)" },
  { stamps: 7, title: "Fisz zdejmuje kapelusz", description: "Szacunek na dzielni", emoji: "🤝", reward: "Odznaka 'VIP Kapelusza' + darmowa dostawa" },
  { stamps: 10, title: "Honorowy Rybak", description: "Fisz płacze ze szczęścia", emoji: "😭", reward: "Odznaka 'Honorowy Rybak' + kod FISZ10 na zawsze" },
  { stamps: 15, title: "Legenda Fisza", description: "Fisz nazwał piwo Twoim imieniem", emoji: "👑", reward: "Odznaka 'Legenda' + kod LEGENDA (-15%)" },
  { stamps: 21, title: "Fisz oddał Ci kapelusz", description: "Jesteś teraz kapitanem", emoji: "🐟👑", reward: "Odznaka 'Kapitan' + 21% stałego rabatu VIP" },
];

export interface LoyaltyData {
  stamps: number;
  earnedBadges: string[];
  lastStampAt: number | null;
}

const loadLoyalty = (): LoyaltyData => {
  try {
    const raw = localStorage.getItem(LS_LOYALTY);
    if (!raw) return { stamps: 0, earnedBadges: [], lastStampAt: null };
    return JSON.parse(raw);
  } catch {
    return { stamps: 0, earnedBadges: [], lastStampAt: null };
  }
};

const saveLoyalty = (data: LoyaltyData) => {
  try {
    localStorage.setItem(LS_LOYALTY, JSON.stringify(data));
  } catch { /* noop */ }
};

export const getLoyaltyData = (): LoyaltyData => loadLoyalty();

export const addStamp = (): LoyaltyMilestone | null => {
  const data = loadLoyalty();
  const prevStamps = data.stamps;
  data.stamps += 1;
  data.lastStampAt = Date.now();
  saveLoyalty(data);

  // Check if we just reached a new milestone
  for (const m of MILESTONES) {
    if (m.stamps === data.stamps) {
      if (!data.earnedBadges.includes(m.title)) {
        data.earnedBadges.push(m.title);
        saveLoyalty(data);
      }
      return m;
    }
  }
  return null;
};

export const getNextMilestone = (): LoyaltyMilestone => {
  const data = loadLoyalty();
  for (const m of MILESTONES) {
    if (data.stamps < m.stamps) return m;
  }
  return MILESTONES[MILESTONES.length - 1];
};
