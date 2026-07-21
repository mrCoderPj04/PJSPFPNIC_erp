'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Settings, Lock, User, Key, Check, AlertCircle, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { accessToken, isAuthenticated, isLoading, user, changePassword } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Security route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    setActionLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pt-24 pb-28 px-6 md:px-8 flex items-center justify-center">
          <div className="text-white/40 flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading account preferences...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 fade-in-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Account <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-white/40 mt-1 text-sm">Manage profile credentials, system roles, and authentication security.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* Account Profile Card */}
          <div className="glass-card p-6 border-indigo-500/20">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User size={20} className="text-indigo-400" />
              Account Overview
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-white/05">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg shadow-indigo-500/20">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">{user?.username}</h4>
                  <p className="text-xs text-white/40">Employee ID: #{user?.employeeId}</p>
                  <span className="badge badge-purple mt-1">{user?.role}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Status</label>
                <div className="text-sm font-semibold text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Active Account
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="glass-card p-6 border-purple-500/20">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Key size={20} className="text-purple-400" />
              Change Password
            </h3>

            {errorMessage && (
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-xl p-4 mb-4 text-green-400 text-sm">
                <Check size={16} />
                {successMessage}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-glass"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn-primary w-full mt-4"
              >
                {actionLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
