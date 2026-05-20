import React from 'react';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { AgeVerificationForm } from '../components/auth/AgeVerificationForm';
import { useAuth } from '../hooks/useAuth';

export const AgeVerificationPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.ageVerified) return <Navigate to="/dashboard" replace />;

  return (
    <div className="fz-page flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-10 w-10 text-cyan-300" />
          </div>
          <h1 className="fz-title text-white font-bold text-2xl mb-2">Age Verification</h1>
          <p className="text-slate-300">You must be 18+ to access all Fan Zone features</p>
        </div>
        <div className="fz-card p-6">
          <AgeVerificationForm />
        </div>
      </div>
    </div>
  );
};
