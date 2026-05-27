import { ContentItem, Match, LeaderboardEntry, Collectible, Prediction, Poll } from '../types';

export const mockMatches: Match[] = [
  // Dummy Premier League fixtures from June to August 2026
  { id: 'm1', homeTeam: 'Arsenal', awayTeam: 'Man City', homeTeamEmoji: '🔴', awayTeamEmoji: '🔵', kickoff: '2026-06-15T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm2', homeTeam: 'Chelsea', awayTeam: 'Liverpool', homeTeamEmoji: '🔵', awayTeamEmoji: '🔴', kickoff: '2026-06-16T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm3', homeTeam: 'Spurs', awayTeam: 'Everton', homeTeamEmoji: '⚪', awayTeamEmoji: '🔵', kickoff: '2026-06-17T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm4', homeTeam: 'Newcastle', awayTeam: 'Aston Villa', homeTeamEmoji: '⚫', awayTeamEmoji: '🟣', kickoff: '2026-06-18T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm5', homeTeam: 'Brighton', awayTeam: 'West Ham', homeTeamEmoji: '🔵', awayTeamEmoji: '⚒️', kickoff: '2026-06-19T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm6', homeTeam: 'Man United', awayTeam: 'Leeds', homeTeamEmoji: '🔴', awayTeamEmoji: '⚪', kickoff: '2026-06-20T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm7', homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeTeamEmoji: '🔴', awayTeamEmoji: '🔵', kickoff: '2026-07-01T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm8', homeTeam: 'Liverpool', awayTeam: 'Spurs', homeTeamEmoji: '🔴', awayTeamEmoji: '⚪', kickoff: '2026-07-08T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm9', homeTeam: 'Man City', awayTeam: 'Newcastle', homeTeamEmoji: '🔵', awayTeamEmoji: '⚫', kickoff: '2026-07-15T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm10', homeTeam: 'Aston Villa', awayTeam: 'Brighton', homeTeamEmoji: '🟣', awayTeamEmoji: '🔵', kickoff: '2026-07-22T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm11', homeTeam: 'West Ham', awayTeam: 'Man United', homeTeamEmoji: '⚒️', awayTeamEmoji: '🔴', kickoff: '2026-07-29T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm12', homeTeam: 'Leeds', awayTeam: 'Arsenal', homeTeamEmoji: '⚪', awayTeamEmoji: '🔴', kickoff: '2026-08-05T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm13', homeTeam: 'Chelsea', awayTeam: 'Man City', homeTeamEmoji: '🔵', awayTeamEmoji: '🔵', kickoff: '2026-08-12T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm14', homeTeam: 'Everton', awayTeam: 'Liverpool', homeTeamEmoji: '🔵', awayTeamEmoji: '🔴', kickoff: '2026-08-19T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
  { id: 'm15', homeTeam: 'Spurs', awayTeam: 'Aston Villa', homeTeamEmoji: '⚪', awayTeamEmoji: '🟣', kickoff: '2026-08-26T19:00:00Z', competition: 'Premier League', status: 'upcoming' },
];

export const mockContent: ContentItem[] = [
  { id: 'c1', type: 'video', title: 'Top 10 Goals of the Season', description: 'Watch the most spectacular goals from this season compiled into one epic video.', imageUrl: 'https://picsum.photos/seed/goal/400/225', videoUrl: '#', author: 'FanZone TV', publishedAt: '2025-06-10T10:00:00Z', likes: 1240, comments: 89, isAgeGated: false, tags: ['goals', 'highlights'] },
  { id: 'c2', type: 'article', title: 'Arsenal Tactical Preview: What to Expect', description: "A deep dive into Arsenal's formation and expected tactics for the upcoming derby. Mikel Arteta has some tricky decisions to make.", imageUrl: 'https://picsum.photos/seed/arsenal/400/225', author: 'TacticsTalk', publishedAt: '2025-06-11T08:00:00Z', likes: 540, comments: 32, isAgeGated: false, tags: ['arsenal', 'tactics'] },
  { id: 'c3', type: 'poll', title: 'Who will win the title this season?', description: 'Cast your vote!', author: 'FanZone', publishedAt: '2025-06-09T12:00:00Z', likes: 890, comments: 145, isAgeGated: false, tags: ['poll', 'prediction'] },
  { id: 'c4', type: 'ugc', title: 'My matchday experience at the Emirates', description: "I attended last night's match and it was absolutely electric. Here's my fan account of the experience.", imageUrl: 'https://picsum.photos/seed/stadium/400/225', author: 'GunnerFan88', publishedAt: '2025-06-08T20:00:00Z', likes: 234, comments: 18, isAgeGated: false, tags: ['ugc', 'matchday'] },
  { id: 'c5', type: 'video', title: 'Press Conference Highlights', description: "Manager's pre-match press conference key moments.", imageUrl: 'https://picsum.photos/seed/presser/400/225', videoUrl: '#', author: 'FanZone TV', publishedAt: '2025-06-12T14:00:00Z', likes: 320, comments: 27, isAgeGated: false, tags: ['press', 'manager'] },
  { id: 'c6', type: 'article', title: 'Transfer Rumours: Summer Window Preview', description: 'All the latest transfer gossip and confirmed moves as the summer window heats up.', imageUrl: 'https://picsum.photos/seed/transfer/400/225', author: 'TransferInsider', publishedAt: '2025-06-13T09:00:00Z', likes: 1890, comments: 312, isAgeGated: false, tags: ['transfers', 'rumours'] },
  { id: 'c7', type: 'ugc', title: 'Matchday atmosphere compilation', description: 'Fan-captured moments from grounds around the country this weekend.', imageUrl: 'https://picsum.photos/seed/fans/400/225', author: 'AtmosphereKing', publishedAt: '2025-06-07T18:00:00Z', likes: 445, comments: 55, isAgeGated: false, tags: ['ugc', 'atmosphere'] },
  { id: 'c8', type: 'video', title: 'Player of the Month Award Ceremony', description: "Watch the award ceremony and exclusive interview with this month's winner.", imageUrl: 'https://picsum.photos/seed/award/400/225', videoUrl: '#', author: 'FanZone TV', publishedAt: '2025-06-06T16:00:00Z', likes: 678, comments: 43, isAgeGated: false, tags: ['award', 'player'] },
  { id: 'c9', type: 'article', title: 'Youth Academy Talent to Watch', description: 'Ten players from academy setups across the league that you should be watching closely this season.', imageUrl: 'https://picsum.photos/seed/youth/400/225', author: 'ScoutReport', publishedAt: '2025-06-05T11:00:00Z', likes: 290, comments: 22, isAgeGated: false, tags: ['youth', 'academy'] },
  { id: 'c10', type: 'poll', title: 'Best kit of the season?', description: 'Which club has the best kit design this season?', author: 'FanZone', publishedAt: '2025-06-04T10:00:00Z', likes: 567, comments: 78, isAgeGated: false, tags: ['poll', 'kit'] },
  { id: 'c11', type: 'video', title: 'Referee Analysis: Controversial Decisions', description: 'Former referee breaks down the most controversial calls from recent matches.', imageUrl: 'https://picsum.photos/seed/referee/400/225', videoUrl: '#', author: 'RefWatch', publishedAt: '2025-06-03T13:00:00Z', likes: 912, comments: 234, isAgeGated: false, tags: ['referee', 'analysis'] },
  { id: 'c12', type: 'ugc', title: 'My prediction sheet - season record', description: "Sharing my full season prediction record. I'm at 67% accuracy!", imageUrl: 'https://picsum.photos/seed/predictions/400/225', author: 'PredictionKing', publishedAt: '2025-06-02T09:00:00Z', likes: 156, comments: 33, isAgeGated: false, tags: ['ugc', 'predictions'] },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', displayName: 'PredictionKing', xpScore: 12500, predictionAccuracy: 78, correctPredictions: 156 },
  { rank: 2, userId: 'u2', displayName: 'FootballOracle', xpScore: 11200, predictionAccuracy: 74, correctPredictions: 142 },
  { rank: 3, userId: 'u3', displayName: 'GoalMachine99', xpScore: 9800, predictionAccuracy: 71, correctPredictions: 128 },
  { rank: 4, userId: 'u4', displayName: 'TacticalGenius', xpScore: 8750, predictionAccuracy: 68, correctPredictions: 115 },
  { rank: 5, userId: 'u5', displayName: 'MatchdayHero', xpScore: 7900, predictionAccuracy: 65, correctPredictions: 108 },
  { rank: 6, userId: 'u6', displayName: 'FanZoneLegend', xpScore: 6500, predictionAccuracy: 63, correctPredictions: 95 },
  { rank: 7, userId: 'u7', displayName: 'GoaldenBoot', xpScore: 5800, predictionAccuracy: 61, correctPredictions: 87 },
  { rank: 8, userId: 'u8', displayName: 'UltraFan', xpScore: 4900, predictionAccuracy: 58, correctPredictions: 76 },
  { rank: 9, userId: 'demo-user', displayName: 'DemoFan', xpScore: 4200, predictionAccuracy: 56, correctPredictions: 68 },
  { rank: 10, userId: 'u10', displayName: 'NewcomerFC', xpScore: 3500, predictionAccuracy: 54, correctPredictions: 58 },
  { rank: 11, userId: 'u11', displayName: 'DeadballSpecialist', xpScore: 2800, predictionAccuracy: 51, correctPredictions: 45 },
  { rank: 12, userId: 'u12', displayName: 'RookieFan', xpScore: 1200, predictionAccuracy: 48, correctPredictions: 24 },
];

export const mockCollectibles: Collectible[] = [
  { id: 'col1', name: 'Hat-Trick Hero', description: 'Awarded for predicting a hat-trick correctly', imageUrl: '⚽', rarity: 'legendary', matchDate: '2025-05-01', playerName: 'Erling Haaland', isLimitedEdition: true, expiresAt: '2025-07-01' },
  { id: 'col2', name: 'Perfect Prediction', description: 'Correct score prediction', imageUrl: '🎯', rarity: 'epic', matchDate: '2025-04-15', isLimitedEdition: false },
  { id: 'col3', name: 'Derby Day', description: 'Participated in a local derby prediction', imageUrl: '🏟️', rarity: 'rare', matchDate: '2025-04-01', isLimitedEdition: false },
  { id: 'col4', name: 'Early Bird', description: 'First prediction of the season', imageUrl: '🌅', rarity: 'common', matchDate: '2025-08-12', isLimitedEdition: false },
  { id: 'col5', name: 'Clean Sheet Prophet', description: 'Correctly predicted a clean sheet', imageUrl: '🧤', rarity: 'rare', matchDate: '2025-03-22', playerName: 'Alisson Becker', isLimitedEdition: false },
  { id: 'col6', name: 'Title Clincher', description: 'Correctly predicted the title winner', imageUrl: '🏆', rarity: 'legendary', matchDate: '2025-05-15', isLimitedEdition: true, expiresAt: '2025-06-30' },
  { id: 'col7', name: 'Comeback King', description: 'Predicted a comeback victory', imageUrl: '⚡', rarity: 'epic', matchDate: '2025-03-01', isLimitedEdition: false },
  { id: 'col8', name: 'Opening Day', description: 'Made a prediction on opening day', imageUrl: '🎉', rarity: 'common', matchDate: '2025-08-09', isLimitedEdition: false },
  { id: 'col9', name: 'Five Star', description: 'Correctly predicted a 5+ goal game', imageUrl: '⭐', rarity: 'epic', matchDate: '2025-02-14', isLimitedEdition: false },
  { id: 'col10', name: 'Fan Favourite', description: 'Most liked prediction of the week', imageUrl: '❤️', rarity: 'rare', matchDate: '2025-01-28', isLimitedEdition: false },
  { id: 'col11', name: 'Street Footballer', description: 'Completed beginner tutorials', imageUrl: '👟', rarity: 'common', matchDate: '2025-01-15', isLimitedEdition: false },
  { id: 'col12', name: 'Penalty Specialist', description: 'Correctly predicted penalty shootout outcome', imageUrl: '🥅', rarity: 'rare', matchDate: '2024-12-20', isLimitedEdition: false },
];

export const mockPredictions: Prediction[] = [
  { id: 'p1', matchId: 'm1', homeTeam: 'Arsenal', awayTeam: 'Chelsea', predictionType: 'match-result', prediction: 'Arsenal Win', odds: 1.85, xpReward: 100, status: 'pending', createdAt: '2025-06-10T09:00:00Z' },
  { id: 'p2', matchId: 'm2', homeTeam: 'Liverpool', awayTeam: 'Man City', predictionType: 'correct-score', prediction: '2-1', odds: 8.5, xpReward: 300, status: 'correct', createdAt: '2025-06-08T10:00:00Z' },
  { id: 'p3', matchId: 'm3', homeTeam: 'Spurs', awayTeam: 'Man United', predictionType: 'first-goalscorer', prediction: 'Son Heung-min', odds: 4.2, xpReward: 200, status: 'incorrect', createdAt: '2025-06-07T14:00:00Z' },
  { id: 'p4', matchId: 'm4', homeTeam: 'Everton', awayTeam: 'Aston Villa', predictionType: 'cards', prediction: '3+ cards', odds: 2.1, xpReward: 150, status: 'correct', createdAt: '2025-06-06T11:00:00Z' },
  { id: 'p5', matchId: 'm5', homeTeam: 'Newcastle', awayTeam: 'Brighton', predictionType: 'possession', prediction: 'Newcastle 55%+', odds: 1.95, xpReward: 75, status: 'pending', createdAt: '2025-06-05T16:00:00Z' },
];

export const mockPolls: Poll[] = [
  { id: 'poll1', question: 'Who will win the Premier League this season?', options: [ { id: 'o1', text: 'Arsenal', votes: 3420 }, { id: 'o2', text: 'Man City', votes: 2890 }, { id: 'o3', text: 'Liverpool', votes: 2100 }, { id: 'o4', text: 'Chelsea', votes: 890 } ], totalVotes: 9300, userVoted: undefined },
  { id: 'poll2', question: 'Best Premier League player this season?', options: [ { id: 'o5', text: 'Erling Haaland', votes: 4200 }, { id: 'o6', text: 'Mohamed Salah', votes: 3100 }, { id: 'o7', text: 'Bukayo Saka', votes: 2800 }, { id: 'o8', text: 'Phil Foden', votes: 1900 } ], totalVotes: 12000, userVoted: undefined },
  { id: 'poll3', question: 'Which game are you most excited for this weekend?', options: [ { id: 'o9', text: 'Arsenal vs Chelsea', votes: 5600 }, { id: 'o10', text: 'Liverpool vs Man City', votes: 7200 }, { id: 'o11', text: 'Spurs vs Man United', votes: 2100 } ], totalVotes: 14900, userVoted: undefined },
];
