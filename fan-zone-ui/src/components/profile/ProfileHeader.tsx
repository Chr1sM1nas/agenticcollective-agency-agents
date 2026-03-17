import React from 'react';
import { User } from '../../types';
import { XP_LEVELS } from '../../constants';
import { Star, Target, Package } from 'lucide-react';

interface ProfileHeaderProps {
  user: User;
}

function getCurrentLevel(xp: number) {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
  }
  return current;
}

function getNextLevel(xp: number) {
  return XP_LEVELS.find(l => l.minXp > xp) ?? null;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const currentLevel = getCurrentLevel(user.xpScore);
  const nextLevel = getNextLevel(user.xpScore);
  const xpProgress = nextLevel
    ? ((user.xpScore - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
    : 100;

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
        <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-white text-2xl font-bold">{user.displayName}</h1>
          {user.teamAffinity && <p className="text-slate-400 text-sm mb-1">⚽ {user.teamAffinity} fan</p>}
          <span className="inline-block bg-green-900/40 border border-green-800 text-green-300 text-xs px-3 py-1 rounded-full font-medium mb-3">
            Level {currentLevel.level} · {currentLevel.title}
          </span>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>{user.xpScore.toLocaleString()} XP</span>
            {nextLevel && <span>{nextLevel.minXp.toLocaleString()} XP</span>}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-400"><Star className="h-4 w-4" /><span className="font-semibold">{user.xpScore.toLocaleString()}</span><span className="text-slate-400">XP</span></div>
            <div className="flex items-center gap-1 text-blue-400"><Target className="h-4 w-4" /><span className="font-semibold">{user.predictionAccuracy}%</span><span className="text-slate-400">Accuracy</span></div>
            <div className="flex items-center gap-1 text-purple-400"><Package className="h-4 w-4" /><span className="font-semibold">{user.collectiblesCount}</span><span className="text-slate-400">Collectibles</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
