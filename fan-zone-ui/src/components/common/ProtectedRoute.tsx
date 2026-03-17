import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ProtectedRouteProps {
  requireAgeVerified?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAgeVerified = false }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAgeVerified && !user.ageVerified) {
    return <Navigate to="/age-verify" replace />;
  }

  return <Outlet />;
};
