'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Users, CheckSquare, Clock, Calendar, TrendingUp,
  Activity, UserCheck, ClipboardList, BarChart2, Briefcase
} from 'lucide-react';

interface DashboardStats {
  stats: {
    totalEmployees: number;
    activeTasks: number;
    completedTasks: number;
    pendingTasks: number;
    attendanceToday: number;
    meetingsToday: number;
  };
  recentActivity: any[];
  departments: { name: string; employeeCount: number; completedTasks: number }[];
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function DashboardContent() {
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && isAuthenticated && user?.isFirstLogin) {
      router.replace('/change-password');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || user?.role !== 'ADMIN') {
      setStatsLoading(false);
      return;
    }
    fetch(`${API}/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [isAuthenticated, accessToken, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  const ADMIN_STATS = data ? [
    { label: 'Total Employees', value: data.stats.totalEmployees, icon: <Users size={22} />, color: 'from-blue-500 to-blue-700', change: '+3 this month' },
    { label: 'Active Tasks', value: data.stats.activeTasks, icon: <Activity size={22} />, color: 'from-purple-500 to-purple-700', change: 'In progress' },
    { label: 'Completed Tasks', value: data.stats.completedTasks, icon: <CheckSquare size={22} />, color: 'from-green-500 to-green-700', change: 'All time' },
    { label: 'Pending Tasks', value: data.stats.pendingTasks, icon: <ClipboardList size={22} />, color: 'from-yellow-500 to-orange-600', change: 'Need attention' },
    { label: 'Attendance Today', value: data.stats.attendanceToday, icon: <UserCheck size={22} />, color: 'from-cyan-500 to-blue-600', change: 'Checked in' },
    { label: 'Meetings Today', value: data.stats.meetingsToday, icon: <Calendar size={22} />, color: 'from-pink-500 to-rose-700', change: 'Scheduled' },
  ] : [];

  const EMPLOYEE_STATS = [
    { label: 'My Tasks', value: '—', icon: <CheckSquare size={22} />, color: 'from-blue-500 to-blue-700', change: 'View all' },
    { label: 'Hours Today', value: '—', icon: <Clock size={22} />, color: 'from-purple-500 to-purple-700', change: 'Tracked' },
    { label: 'Meetings', value: '—', icon: <Calendar size={22} />, color: 'from-green-500 to-green-700', change: 'This week' },
    { label: 'Performance', value: '—', icon: <TrendingUp size={22} />, color: 'from-cyan-500 to-blue-600', change: 'This month' },
  ];

  const stats = isAdmin ? ADMIN_STATS : EMPLOYEE_STATS;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8">
        {/* Header */}
        <div className="mb-8 fade-in-up">
          <h1 className="text-2xl md:text-3xl font-bold">
            Good morning, <span className="gradient-text">{user?.username}</span> 👋
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            <span className={`badge ${isAdmin ? 'badge-purple' : 'badge-blue'}`}>{user?.role}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 mb-8`}>
          {statsLoading
            ? Array.from({ length: isAdmin ? 6 : 4 }).map((_, i) => (
                <div key={i} className="stat-card animate-pulse">
                  <div className="h-8 bg-white/5 rounded mb-3 w-10" />
                  <div className="h-6 bg-white/5 rounded mb-2 w-16" />
                  <div className="h-4 bg-white/5 rounded w-24" />
                </div>
              ))
            : stats.map((stat, i) => (
                <div key={stat.label} className={`stat-card fade-in-up delay-${(i + 1) * 100}`}>
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                  <div className="text-sm text-white/50 font-medium">{stat.label}</div>
                  <div className="text-xs text-white/25 mt-1">{stat.change}</div>
                </div>
              ))}
        </div>

        {/* Main Content */}
        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">Recent Activity</h2>
                <span className="badge badge-blue">Live</span>
              </div>
              <div className="space-y-3">
                {(data?.recentActivity || []).slice(0, 8).map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/05 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {log.user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{log.user?.username}</div>
                      <div className="text-xs text-white/30">Logged in · #{log.user?.employeeId}</div>
                    </div>
                    <div className="text-xs text-white/25 shrink-0">
                      {new Date(log.loginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {(!data?.recentActivity || data.recentActivity.length === 0) && (
                  <div className="text-center py-8 text-white/20 text-sm">No recent activity</div>
                )}
              </div>
            </div>

            {/* Department Overview */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-lg mb-5">Departments</h2>
              <div className="space-y-3">
                {(data?.departments || []).map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between py-2 border-b border-white/05 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{dept.name}</div>
                      <div className="text-xs text-white/30">{dept.employeeCount} members</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-400">{dept.completedTasks}</div>
                      <div className="text-xs text-white/25">tasks done</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 text-center py-16">
              <Briefcase size={48} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/30">Your tasks and work summary will appear here.</p>
            </div>
            <div className="glass-card p-6 text-center py-16">
              <BarChart2 size={48} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/30">Your performance analytics will appear here.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
