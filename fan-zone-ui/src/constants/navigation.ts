import { Circle, Flame, Gem, Gift, Home, Shield, Trophy, Users, type LucideIcon } from 'lucide-react';

export type LeftNavKey =
  | 'home-feed'
  | 'match-hub'
  | 'predictions'
  | 'friend-leagues'
  | 'collectibles'
  | 'live-drops'
  | 'leaderboard'
  | 'rewards'
  | 'sponsor-zone';

export interface LeftNavItem {
  key: LeftNavKey;
  label: string;
  to: string;
  icon: LucideIcon;
  badge: string;
}

export const LEFT_NAV_ITEMS: LeftNavItem[] = [
  { key: 'home-feed', label: 'Match Hub', to: '/dashboard', icon: Home, badge: '' },
  { key: 'match-hub', label: 'Match Predictions', to: '/predictions', icon: Circle, badge: 'LIVE' },
  { key: 'friend-leagues', label: 'Friend Leagues', to: '/leaderboard', icon: Users, badge: '' },
  { key: 'collectibles', label: 'Collectibles', to: '/collectibles', icon: Gem, badge: '2' },
  { key: 'live-drops', label: 'Live Drops', to: '/live-drops', icon: Flame, badge: '' },
  { key: 'leaderboard', label: 'Leaderboard', to: '/leaderboard', icon: Trophy, badge: '' },
  { key: 'rewards', label: 'Rewards', to: '/collectibles', icon: Gift, badge: '' },
  { key: 'sponsor-zone', label: 'Sponsor Zone', to: '/sponsor-zone', icon: Shield, badge: '' },
];

export function getActiveLeftNavKey(pathname: string): LeftNavKey | undefined {
  if (pathname.startsWith('/dashboard')) return 'home-feed';
  if (pathname.startsWith('/predictions')) return 'match-hub';
  if (pathname.startsWith('/leaderboard')) return 'friend-leagues';
  if (pathname.startsWith('/collectibles')) return 'collectibles';
  return undefined;
}