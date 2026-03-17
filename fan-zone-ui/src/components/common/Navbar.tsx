import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Menu, X, User, Settings, LogOut, ChevronDown, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/predictions', label: 'Predictions' },
    { to: '/collectibles', label: 'Collectibles' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-green-500" />
            <span className="text-white font-bold text-xl">Fan Zone</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-white text-xs font-medium">{user.displayName}</div>
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <Star className="h-3 w-3" />
                      <span>{user.xpScore.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-700 transition-colors">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="md:hidden text-slate-300" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
              {link.label}
            </Link>
          ))}
          {user && (
            <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
