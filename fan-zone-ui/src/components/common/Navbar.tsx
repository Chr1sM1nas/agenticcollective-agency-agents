import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, Settings, LogOut, ChevronDown, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Only show nav links you want to keep (removing Dashboard, Collectibles, Leaderboard)
  const navLinks: { to: string; label: string }[] = [
    // { to: '/dashboard', label: 'Dashboard' },
    // { to: '/collectibles', label: 'Collectibles' },
    // { to: '/leaderboard', label: 'Leaderboard' },
    // { to: '/predictions', label: 'Match Hub' },
    // Add any other links you want to keep here
  ];
  const filteredNavLinks = navLinks;

  return (
    <nav className="sticky top-0 z-50 border-b border-[#24273b] bg-[#0d1020]/95 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" aria-label="Go to FanZone home" className="inline-block leading-tight">
            <span className="fz-title text-2xl font-extrabold tracking-tight text-[#ff4d38] block">FanZone</span>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Powered by Ayo.Cool</p>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-[#2d3046] bg-[#15192c] p-1">
            {filteredNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-[#3a1020] text-[#ff7f9a]' : 'text-slate-300 hover:bg-[#20263f] hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 fz-card px-3 py-2 hover:border-[#5a3340] transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-[#ff2b57] flex items-center justify-center text-white text-xs font-bold">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-white text-xs font-medium">{user.displayName}</div>
                    <div className="flex items-center gap-1 text-[#ffb739] text-xs">
                      <Star className="h-3 w-3" />
                      <span>{user.xpScore.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 fz-card shadow-xl overflow-hidden">
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
        <div className="md:hidden bg-slate-900/95 border-t border-slate-700">
          {filteredNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 transition-colors ${
                  isActive ? 'bg-[#351426] text-[#ff7f9a] font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {link.label}
            </NavLink>
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
