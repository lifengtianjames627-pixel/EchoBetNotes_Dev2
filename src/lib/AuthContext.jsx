import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '@/api/appClient';
import { appParams, tokenStore } from '@/lib/app-params';

const AuthContext = createContext(undefined);

const parseAppStateError = (error) => {
  const reason = error?.data?.extra_data?.reason;
  if (error?.status === 403 && reason) {
    if (reason === 'auth_required') {
      return { type: 'auth_required', message: 'Authentication required' };
    }
    if (reason === 'user_not_registered') {
      return { type: 'user_not_registered', message: 'User not registered for this app' };
    }
    return { type: reason, message: error?.message || 'Failed to load app state' };
  }

  return {
    type: 'unknown',
    message: error?.message || 'Failed to load app state',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      if (appParams.appId) {
        try {
          const publicSettings = await apiClient.request(`/api/apps/public/prod/public-settings/by-id/${appParams.appId}`);
          setAppPublicSettings(publicSettings);
        } catch (appError) {
          if (appError?.status === 404) {
            // Generic API deployments may not expose app-level public settings.
            setAppPublicSettings(null);
          } else {
            setAuthError(parseAppStateError(appError));
          }
        }
      } else {
        setAppPublicSettings(null);
      }

      if (tokenStore.getToken()) {
        await checkUserAuth();
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setAuthError({
        type: 'unknown',
        message: error?.message || 'An unexpected error occurred',
      });
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      return currentUser;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      }
      return null;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      apiClient.auth.logout(window.location.href);
      return;
    }

    apiClient.auth.logout();
  };

  const navigateToLogin = () => {
    apiClient.auth.redirectToLogin(window.location.href);
  };

  const updateCurrentUser = async (data) => {
    const updatedUser = await apiClient.auth.updateMe(data);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        updateCurrentUser,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
