import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { loginSuccess } from '../../store/authSlice';
import { User } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { trackEvent } from '../../utils/analytics';

type Provider = 'Google' | 'Apple' | 'Facebook' | 'X' | 'Email';

interface SocialButtonProps {
  provider: Provider;
  icon: string;
  label: string;
  onToggleEmail?: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ provider, icon, label, onToggleEmail }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (provider === 'Email' && onToggleEmail) {
      trackEvent('auth_email_mode_toggled');
      onToggleEmail();
      return;
    }
    trackEvent('social_auth_submitted', { provider });
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const user: User = {
      id: 'demo-user',
      email: `demo@${provider.toLowerCase()}.com`,
      displayName: `${provider}User`,
      ageVerified: false,
      xpScore: 4200,
      predictionAccuracy: 56,
      collectiblesCount: 12,
      teamAffinity: 'Arsenal',
    };
    dispatch(loginSuccess(user));
    trackEvent('social_auth_succeeded', { provider });
    setLoading(false);
  };

  return (
    <button
      onClick={() => void handleClick()}
      disabled={loading}
      className="flex-1 min-w-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm transition-colors disabled:opacity-50"
    >
      {loading ? <LoadingSpinner size="sm" /> : <span className="text-lg">{icon}</span>}
      <span className="hidden sm:inline truncate">{label}</span>
    </button>
  );
};

interface SocialAuthButtonsProps {
  onToggleEmail?: () => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ onToggleEmail }) => {
  return (
    <div className="flex gap-2 flex-wrap">
      <SocialButton provider="Google" icon="G" label="Google" />
      <SocialButton provider="Apple" icon="🍎" label="Apple" />
      <SocialButton provider="Facebook" icon="f" label="Facebook" />
      <SocialButton provider="X" icon="𝕏" label="X" />
      <SocialButton provider="Email" icon="✉" label="Email" onToggleEmail={onToggleEmail} />
    </div>
  );
};
