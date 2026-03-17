import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ActivityStats } from '../components/profile/ActivityStats';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loginSuccess } from '../store/authSlice';

export const ProfilePage: React.FC = () => {
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

  const inputClass = "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors";

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader user={user} />

        <div className="flex gap-2 mt-6 mb-6 bg-slate-800 rounded-xl p-1">
          {(['stats', 'settings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && <ActivityStats user={user} />}

        {activeTab === 'settings' && (
          <div className="bg-slate-800 rounded-xl p-6 space-y-4">
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
            <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-6 py-2 transition-colors">
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
