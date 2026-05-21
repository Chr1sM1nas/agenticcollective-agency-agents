import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CirclePlay, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../utils/analytics';

const hypeTags = [
  'Live Match Quests',
  'Creator Leagues',
  'Instant Reward Drops',
  'Prediction Battles',
  'Club Fan Challenges',
  'Real-Time Momentum',
];

const statCards = [
  { label: 'Live Matches Tracked', value: '2,400+' },
  { label: 'Community Predictions', value: '31M+' },
  { label: 'Season Reward Pool', value: '$4.2M' },
];

const featureCards = [
  {
    title: 'Matchday Missions',
    body: 'Turn every fixture into a multi-round challenge with points, streaks, and live momentum boosts.',
    icon: Zap,
  },
  {
    title: 'Squad vs Squad Rooms',
    body: 'Build private fan rooms where communities compete for weekly bragging rights and unlockable perks.',
    icon: Users,
  },
  {
    title: 'Rare Drop Collectibles',
    body: 'Claim animated digital collectibles tied to match events, milestones, and player moments.',
    icon: Trophy,
  },
];

export const HomeLandingPage: React.FC = () => {
  const { user } = useAuth();
  const fanZoneDestination = user ? '/dashboard' : '/login';

  return (
    <div className="fz-page relative overflow-hidden bg-[#060912] text-slate-100">
      <div className="pointer-events-none absolute -top-20 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#fe4c2d]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[#2b6cff]/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-[#ffb847]/10 blur-3xl" />

      <header className="relative z-10 border-b border-white/10 bg-[#0a1020]/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-start justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Go to FanZone home" className="inline-block">
            <div className="fz-title text-2xl font-extrabold tracking-tight text-[#ff4d38]">FanZone</div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Powered by Ayo.Cool</p>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login?mode=signup"
              onClick={() => trackEvent('landing_register_clicked', { source: 'top-nav' })}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-white/40 hover:bg-white/10"
            >
              Register
            </Link>
            <Link
              to={fanZoneDestination}
              onClick={() => trackEvent('landing_enter_fanzone_clicked', { source: 'top-nav', authenticated: Boolean(user) })}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff4f2f] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#ff6a4f]"
            >
              Enter Fan Zone
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-24">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ff7f4f]/40 bg-[#ff7f4f]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#ffca9a]">
              <Sparkles className="h-4 w-4" />
              New Era Fan Platform
            </div>

            <h1 className="fz-title text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              The Home of
              <span className="block bg-gradient-to-r from-[#ff4f2f] via-[#ffb847] to-[#5aa4ff] bg-clip-text text-transparent">
                Live Fan Energy
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
              FanZone turns every game into a playable social arena with live predictions, challenge streaks, digital rewards,
              and community leaderboards that move with every minute.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={fanZoneDestination}
                onClick={() => trackEvent('landing_start_competing_clicked', { source: 'hero', authenticated: Boolean(user) })}
                className="inline-flex items-center gap-2 rounded-full bg-[#ff4f2f] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#ff6f54]"
              >
                Start Competing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <CirclePlay className="h-4 w-4" />
                Watch 60s Preview
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {hypeTags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#121a33]/95 to-[#10172a]/95 p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Tonight In FanZone</p>
              <span className="fz-live-glow rounded-full bg-[#35db80]/20 px-2.5 py-1 text-xs font-semibold text-[#7efcb4]">Live</span>
            </div>

            <div className="rounded-2xl border border-[#33476f] bg-[#0f1931] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Premier League Showdown</p>
              <div className="mt-3 grid grid-cols-3 items-center text-center">
                <div>
                  <div className="text-sm text-slate-300">Arsenal</div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[#ff4f2f]" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold">2-1</div>
                  <div className="text-xs font-semibold text-[#7efcb4]">74&apos; LIVE</div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Chelsea</div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[#5aa4ff]" />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              <button type="button" className="rounded-xl border border-[#75453b] bg-[#3a1e19] px-2 py-3 text-[#ffc8bf] hover:bg-[#4a2720]">
                Home Win
                <span className="mt-1 block text-base text-white">2.10</span>
              </button>
              <button type="button" className="rounded-xl border border-[#2f3f63] bg-[#1a2542] px-2 py-3 text-slate-300 hover:bg-[#1f2c4f]">
                Draw
                <span className="mt-1 block text-base text-white">3.40</span>
              </button>
              <button type="button" className="rounded-xl border border-[#2f3f63] bg-[#1a2542] px-2 py-3 text-slate-300 hover:bg-[#1f2c4f]">
                Away Win
                <span className="mt-1 block text-base text-white">4.20</span>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {statCards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-white/15 bg-[#10172b]/85 p-5">
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-2xl border border-white/15 bg-[#0f1528]/85 p-6 transition-transform duration-300 hover:-translate-y-1">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4f2f]/15 text-[#ff9f8f]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="fz-title text-xl font-bold text-white">{feature.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{feature.body}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};
