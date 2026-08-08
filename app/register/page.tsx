'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { authService, RegisterUserData } from '../../services/auth.service';
import { UserPlus, Check, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterUserData>({
    employeeId: '',
    username: '',
    password: '',
    email: '',
    role: 'EMPLOYEE',
    designation: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await authService.register(formData);
      setMessage({ text: 'User account registered successfully!', type: 'success' });
      setFormData({
        employeeId: '',
        username: '',
        password: '',
        email: '',
        role: 'EMPLOYEE',
        designation: '',
      });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.error || err.message || 'Registration failed. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pt-24 pb-28 px-6 md:px-8 flex items-center justify-center">
          <div className="text-white/40">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8">
        <div className="mb-8 fade-in-up">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <UserPlus className="text-indigo-400" size={28} />
            Register <span className="gradient-text">New User</span>
          </h1>
          <p className="text-white/40 mt-1 text-sm">Create new employee or admin accounts (Admin Access Only)</p>
        </div>

        <div className="max-w-xl">
          <div className="glass-card p-8">
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                }`}
              >
                {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Employee ID <span className="text-rose-400">*</span>
                </label>
                <input
                  name="employeeId"
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP001"
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Username <span className="text-rose-400">*</span>
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="input-glass"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input-glass"
                  >
                    <option value="EMPLOYEE" className="bg-slate-900 text-white">EMPLOYEE</option>
                    <option value="ADMIN" className="bg-slate-900 text-white">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Designation
                  </label>
                  <input
                    name="designation"
                    type="text"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Software Engineer"
                    className="input-glass"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 font-semibold"
                >
                  {loading ? 'Registering...' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
