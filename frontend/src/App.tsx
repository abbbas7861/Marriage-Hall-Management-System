/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  LoginScreen,
  type AuthUser,
  type UserRole,
} from './components/auth/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import { authApi } from './api/client';

function normalizeRole(roleStr?: string): UserRole {
  const r = (roleStr || '').toLowerCase().trim();
  if (r.includes('senior')) return 'Senior Manager';
  if (r.includes('admin')) return 'Admin';
  if (r.includes('manager')) return 'Manager';
  if (r.includes('kitchen') || r.includes('chef')) return 'Kitchen';
  if (r.includes('account') || r.includes('finance')) return 'Accounts';
  return 'Manager';
}

export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [userIdentifier, setUserIdentifier] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mhms_auth_token');
    const cachedUser = localStorage.getItem('mhms_user');

    if (token) {
      if (cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          setActiveRole(normalizeRole(user.role));
          setUserIdentifier(user.username || user.fullName || 'User');
        } catch {
          // ignore
        }
      }

      authApi
        .getMe()
        .then((user) => {
          setActiveRole(normalizeRole(user.role));
          setUserIdentifier(user.username || user.fullName || 'User');
        })
        .catch(() => {
          // If token expired/invalid, clear session
          localStorage.removeItem('mhms_auth_token');
          localStorage.removeItem('mhms_user');
          setActiveRole(null);
          setUserIdentifier('');
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  const handleLogin = (user: AuthUser) => {
    setActiveRole(user.role);
    setUserIdentifier(user.identifier);
  };

  const handleSignOut = async () => {
    try {
      await authApi.logout();
    } catch {
      localStorage.removeItem('mhms_auth_token');
      localStorage.removeItem('mhms_user');
    }
    setActiveRole(null);
    setUserIdentifier('');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeRole) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <MainLayout
      activeRole={activeRole}
      userIdentifier={userIdentifier}
      onSignOut={handleSignOut}
    />
  );
}
