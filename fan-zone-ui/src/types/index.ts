export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  ageVerified: boolean;
  dateOfBirth?: string;
  teamAffinity?: string;
  favoritePlayers?: string[];
  xpScore: number;
  predictionAccuracy: number;
  collectiblesCount: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  identityStep: 'anonymous' | 'logged-in' | 'age-verified' | 'premium';
}

export interface Prediction {
  id: string;
  dbId?: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictionType: 'match-result' | 'correct-score' | 'first-goalscorer' | 'cards' | 'possession';
  prediction: string;
  odds?: number;
  xpReward: number;
  status: 'pending' | 'correct' | 'incorrect';
  createdAt: string;
}

export interface ContentItem {
  id: string;
  type: 'video' | 'article' | 'poll' | 'ugc';
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  author: string;
  publishedAt: string;
  likes: number;
  comments: number;
  isAgeGated: boolean;
  tags: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  xpScore: number;
  predictionAccuracy: number;
  correctPredictions: number;
}

export interface Collectible {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  matchDate: string;
  playerName?: string;
  isLimitedEdition: boolean;
  expiresAt?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamEmoji: string;
  awayTeamEmoji: string;
  kickoff: string;
  competition: string;
  status: 'upcoming' | 'live' | 'finished';
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVoted?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface FeedState {
  items: ContentItem[];
  isLoading: boolean;
  error: string | null;
  filter: string;
}
