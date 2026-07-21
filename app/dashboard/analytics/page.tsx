'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { BarChart3, TrendingUp, Users, CheckSquare, ShieldCheck, Clock, Zap } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AnalyticsPage() {
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Security route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && isAuthenticated && user?.isFirstLogin) {
      router.replace('/change-password');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchAnalytics = useCallback(async () => {
    if (!accessToken) return;
    try {
      setPageLoading(true);
      const res = await fetch(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchAnalytics();
    }
  }, [isAuthenticated, accessToken, fetchAnalytics]);

  if (isLoading || pageLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pt-24 pb-28 px-6 md:px-8 flex items-center justify-center">
          <div className="text-white/40 flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading analytics matrix...
          </div>
        </main>
      </div>
    );
  }

  const s = stats?.stats || {
    totalEmployees: 0,
    activeTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    attendanceToday: 0,
    meetingsToday: 0,
  };

  const totalTasks = s.completedTasks + s.activeTasks + s.pendingTasks || 1;
  const completionPercent = Math.round((s.completedTasks / totalTasks) * 100);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 fade-in-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              System <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-white/40 mt-1 text-sm">Real-time telemetry, productivity throughput, and team performance metrics.</p>
          </div>
        </div>

        {/* Top telemetry grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Productivity Score</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><TrendingUp size={20} /></div>
            </div>
            <div className="text-3xl font-bold mb-2">{completionPercent}%</div>
            <div className="w-full bg-white/05 rounded-full h-2 overflow-hidden mb-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: `${completionPercent}%` }} />
            </div>
            <p className="text-xs text-white/40">{s.completedTasks} of {totalTasks} total tasks completed</p>
          </div>

          <div className="glass-card p-6 border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Shift Participation</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Clock size={20} /></div>
            </div>
            <div className="text-3xl font-bold mb-2">{s.attendanceToday}</div>
            <p className="text-xs text-green-400 font-semibold mb-2">Active checked-in users today</p>
            <p className="text-xs text-white/40">Out of {s.totalEmployees} registered accounts</p>
          </div>

          <div className="glass-card p-6 border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Meetings Sync Rate</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Zap size={20} /></div>
            </div>
            <div className="text-3xl font-bold mb-2">{s.meetingsToday}</div>
            <p className="text-xs text-cyan-400 font-semibold mb-2">Sessions scheduled for today</p>
            <p className="text-xs text-white/40">Synced across project units</p>
          </div>
        </div>

        {/* Department performance matrix */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-400" />
            Department Completion Ratios
          </h3>

          <div className="space-y-4">
            {(stats?.departments || []).map((dept: any) => {
              const count = dept.employeeCount || 1;
              const ratio = Math.min(100, Math.round((dept.completedTasks / count) * 20));
              return (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{dept.name}</span>
                    <span className="text-white/40">{dept.completedTasks} tasks done · {dept.employeeCount} members</span>
                  </div>
                  <div className="w-full bg-white/05 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(10, ratio)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!stats?.departments || stats.departments.length === 0) && (
              <div className="text-center py-8 text-white/20 text-sm">No department metric items available</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
