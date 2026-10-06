import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProfileSetupGate({ children, allowSetup = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!allowSetup && !user?.profile_completed) {
    return <Navigate to="/profile/setup" replace state={{ from: location.pathname }} />;
  }

  if (allowSetup && user?.profile_completed) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}