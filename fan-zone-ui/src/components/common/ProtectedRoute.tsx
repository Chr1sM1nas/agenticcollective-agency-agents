import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ProtectedRouteProps {
  requireAgeVerified?: boolean;
  requireAgeUnverified?: boolean;
  requireAnonymous?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireAgeVerified = false,
  requireAgeUnverified = false,
  requireAnonymous = false,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  const nextPath = `${location.pathname}${location.search}`;
  const encodedNextPath = encodeURIComponent(nextPath);

  if (requireAnonymous) {
    if (user) {
      return <Navigate to={user.ageVerified ? '/dashboard' : '/age-verify'} replace />;
    }

    return <Outlet />;
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodedNextPath}`} replace />;
  }

  if (requireAgeVerified && !user.ageVerified) {
    return <Navigate to={`/age-verify?next=${encodedNextPath}`} replace />;
  }

  if (requireAgeUnverified && user.ageVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
