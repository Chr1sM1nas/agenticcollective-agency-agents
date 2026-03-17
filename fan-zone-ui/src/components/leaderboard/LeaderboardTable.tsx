import React from 'react';
import { LeaderboardEntry } from '../../types';
import { Trophy } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ entries }) => {
  const { user } = useAuth();

  const rankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-slate-500';
  };

  const rowStyle = (entry: LeaderboardEntry) => {
    if (entry.userId === user?.id) return 'bg-green-900/30 border-green-800';
    if (entry.rank <= 3) return 'bg-slate-700/50';
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-2 text-slate-400 font-medium w-16">Rank</th>
            <th className="text-left py-3 px-2 text-slate-400 font-medium">Player</th>
            <th className="text-right py-3 px-2 text-slate-400 font-medium">XP</th>
            <th className="text-right py-3 px-2 text-slate-400 font-medium">Accuracy</th>
            <th className="text-right py-3 px-2 text-slate-400 font-medium hidden md:table-cell">Correct</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.userId} className={`border-b border-slate-700/50 ${rowStyle(entry)} transition-colors`}>
              <td className="py-3 px-2">
                <div className={`flex items-center gap-1 font-bold ${rankStyle(entry.rank)}`}>
                  {entry.rank <= 3 && <Trophy className="h-4 w-4" />}
                  #{entry.rank}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-medium ${entry.userId === user?.id ? 'text-green-300' : 'text-white'}`}>
                    {entry.displayName}
                    {entry.userId === user?.id && <span className="ml-1 text-xs text-green-400">(you)</span>}
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-green-400 font-semibold">{entry.xpScore.toLocaleString()}</td>
              <td className="py-3 px-2 text-right text-blue-400">{entry.predictionAccuracy}%</td>
              <td className="py-3 px-2 text-right text-slate-300 hidden md:table-cell">{entry.correctPredictions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
