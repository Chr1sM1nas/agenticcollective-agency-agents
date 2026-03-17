export const APP_NAME = 'Fan Zone';

export const XP_LEVELS = [
  { level: 1, minXp: 0, title: 'Rookie Fan' },
  { level: 2, minXp: 500, title: 'Supporter' },
  { level: 3, minXp: 1500, title: 'True Fan' },
  { level: 4, minXp: 3000, title: 'Fanatic' },
  { level: 5, minXp: 6000, title: 'Legend' },
];

export const PREDICTION_XP_REWARDS: Record<string, number> = {
  'match-result': 100,
  'correct-score': 300,
  'first-goalscorer': 200,
  'cards': 150,
  'possession': 75,
};

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400 border-slate-400',
  rare: 'text-blue-400 border-blue-400',
  epic: 'text-purple-400 border-purple-400',
  legendary: 'text-yellow-400 border-yellow-400',
};
