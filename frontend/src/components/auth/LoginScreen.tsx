import React, { useState } from 'react';
import { Building2, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '../../api/client';

export type UserRole = 'Admin' | 'Manager' | 'Kitchen' | 'Accounts';

export const USER_ROLES: UserRole[] = [
  'Admin',
  'Manager',
  'Kitchen',
  'Accounts',
];

export interface AuthUser {
  identifier: string;
  role: UserRole;
  fullName?: string;
  token?: string;
}

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

function normalizeRole(roleStr?: string): UserRole {
  const r = (roleStr || '').toLowerCase();
  if (r.includes('admin')) return 'Admin';
  if (r.includes('manager')) return 'Manager';
  if (r.includes('kitchen') || r.includes('chef')) return 'Kitchen';
  if (r.includes('account') || r.includes('finance')) return 'Accounts';
  return 'Manager';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillCredentials = (role: UserRole, user: string, pass: string) => {
    setSelectedRole(role);
    setIdentifier(user);
    setPassword(pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Connect strictly to Django backend authentication
      const response = await authApi.login({
        username: identifier.trim(),
        password: password.trim(),
      });

      const serverRole = normalizeRole(response.user?.role);

      // Validate selected role against database role
      if (selectedRole && selectedRole !== serverRole) {
        setError(
          `Account "${response.user?.username}" has "${serverRole}" permissions, not "${selectedRole}". Please switch the role dropdown to "${serverRole}".`
        );
        setIsLoading(false);
        return;
      }

      const effectiveRole: UserRole = selectedRole || serverRole;

      onLogin({
        identifier: response.user?.username || identifier.trim(),
        role: effectiveRole,
        fullName: response.user?.fullName,
        token: response.access || response.token,
      });
    } catch (err: any) {
      console.error('Backend authentication error:', err);
      const errMsg = err?.message || 'Authentication failed. Please check your credentials.';
      // Clean up error message formatting
      const cleanMsg = errMsg.replace(/^HTTP \d+:\s*/, '');
      setError(cleanMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12 text-slate-900 antialiased">
      <div className="w-full max-w-[400px]">
        {/* Brand Mark */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">
            Marriage Hall ERP
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Sign in to access your workspace
          </p>
        </div>

        {/* Minimalist Login Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Required Role Selector */}
            <div>
              <label
                htmlFor="login-role"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Login As (Role) <span className="text-red-500">*</span>
              </label>
              <select
                id="login-role"
                required
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRole | '');
                  if (error) setError(null);
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors cursor-pointer ${
                  selectedRole ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <option value="" disabled>
                  Select role
                </option>
                {USER_ROLES.map((role) => (
                  <option key={role} value={role} className="text-slate-900">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Email / Username */}
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Email or Username
              </label>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium shadow-2xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick-Fill Local Test Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Test Logins (Local SQLite)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('Admin', 'admin', 'admin123')}
                className="px-2.5 py-1.5 rounded-md bg-teal-50 hover:bg-teal-100 border border-teal-200/80 text-teal-800 font-medium text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold block">Admin</span>
                <span className="text-[10px] text-teal-600 font-mono">admin / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('Manager', 'manager', 'manager123')}
                className="px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-800 font-medium text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold block">Manager</span>
                <span className="text-[10px] text-blue-600 font-mono">manager / manager123</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('Kitchen', 'kitchen', 'kitchen123')}
                className="px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 font-medium text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold block">Kitchen</span>
                <span className="text-[10px] text-amber-600 font-mono">kitchen / kitchen123</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('Accounts', 'accounts', 'accounts123')}
                className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 font-medium text-left transition-colors cursor-pointer"
              >
                <span className="font-semibold block">Accounts</span>
                <span className="text-[10px] text-emerald-600 font-mono">accounts / accounts123</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
