import React, { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminRegisterScreen } from './components/auth/AdminRegisterScreen';
import { authApi } from './api/client';
import { AuthUser } from './types';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('mhms_auth_token'));
  const [hasAdmin, setHasAdmin] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'register-admin'>('login');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setLoading(true);
      try {
        // 1. Check if an admin exists
        const adminCheck = await authApi.hasAdmin().catch(() => ({ hasAdmin: true }));
        if (isMounted) setHasAdmin(adminCheck.hasAdmin);

        // 2. If token exists, verify with backend /me endpoint
        const storedToken = localStorage.getItem('mhms_auth_token');
        if (storedToken) {
          try {
            const user = await authApi.getMe();
            if (isMounted) {
              setCurrentUser(user);
              setToken(storedToken);
            }
          } catch (err) {
            console.warn('Session expired or invalid token:', err);
            localStorage.removeItem('mhms_auth_token');
            localStorage.removeItem('mhms_user');
            if (isMounted) {
              setCurrentUser(null);
              setToken(null);
              if (!adminCheck.hasAdmin) {
                setAuthView('register-admin');
              }
            }
          }
        } else if (!adminCheck.hasAdmin) {
          if (isMounted) setAuthView('register-admin');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = (user: AuthUser, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    setHasAdmin(true);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setToken(null);
      setAuthView('login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071318] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-amber-400 animate-pulse flex items-center justify-center shadow-2xl shadow-teal-950/60">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
        </div>
        <div className="mt-5 text-center">
          <h2 className="text-base font-bold text-white tracking-wide">Marriage Hall Management System</h2>
          <p className="text-xs text-slate-400 mt-1">Initializing Secure Operations Console...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!token || !currentUser) {
    if (authView === 'register-admin') {
      return (
        <AdminRegisterScreen
          onRegisterSuccess={(user, newToken) => handleLoginSuccess(user, newToken)}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <LoginScreen
        hasAdmin={hasAdmin}
        onLoginSuccess={(user, newToken) => handleLoginSuccess(user, newToken)}
        onGoToRegisterAdmin={() => setAuthView('register-admin')}
      />
    );
  }

  // Authenticated: Render Main System
  return <MainLayout currentUser={currentUser} onLogout={handleLogout} />;
}
