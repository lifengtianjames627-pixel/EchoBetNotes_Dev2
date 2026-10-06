import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Admin-only route guard. Non-admins (and guests) are sent home rather than
// shown any hint that the page exists. Record-level access is additionally
// enforced by entity permissions on the server.
export default function RequireAdmin({ children }) {
  const { user, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#e0d8c8', borderTopColor: '#bf7a35' }} />
      </div>
    );
  }
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}