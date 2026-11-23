/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  LoginScreen,
  type AuthUser,
  type UserRole,
} from './components/auth/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [userIdentifier, setUserIdentifier] = useState<string>('');

  const handleLogin = (user: AuthUser) => {
    setActiveRole(user.role);
    setUserIdentifier(user.identifier);
  };

  const handleSignOut = () => {
    setActiveRole(null);
    setUserIdentifier('');
  };

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
