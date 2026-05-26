import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { loginSuccess } from '../../store/authSlice';
import { User } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { trackEvent } from '../../utils/analytics';

type Provider = 'Google' | 'Apple' | 'Facebook';

interface SocialButtonProps {
  provider: Provider;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

const SocialButton: React.FC<SocialButtonProps> = ({ provider, icon, label, className }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
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
      className={`w-full min-w-0 flex items-center justify-start gap-3 border rounded-lg px-4 py-3 text-white text-base font-semibold transition-colors disabled:opacity-50 ${className ?? 'bg-slate-800 hover:bg-slate-700 border-slate-600'}`}
    >
      {loading ? <LoadingSpinner size="sm" /> : icon}
      <span className="truncate">{label}</span>
    </button>
  );
};

const GoogleIcon: React.FC = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.7-.1-1.4-.2-2.1H12z" />
    <path fill="#34A853" d="M12 21c2.6 0 4.7-.8 6.3-2.2l-3-2.3c-.8.6-1.9 1-3.3 1-2.5 0-4.5-1.7-5.2-3.9l-3.1 2.4C5.2 18.9 8.3 21 12 21z" />
    <path fill="#FBBC05" d="M6.8 13.6c-.2-.6-.3-1.1-.3-1.7s.1-1.2.3-1.7L3.7 7.8C3 9.2 2.6 10.5 2.6 12s.4 2.8 1.1 4.2l3.1-2.6z" />
    <path fill="#4285F4" d="M12 6.5c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.7 3.7 14.6 3 12 3 8.3 3 5.2 5.1 3.7 7.8l3.1 2.4c.7-2.2 2.8-3.7 5.2-3.7z" />
  </svg>
);

const AppleIcon: React.FC = () => (
  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.37 12.22c.03 2.88 2.53 3.84 2.56 3.85-.02.07-.4 1.39-1.32 2.76-.79 1.18-1.61 2.35-2.9 2.38-1.27.02-1.68-.75-3.14-.75-1.46 0-1.91.73-3.12.78-1.24.05-2.2-1.24-3-2.41-1.63-2.36-2.88-6.67-1.2-9.58.83-1.44 2.32-2.35 3.94-2.37 1.23-.02 2.39.83 3.14.83.75 0 2.16-1.03 3.64-.88.62.03 2.36.25 3.48 1.89-.09.06-2.08 1.21-2.06 3.6zm-2.4-6.79c.66-.8 1.1-1.92.98-3.03-.96.04-2.13.64-2.81 1.44-.61.7-1.14 1.83-1 2.91 1.07.08 2.17-.55 2.83-1.32z" />
  </svg>
);

const FacebookIcon: React.FC = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#1877F2" d="M24 12C24 5.37 18.63 0 12 0S0 5.37 0 12c0 6 4.39 10.97 10.13 11.87v-8.39H7.08V12h3.05V9.36c0-3.02 1.8-4.69 4.56-4.69 1.32 0 2.7.24 2.7.24v2.96h-1.52c-1.5 0-1.97.93-1.97 1.88V12h3.35l-.54 3.48H13.9v8.39C19.61 22.97 24 18 24 12z" />
  </svg>
);

export const SocialAuthButtons: React.FC = () => {
  return (
    <div className="space-y-2">
      <SocialButton
        provider="Google"
        icon={<GoogleIcon />}
        label="Continue with Google"
        className="border-[#d7dce5] bg-white text-slate-900 hover:bg-slate-100"
      />
      <SocialButton
        provider="Apple"
        icon={<AppleIcon />}
        label="Continue with Apple"
        className="border-[#111] bg-black text-white hover:bg-[#222]"
      />
      <SocialButton
        provider="Facebook"
        icon={<FacebookIcon />}
        label="Continue with Facebook"
        className="border-[#4267B2] bg-[#4267B2] text-white hover:bg-[#385799]"
      />
    </div>
  );
};
