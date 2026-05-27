import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LEFT_NAV_ITEMS, getActiveLeftNavKey } from '../constants/navigation';
// import { Navbar } from '../components/common/Navbar';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { mockLeaderboard } from '../utils/mockData';
import { Trophy } from 'lucide-react';

type LeaderboardTab = 'Global' | 'Club' | 'Friends';

export const LeaderboardPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Global');

  const activeNavKey = getActiveLeftNavKey(location.pathname);

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100">
      {/* <Navbar /> */}
      <section className="border-b border-[#23253a] bg-[#0f1326] px-3 py-2 sm:px-5">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 text-xs">
          <div className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-200">LEAGUES</div>
          <div className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-300">Social competition</div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-3 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_270px]">
        <aside className="hidden md:block rounded-2xl border border-[#26293d] bg-[#0f1224] p-3 md:sticky md:top-24 md:h-fit">
          <div className="mb-3 px-3 text-[10px] uppercase tracking-[0.14em] text-slate-500">Navigate</div>
          <div className="space-y-1">
            {LEFT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavKey === item.key;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-[#3a1020] text-[#ff5878]' : 'text-slate-300 hover:bg-[#171a2f]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badge === 'LIVE' ? 'bg-[#ef2550] text-white' : 'bg-[#ef2550] text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="xl:col-span-2">
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
        </main>
      </div>
    </div>
  );
};
