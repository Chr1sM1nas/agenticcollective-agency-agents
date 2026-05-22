import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeed } from '../hooks/useFeed';
import { useMatchFeed } from '../hooks/useMatchFeed';
import { LEFT_NAV_ITEMS, getActiveLeftNavKey } from '../constants/navigation';
import { mockLeaderboard } from '../utils/mockData';
import { Bolt, Medal } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';

function formatTickerPhase(match: { status: 'upcoming' | 'live' | 'finished'; minute: string; kickoff: string }): string {
  if (match.status === 'finished') {
    return 'FT';
  }

  if (match.status === 'upcoming') {
    const kickoffDate = new Date(match.kickoff);
    if (Number.isNaN(kickoffDate.getTime())) {
      return 'Scheduled';
    }

    return kickoffDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return /^\d+$/.test(match.minute) ? `${match.minute}'` : match.minute;
}

function buildQuickPickPath(matchId: string | undefined, outcome: 'home' | 'draw' | 'away'): string {
  if (!matchId) return '/predictions';
  return `/predictions?matchId=${encodeURIComponent(matchId)}&outcome=${outcome}`;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { items, fetchContent } = useFeed();
  const { matches: feedMatches, isLoading: isFeedLoading, error: feedError } = useMatchFeed();

  useEffect(() => {
    if (items.length === 0) fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featuredFeed = items.slice(0, 3);
  const statusPriority = {
    live: 0,
    upcoming: 1,
    finished: 2,
  } as const;

  const sortedFeedMatches = [...feedMatches].sort((a, b) => {
    const statusCompare = statusPriority[a.status] - statusPriority[b.status];
    if (statusCompare !== 0) return statusCompare;

    const aKickoff = new Date(a.kickoff).getTime();
    const bKickoff = new Date(b.kickoff).getTime();
    if (Number.isNaN(aKickoff) || Number.isNaN(bKickoff)) return 0;

    return aKickoff - bKickoff;
  });

  const liveTickerMatches = sortedFeedMatches.filter((match) => match.status === 'live').slice(0, 2);
  const fallbackTickerMatches = sortedFeedMatches.filter((match) => match.status === 'upcoming').slice(0, 2);
  const tickerMatches = liveTickerMatches.length > 0 ? liveTickerMatches : fallbackTickerMatches;
  const primaryLiveMatch = liveTickerMatches[0] ?? sortedFeedMatches[0];

  const liveSourceLabel = isFeedLoading ? 'Syncing' : sortedFeedMatches.length > 0 ? 'API Feed' : 'Fallback';
  const liveSourceClass =
    liveSourceLabel === 'API Feed'
      ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
      : liveSourceLabel === 'Syncing'
        ? 'border-sky-400/50 bg-sky-500/10 text-sky-300'
        : 'border-amber-400/50 bg-amber-500/10 text-amber-300';

  const primaryPanelLabel = primaryLiveMatch?.status === 'live'
    ? 'LIVE NOW'
    : primaryLiveMatch?.status === 'upcoming'
      ? 'UP NEXT'
      : 'LATEST RESULT';

  const xpCurrent = user?.xpScore ?? 2840;
  const xpTarget = 4200;
  const xpPercent = Math.min(100, Math.round((xpCurrent / xpTarget) * 100));
  const accuracy = user?.predictionAccuracy ?? 68;
  const streak = 7;
  const collectibles = user?.collectiblesCount ?? 12;
  const pendingPredictionCount = 3;
  const leaderboardTop = mockLeaderboard.slice(0, 4);
  const myEntry = mockLeaderboard.find((entry) => entry.userId === user?.id);

  const activeNavKey = getActiveLeftNavKey(location.pathname);

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100">
      <Navbar />

      <section className="border-b border-[#23253a] bg-[#0f1326] px-3 py-2 sm:px-5">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 text-xs">
          <div className="fz-live-glow rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-[#58ff83]">LIVE</div>
          <div className={`rounded-full border px-3 py-1 font-semibold ${liveSourceClass}`}>Data source: {liveSourceLabel}</div>
          {isFeedLoading && <div className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-300">Loading Premier League match feed...</div>}
          {!isFeedLoading && tickerMatches.length === 0 && <div className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-300">No EPL matches in feed right now</div>}
          {!isFeedLoading && feedError && <div className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-300">Match feed API unavailable</div>}
          {tickerMatches.map((match) => (
            <div key={match.id} className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-300">
              {match.homeTeam} <span className="text-[#4cff7f]">{match.homeScore}-{match.awayScore}</span> {match.awayTeam} • {formatTickerPhase(match)}
            </div>
          ))}
          <div className="ml-auto rounded-full bg-[#f5b326] px-3 py-1 font-bold text-[#2f2202]">{xpCurrent.toLocaleString()} XP</div>
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

        <main className="space-y-4">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Match Hub</h2>
                <p className="text-sm text-slate-400">Live state, quick picks, and your fastest route into prediction flow.</p>
              </div>
              <Link to="/predictions" className="text-sm font-semibold text-[#ff2b57]">Open Match Hub</Link>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_320px]">
              <div className="rounded-2xl border border-[#292d46] bg-gradient-to-br from-[#1a2144] via-[#251434] to-[#111a41] p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between text-xs text-slate-300">
                  <span className="fz-live-glow rounded-full bg-[#0d5f3b] px-2 py-1 font-semibold text-[#44f08c]">{primaryPanelLabel}</span>
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
                    <div className="text-sm text-[#59ff8b]">{primaryLiveMatch ? formatTickerPhase(primaryLiveMatch) : "67'"}</div>
                  </div>
                  <div>
                    <div className="mx-auto mb-2 h-6 w-6 rounded-full bg-[#2d79ff]" />
                    <div className="text-xl font-bold">{primaryLiveMatch?.awayTeam ?? 'Chelsea'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Link to={buildQuickPickPath(primaryLiveMatch?.id, 'home')} className="rounded-xl border border-[#ff294e] bg-[#491224] p-3 text-left transition-colors hover:border-[#ff5b78] hover:bg-[#5a192d]">
                    <div className="text-[11px] uppercase text-slate-300">Home Win</div>
                    <div className="text-2xl font-bold">{primaryLiveMatch?.homeTeam ?? 'Arsenal'}</div>
                    <div className="text-sm font-semibold text-[#ffb63d]">2.10</div>
                  </Link>
                  <Link to={buildQuickPickPath(primaryLiveMatch?.id, 'draw')} className="rounded-xl border border-[#363a55] bg-[#20253e] p-3 text-left transition-colors hover:border-[#4a5072] hover:bg-[#262b45]">
                    <div className="text-[11px] uppercase text-slate-400">Draw</div>
                    <div className="text-2xl font-bold">-</div>
                    <div className="text-sm font-semibold text-[#ffb63d]">3.40</div>
                  </Link>
                  <Link to={buildQuickPickPath(primaryLiveMatch?.id, 'away')} className="rounded-xl border border-[#363a55] bg-[#20253e] p-3 text-left transition-colors hover:border-[#4a5072] hover:bg-[#262b45]">
                    <div className="text-[11px] uppercase text-slate-400">Away Win</div>
                    <div className="text-2xl font-bold">{primaryLiveMatch?.awayTeam ?? 'Chelsea'}</div>
                    <div className="text-sm font-semibold text-[#ffb63d]">4.20</div>
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-[#5f2e34] bg-gradient-to-r from-[#46220f] to-[#4a1020] p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#ffcf7d]">Momentum</div>
                  <div className="mt-2 text-xl font-bold text-[#ffb53f]">7-Match Streak</div>
                  <div className="mt-1 text-sm text-slate-200">Keep it going. Your next prediction window closes soon.</div>
                  <Link to="/predictions" className="mt-4 inline-flex rounded-full bg-[#ff1847] px-4 py-2 text-sm font-bold text-white">Predict Now</Link>
                </div>

                <div className="rounded-2xl border border-[#2a2d42] bg-[#15192d] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Matchday Actions</div>
                      <div className="text-sm font-semibold text-slate-100">Fastest ways to engage</div>
                    </div>
                    <Link to="/predictions" className="text-xs font-semibold text-[#ff2b57]">Open all</Link>
                  </div>
                  <div className="space-y-2 text-sm">
                    <Link to="/predictions" className="flex items-center justify-between rounded-xl border border-[#2c3048] bg-[#171b31] px-3 py-3 transition-colors hover:border-[#3c4264] hover:bg-[#1b2038]">
                      <span className="font-medium text-slate-100">Open prediction builder</span>
                      <span className="text-xs font-semibold text-[#ffb84b]">Live</span>
                    </Link>
                    <Link to="/predictions" className="flex items-center justify-between rounded-xl border border-[#2c3048] bg-[#171b31] px-3 py-3 transition-colors hover:border-[#3c4264] hover:bg-[#1b2038]">
                      <span className="font-medium text-slate-100">Review pending picks</span>
                      <span className="text-xs font-semibold text-sky-300">{pendingPredictionCount} open</span>
                    </Link>
                    <Link to="/leaderboard" className="flex items-center justify-between rounded-xl border border-[#2c3048] bg-[#171b31] px-3 py-3 transition-colors hover:border-[#3c4264] hover:bg-[#1b2038]">
                      <span className="font-medium text-slate-100">See friend leagues</span>
                      <span className="text-xs font-semibold text-emerald-300">Rank up</span>
                    </Link>
                  </div>
                </div>
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
              <div>
                <h3 className="text-lg font-bold">From the Feed</h3>
                <div className="text-xs text-slate-500">Content discovery sits below the live match layer.</div>
              </div>
              <span className="text-sm font-semibold text-[#ff2b57]">See all</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {featuredFeed.map((item) => (
                <div key={item.id} className="rounded-xl border border-[#262a40] bg-[#121629] p-3">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[#ff6e8f]">{item.type}</div>
                  <div className="mb-1 text-sm font-semibold text-slate-100">{item.title}</div>
                  <div className="line-clamp-2 text-xs text-slate-400">{item.description}</div>
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
