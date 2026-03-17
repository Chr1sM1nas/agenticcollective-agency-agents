import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, Circle } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
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
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (user) void navigate('/dashboard');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-10 w-10 text-green-500" />
            <span className="text-white font-bold text-3xl">Fan Zone</span>
          </div>
          <p className="text-slate-400">Your ultimate football fan platform</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              {i < 2 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-slate-600" />
              )}
              <span className={`text-xs ${i < 2 ? 'text-green-400' : 'text-slate-500'}`}>{step.label}</span>
              {i < steps.length - 1 && <div className={`h-px w-4 ${i < 1 ? 'bg-green-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Sign in to Fan Zone</h2>
          <SocialAuthButtons onToggleEmail={() => setShowEmailForm(!showEmailForm)} />

          {showEmailForm && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-xs">or continue with email</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>
              <LoginForm />
            </>
          )}

          {!showEmailForm && (
            <button onClick={() => setShowEmailForm(true)} className="w-full mt-3 text-slate-400 text-sm hover:text-white transition-colors py-2">
              or continue with email →
            </button>
          )}

          <p className="text-center text-slate-500 text-sm mt-4">
            New to Fan Zone?{' '}
            <button className="text-green-400 hover:text-green-300 transition-colors">Create account</button>
          </p>
        </div>
      </div>
    </div>
  );
};
