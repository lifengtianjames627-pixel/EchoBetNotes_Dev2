import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

// Route guard for viewer/user/admin tiering. Restricted routes (profile,
// messages, bandmate discovery, band dashboard, moderation) are only for
// logged-in users; a viewer is sent to login and returned here after.
export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  useEffect(() => {
    if (!isLoadingPublicSettings && !isLoadingAuth && !isAuthenticated) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    }
  }, [isAuthenticated, isLoadingAuth, isLoadingPublicSettings]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#e0d8c8', borderTopColor: '#bf7a35' }} />
      </div>
    );
  }
  if (!isAuthenticated) return null;
  return children;
}