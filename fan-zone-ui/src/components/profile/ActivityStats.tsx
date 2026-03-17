import React from 'react';
import { User } from '../../types';
import { Star, Target, Zap, Trophy, Package, TrendingUp } from 'lucide-react';

interface ActivityStatsProps {
  user: User;
}

export const ActivityStats: React.FC<ActivityStatsProps> = ({ user }) => {
  const stats = [
    { label: 'Total XP', value: user.xpScore.toLocaleString(), icon: Star, color: 'text-green-400', bg: 'bg-green-900/30' },
    { label: 'Prediction Accuracy', value: `${user.predictionAccuracy}%`, icon: Target, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Win Streak', value: '5', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
    { label: 'Total Predictions', value: '68', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-900/30' },
    { label: 'Collectibles', value: user.collectiblesCount.toString(), icon: Package, color: 'text-pink-400', bg: 'bg-pink-900/30' },
    { label: 'Global Rank', value: '#9', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-900/30' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-slate-700`}>
          <div className={`${stat.color} mb-2`}><stat.icon className="h-5 w-5" /></div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};
