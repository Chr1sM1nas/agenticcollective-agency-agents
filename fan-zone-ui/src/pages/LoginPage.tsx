import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, CheckCircle, Circle } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';

const steps = [
  { id: 1, label: 'Anonymous' },
  { id: 2, label: 'Sign In' },
  { id: 3, label: 'Age Verify' },
  { id: 4, label: 'Premium' },
];

export const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeFromQuery = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const nextParam = searchParams.get('next') ?? undefined;
  const initialMode = modeFromQuery;
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);

  const resolvePostAuthPath = (isAgeVerified: boolean, nextPath?: string) => {
    if (!nextPath || !nextPath.startsWith('/')) {
      return isAgeVerified ? '/dashboard' : '/age-verify';
    }

    if (nextPath.startsWith('/login')) {
      return isAgeVerified ? '/dashboard' : '/age-verify';
    }

    if (!isAgeVerified) {
      return '/age-verify';
    }

    if (nextPath.startsWith('/age-verify')) {
      return '/dashboard';
    }

    return nextPath;
  };

  useEffect(() => {
    setAuthMode(modeFromQuery);
  }, [modeFromQuery]);

  useEffect(() => {
    if (user && modeFromQuery !== 'signup') {
      void navigate(resolvePostAuthPath(user.ageVerified, nextParam), { replace: true });
    }
  }, [modeFromQuery, navigate, nextParam, user]);

  return (
    <div className="fz-page flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-10 w-10 text-cyan-300" />
              <span className="fz-title text-white font-bold text-3xl">Fan Zone</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400 mt-1">Powered by Ayo.Cool</p>
          </div>
          <p className="text-slate-300">Your ultimate football fan platform</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              {i < 2 ? (
                <CheckCircle className="h-5 w-5 text-cyan-300" />
              ) : (
                <Circle className="h-5 w-5 text-slate-600" />
              )}
              <span className={`text-xs ${i < 2 ? 'text-cyan-300' : 'text-slate-500'}`}>{step.label}</span>
              {i < steps.length - 1 && <div className={`h-px w-4 ${i < 1 ? 'bg-cyan-400' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="fz-card p-6">
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/60 p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                authMode === 'signup' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-white font-semibold text-lg mb-4">
            {authMode === 'login' ? 'Sign in to Fan Zone' : 'Create your Fan Zone account'}
          </h2>

          <SocialAuthButtons />

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-xs">or login/register with email</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {authMode === 'login' ? <LoginForm /> : <RegisterForm />}

          <p className="text-center text-slate-500 text-sm mt-4">
            {authMode === 'login' ? 'New to Fan Zone?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              {authMode === 'login' ? 'Create account' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
