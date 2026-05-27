import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LEFT_NAV_ITEMS, getActiveLeftNavKey } from '../constants/navigation';
// import { Navbar } from '../components/common/Navbar';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ActivityStats } from '../components/profile/ActivityStats';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loginSuccess } from '../store/authSlice';

export const ProfilePage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [teamAffinity, setTeamAffinity] = useState(user?.teamAffinity ?? '');
  const [favoritePlayers, setFavoritePlayers] = useState(user?.favoritePlayers?.join(', ') ?? '');
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = () => {
    dispatch(loginSuccess({
      ...user,
      displayName,
      teamAffinity,
      favoritePlayers: favoritePlayers.split(',').map(p => p.trim()).filter(Boolean),
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClass = "w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors";
  const activeNavKey = getActiveLeftNavKey(location.pathname);

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100">
      {/* <Navbar /> */}
      <section className="border-b border-[#23253a] bg-[#0f1326] px-3 py-2 sm:px-5">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 text-xs">
          <div className="rounded-full border border-[#2e3149] bg-[#14182d] px-3 py-1 text-slate-200">PROFILE</div>
          <div className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-300">Identity and stats</div>
          <div className="ml-auto rounded-full bg-[#f5b326] px-3 py-1 font-bold text-[#2f2202]">{user.xpScore.toLocaleString()} XP</div>
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
          <ProfileHeader user={user} />

          <div className="flex gap-2 mt-6 mb-6 fz-card p-1.5">
            {(['stats', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'stats' && <ActivityStats user={user} />}

          {activeTab === 'settings' && (
            <div className="fz-card p-6 space-y-4">
              <h3 className="text-white font-semibold mb-4">Edit Profile</h3>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Team Affinity</label>
                <input value={teamAffinity} onChange={e => setTeamAffinity(e.target.value)} placeholder="e.g. Arsenal" className={inputClass} />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Favourite Players</label>
                <input value={favoritePlayers} onChange={e => setFavoritePlayers(e.target.value)} placeholder="e.g. Bukayo Saka, Martin Odegaard" className={inputClass} />
                <p className="text-slate-500 text-xs mt-1">Comma-separated</p>
              </div>
              <button onClick={handleSave} className="fz-btn-primary">
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
