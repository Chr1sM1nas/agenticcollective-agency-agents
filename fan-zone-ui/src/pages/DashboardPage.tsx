import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeed } from '../hooks/useFeed';
import { useLiveMatches } from '../hooks/useLiveMatches';
import { mockLeaderboard } from '../utils/mockData';
import { Bolt, Circle, Flame, Gem, Gift, Home, Medal, Shield, Target, Trophy, Users } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { items, fetchContent } = useFeed();
  const { matches: liveMatches, isLoading: isLiveLoading, error: liveError } = useLiveMatches();

  useEffect(() => {
    if (items.length === 0) fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featuredFeed = items.slice(0, 3);
  const liveTickerMatches = liveMatches.slice(0, 2);
  const primaryLiveMatch = liveMatches[0];
  const liveSourceLabel = isLiveLoading ? 'Syncing' : liveMatches.length > 0 ? 'Live API' : 'Fallback';
  const liveSourceClass =
    liveSourceLabel === 'Live API'
      ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
      : liveSourceLabel === 'Syncing'
        ? 'border-sky-400/50 bg-sky-500/10 text-sky-300'
        : 'border-amber-400/50 bg-amber-500/10 text-amber-300';

  const xpCurrent = user?.xpScore ?? 2840;
  const xpTarget = 4200;
  const xpPercent = Math.min(100, Math.round((xpCurrent / xpTarget) * 100));
  const accuracy = user?.predictionAccuracy ?? 68;
  const streak = 7;
  const collectibles = user?.collectiblesCount ?? 12;
  const leaderboardTop = mockLeaderboard.slice(0, 4);
  const myEntry = mockLeaderboard.find((entry) => entry.userId === user?.id);

  const leftMenu = [
    { label: 'Home Feed', to: '/dashboard', icon: Home, badge: '' },
    { label: 'Match Hub', to: '/predictions', icon: Circle, badge: 'LIVE' },
    { label: 'Predictions', to: '/predictions', icon: Target, badge: '' },
    { label: 'Friend Leagues', to: '/leaderboard', icon: Users, badge: '' },
    { label: 'Collectibles', to: '/collectibles', icon: Gem, badge: '2' },
    { label: 'Live Drops', to: '/collectibles', icon: Flame, badge: '' },
    { label: 'Leaderboard', to: '/leaderboard', icon: Trophy, badge: '' },
    { label: 'Rewards', to: '/collectibles', icon: Gift, badge: '' },
    { label: 'Sponsor Zone', to: '/collectibles', icon: Shield, badge: '' },
  ];

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100">
      <Navbar />

      <section className="border-b border-[#23253a] bg-[#0f1326] px-3 py-2 sm:px-5">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 text-xs">
          <div className="fz-live-glow rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-[#58ff83]">LIVE</div>
          <div className={`rounded-full border px-3 py-1 font-semibold ${liveSourceClass}`}>Data source: {liveSourceLabel}</div>
          {isLiveLoading && <div className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-300">Loading Premier League live feed...</div>}
          {!isLiveLoading && liveTickerMatches.length === 0 && <div className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-300">No EPL matches live right now</div>}
          {!isLiveLoading && liveError && <div className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-300">Live API unavailable</div>}
          {liveTickerMatches.map((match) => (
            <div key={match.id} className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-300">
              {match.homeTeam} <span className="text-[#4cff7f]">{match.homeScore}-{match.awayScore}</span> {match.awayTeam} • {match.minute}'
            </div>
          ))}
          <div className="ml-auto rounded-full bg-[#f5b326] px-3 py-1 font-bold text-[#2f2202]">{xpCurrent.toLocaleString()} XP</div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 p-3 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_270px]">
        <aside className="hidden md:block rounded-2xl border border-[#26293d] bg-[#0f1224] p-3 md:sticky md:top-24 md:h-fit">
          <div className="mb-3 px-3 text-[10px] uppercase tracking-[0.14em] text-slate-500">Navigate</div>
          <div className="space-y-1">
            {leftMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
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

        <main className="space-y-4">
          <section className="rounded-2xl border border-[#5f2e34] bg-gradient-to-r from-[#46220f] to-[#4a1020] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-[#ffb53f]">7-Match Streak!</div>
                <div className="text-sm text-slate-200">Keep it going — Arsenal vs Chelsea prediction closes in 28 mins</div>
              </div>
              <button className="rounded-full bg-[#ff1847] px-4 py-2 text-sm font-bold text-white">Predict Now</button>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Match Hub</h2>
              <Link to="/predictions" className="text-sm font-semibold text-[#ff2b57]">See all</Link>
            </div>

            <div className="rounded-2xl border border-[#292d46] bg-gradient-to-br from-[#1a2144] via-[#251434] to-[#111a41] p-4">
              <div className="mb-5 flex items-center justify-between text-xs text-slate-300">
                <span className="fz-live-glow rounded-full bg-[#0d5f3b] px-2 py-1 font-semibold text-[#44f08c]">LIVE NOW</span>
                <span>{primaryLiveMatch?.league ?? 'Premier League · Matchday'}</span>
                <span>{primaryLiveMatch?.venue ?? 'Stadium'}</span>
              </div>
              <div className="mb-6 grid grid-cols-3 items-center text-center">
                <div>
                  <div className="mx-auto mb-2 h-6 w-6 rounded-full bg-[#ff273f]" />
                  <div className="text-xl font-bold">{primaryLiveMatch?.homeTeam ?? 'Arsenal'}</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold tracking-tight">{primaryLiveMatch ? `${primaryLiveMatch.homeScore}-${primaryLiveMatch.awayScore}` : '2-1'}</div>
                  <div className="text-sm text-[#59ff8b]">{primaryLiveMatch ? `${primaryLiveMatch.minute}'` : "67'"}</div>
                </div>
                <div>
                  <div className="mx-auto mb-2 h-6 w-6 rounded-full bg-[#2d79ff]" />
                  <div className="text-xl font-bold">{primaryLiveMatch?.awayTeam ?? 'Chelsea'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button className="rounded-xl border border-[#ff294e] bg-[#491224] p-3 text-left">
                  <div className="text-[11px] uppercase text-slate-300">Home Win</div>
                  <div className="text-2xl font-bold">{primaryLiveMatch?.homeTeam ?? 'Arsenal'}</div>
                  <div className="text-sm font-semibold text-[#ffb63d]">2.10</div>
                </button>
                <button className="rounded-xl border border-[#363a55] bg-[#20253e] p-3 text-left">
                  <div className="text-[11px] uppercase text-slate-400">Draw</div>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-sm font-semibold text-[#ffb63d]">3.40</div>
                </button>
                <button className="rounded-xl border border-[#363a55] bg-[#20253e] p-3 text-left">
                  <div className="text-[11px] uppercase text-slate-400">Away Win</div>
                  <div className="text-2xl font-bold">{primaryLiveMatch?.awayTeam ?? 'Chelsea'}</div>
                  <div className="text-sm font-semibold text-[#ffb63d]">4.20</div>
                </button>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xl font-bold">Matchday Challenges</h3>
              <Link to="/predictions" className="text-sm font-semibold text-[#ff2b57]">All challenges</Link>
            </div>
            <div className="space-y-2">
              {[
                { title: 'First Corner Kick', subtitle: 'Predict which team wins the first corner', xp: '+150 XP' },
                { title: 'Halftime Score', subtitle: 'Exact halftime scoreline', xp: '+300 XP' },
                { title: 'First Booking', subtitle: 'Which player gets the first yellow card?', xp: '+200 XP' },
              ].map((challenge) => (
                <div key={challenge.title} className="flex items-center justify-between rounded-xl border border-[#2a2d42] bg-[#15192d] px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-100">{challenge.title}</div>
                    <div className="text-xs text-slate-400">{challenge.subtitle}</div>
                  </div>
                  <div className="rounded-full border border-[#5b4023] bg-[#2a2118] px-3 py-1 text-xs font-bold text-[#ffb84b]">
                    {challenge.xp}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xl font-bold">Your Feed</h3>
              <span className="text-sm font-semibold text-[#ff2b57]">See all</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {featuredFeed.map((item) => (
                <div key={item.id} className="rounded-xl border border-[#2a2d42] bg-[#14182d] p-4">
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-[#ff6e8f]">{item.type}</div>
                  <div className="mb-1 font-semibold text-slate-100">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.description}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="hidden space-y-3 xl:block">
          <div className="rounded-2xl border border-[#2a2d42] bg-[#12162a] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">My XP</div>
            <div className="mt-1 text-4xl font-extrabold text-[#ffb327]">{xpCurrent.toLocaleString()}</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#262b43]">
              <div className="h-full bg-gradient-to-r from-[#ffba3d] to-[#ff204f]" style={{ width: `${xpPercent}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{xpCurrent.toLocaleString()} / {xpTarget.toLocaleString()} to Level 13</span>
              <span>{xpPercent}%</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2a2d42] bg-[#12162a] p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Season Stats</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-[#2c3048] bg-[#171b31] p-3">
                <div className="text-2xl font-extrabold">47</div>
                <div className="text-xs text-slate-400">Predictions</div>
              </div>
              <div className="rounded-xl border border-[#2c3048] bg-[#171b31] p-3">
                <div className="text-2xl font-extrabold text-[#6cff93]">{accuracy}%</div>
                <div className="text-xs text-slate-400">Accuracy</div>
              </div>
              <div className="rounded-xl border border-[#2c3048] bg-[#171b31] p-3">
                <div className="text-2xl font-extrabold text-[#ffb638]">{streak}</div>
                <div className="text-xs text-slate-400">Streak</div>
              </div>
              <div className="rounded-xl border border-[#2c3048] bg-[#171b31] p-3">
                <div className="text-2xl font-extrabold text-[#77b6ff]">{collectibles}</div>
                <div className="text-xs text-slate-400">Collectibles</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2a2d42] bg-[#12162a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Leaderboard</div>
              <Bolt className="h-4 w-4 text-[#ff2c58]" />
            </div>
            <div className="space-y-2 text-sm">
              {leaderboardTop.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between rounded-xl bg-[#171b31] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-[#ffb73d]" />
                    <span className="font-semibold">{entry.displayName}</span>
                  </div>
                  <span className="font-bold text-[#ffb73d]">{entry.xpScore.toLocaleString()}</span>
                </div>
              ))}
              {myEntry && (
                <div className="flex items-center justify-between rounded-xl border border-[#6a3d2a] bg-[#30241f] px-3 py-2">
                  <div className="font-semibold text-[#ffb73d]">{myEntry.rank} · You</div>
                  <div className="font-bold text-[#ffb73d]">{myEntry.xpScore.toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
