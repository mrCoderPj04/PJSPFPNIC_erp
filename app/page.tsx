'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, LogIn, AlertCircle, Lock, Hash, ShieldAlert, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { requirePasswordChange } = await login(employeeId, password);
      if (requirePasswordChange) {
        router.replace('/change-password');
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg grid-bg flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--gradient-main)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'hsl(260,75%,60%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: 'hsl(190,75%,55%)' }} />
      </div>

      <div className="w-full max-w-md z-10 fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-3 shadow-2xl p-1 bg-white/05 border border-white/10 overflow-hidden backdrop-blur-md">
            <img src="/logo.png" alt="PJSOFONIC ERP Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">PJSOFONIC</span> ERP
          </h1>
          <p className="text-white/40 mt-1 text-sm font-medium">Enterprise Resource Planning Portal</p>
        </div>

        {/* Portal Type Tab Switcher */}
        <div className="flex bg-white/05 p-1 rounded-xl mb-6 border border-white/05">
          <button
            type="button"
            onClick={() => {
              setActiveTab('EMPLOYEE');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'EMPLOYEE'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <UserCheck size={16} />
            Employee Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ADMIN');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'ADMIN'
                ? 'bg-red-500/10 text-red-400 border border-red-500/10 shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <ShieldAlert size={16} />
            Admin Login
          </button>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-1">
            {activeTab === 'EMPLOYEE' ? 'Employee Workspace' : 'System Administration'}
          </h2>
          <p className="text-white/40 text-sm mb-8">
            {activeTab === 'EMPLOYEE'
              ? 'Sign in with your Employee ID to access your tasks, attendance, and chats.'
              : 'Sign in with your Administrator credentials to manage operations and systems.'}
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee ID */}
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-white/60 mb-2">
                {activeTab === 'EMPLOYEE' ? 'Employee ID' : 'Administrator ID'}
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder={activeTab === 'EMPLOYEE' ? 'e.g. 0001' : 'e.g. 0000'}
                  className="input-glass pl-10"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/60 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-glass pl-10 pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'ADMIN'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 shadow-lg'
                  : 'btn-primary'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>


        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-white/20 text-xs">
          <Lock size={12} />
          Secured with JWT Authentication & End-to-End Encryption
        </div>
      </div>
    </div>
  );
}
