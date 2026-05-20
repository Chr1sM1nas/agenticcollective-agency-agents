import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { mockLeaderboard } from '../utils/mockData';
import { Trophy } from 'lucide-react';

type LeaderboardTab = 'Global' | 'Club' | 'Friends';

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Global');

  return (
    <div className="fz-page">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-8 w-8 text-cyan-300" />
          <div>
            <h1 className="fz-title text-white font-bold text-2xl">Leaderboard</h1>
            <p className="text-slate-300 text-sm">Top predictors this season</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 fz-card p-1.5">
          {(['Global', 'Club', 'Friends'] as LeaderboardTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="fz-card p-4">
          {activeTab === 'Global' && <LeaderboardTable entries={mockLeaderboard} />}
          {activeTab === 'Club' && (
            <div className="text-center py-12 text-slate-400">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Club leaderboard coming soon</p>
              <p className="text-sm">Set your team affinity to join a club leaderboard</p>
            </div>
          )}
          {activeTab === 'Friends' && (
            <div className="text-center py-12 text-slate-400">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Friends leaderboard coming soon</p>
              <p className="text-sm">Invite friends to compare predictions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
