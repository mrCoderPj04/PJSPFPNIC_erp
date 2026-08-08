'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { CalendarDays, LogIn, LogOut, Check, AlertCircle, Eye, Search } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  lateEntry: boolean;
  totalHours: number | null;
  user?: {
    id: string;
    username: string;
    employeeId: string;
  };
}

interface Employee {
  id: string;
  username: string;
  employeeId: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AttendancePage() {
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Filters
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Status for today
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Working Hours Calculator state
  const [calcEmpId, setCalcEmpId] = useState('');
  const [calcTimeframe, setCalcTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState('');

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!calcEmpId.trim() || !accessToken) return;
    setCalcError('');
    setCalcLoading(true);
    try {
      const res = await fetch(`${API}/attendance/calculator?employeeId=${encodeURIComponent(calcEmpId)}&timeframe=${calcTimeframe}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate hours');
      }
      setCalcResult(data);
    } catch (err: any) {
      setCalcError(err.message || 'Error occurred');
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  };

  // Security route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && isAuthenticated && user?.isFirstLogin) {
      router.replace('/change-password');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchAttendance = useCallback(async () => {
    if (!accessToken) return;
    try {
      setPageLoading(true);
      
      // Build query string
      const params = new URLSearchParams();
      if (filterUserId) params.append('userId', filterUserId);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const res = await fetch(`${API}/attendance?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);

        // Find today's check-in record for the logged-in user
        const today = new Date().toDateString();
        const foundToday = (data.records as AttendanceRecord[]).find(
          r => r.userId === user?.id && new Date(r.date).toDateString() === today
        );
        if (foundToday) {
          setTodayRecord(foundToday);
        } else {
          setTodayRecord(null);
        }
      }

      // Fetch employee list (Admin only)
      if (user?.role === 'ADMIN' && employees.length === 0) {
        const empRes = await fetch(`${API}/employees`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData.employees || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }, [accessToken, user, filterUserId, filterStartDate, filterEndDate, employees.length]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchAttendance();
    }
  }, [isAuthenticated, accessToken, filterUserId, filterStartDate, filterEndDate, fetchAttendance]);

  const handleCheckIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/attendance/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check in');
      }
      setTodayRecord(data.record);
      setSuccessMessage('Successfully checked in today.');
      fetchAttendance();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/attendance/check-out`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check out');
      }
      setTodayRecord(data.record);
      setSuccessMessage('Successfully checked out today.');
      fetchAttendance();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

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
            Loading attendance logs...
          </div>
        </main>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 fade-in-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Time & <span className="gradient-text">Attendance</span>
            </h1>
            <p className="text-white/40 mt-1 text-sm">Register active shifts, log daily hours, and analyze punch logs.</p>
          </div>
        </div>

        {/* Check in / Check out console */}
        <div className="glass-card p-6 mb-8 border-indigo-500/20 max-w-xl">
          <h3 className="text-lg font-bold mb-2">PUNCH CONSOLE</h3>
          <p className="text-sm text-white/50 mb-6">
            Office hours start at 9:00 AM. Access punch in/out buttons below.
          </p>

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

          <div className="flex flex-wrap items-center gap-4">
            {!todayRecord?.loginTime ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="btn-primary px-6 flex items-center gap-2"
              >
                <LogIn size={18} />
                Punch In Today
              </button>
            ) : !todayRecord?.logoutTime ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-3 py-1.5 rounded-xl font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                  Currently Checked In Since {new Date(todayRecord.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-6 py-3 font-semibold text-sm transition-all shadow-lg hover:shadow-red-500/20 flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Punch Out
                </button>
              </div>
            ) : (
              <span className="text-xs text-white/50 flex items-center gap-1.5 bg-white/05 px-4 py-2.5 rounded-xl border border-white/05 font-medium">
                <Check size={16} className="text-green-400" />
                Completed Shift today ({todayRecord.totalHours?.toFixed(2)} hours logged)
              </span>
            )}
          </div>
        </div>

        {/* Admin Employee Working Hours Calculator Card */}
        {isAdmin && (
          <div className="glass-card p-6 mb-8 border-purple-500/20 bg-gradient-to-r from-purple-900/10 via-neutral-900/40 to-indigo-900/10">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={20} className="text-purple-400" />
              <h3 className="text-lg font-bold text-white">Employee Working Hours Calculator</h3>
            </div>
            <p className="text-xs text-white/40 mb-6">
              Enter Employee ID or select employee to calculate total working hours for Day, Week, or Month.
            </p>

            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Employee ID / Select Employee</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Employee ID (e.g. 0001)"
                      value={calcEmpId}
                      onChange={(e) => setCalcEmpId(e.target.value)}
                      className="input-glass flex-1 text-xs"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setCalcEmpId(e.target.value);
                      }}
                      className="input-glass bg-neutral-900 border-white/10 text-xs w-48"
                    >
                      <option value="" style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>Quick Select</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.employeeId} style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>
                          {emp.username} (#{emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timeframe Filter Tabs */}
                <div className="flex bg-white/05 p-1 rounded-xl border border-white/05 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCalcTimeframe('day')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      calcTimeframe === 'day' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTimeframe('week')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      calcTimeframe === 'week' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTimeframe('month')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      calcTimeframe === 'month' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Month
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={calcLoading || !calcEmpId.trim()}
                  className="btn-primary py-2.5 px-6 text-xs flex items-center justify-center gap-2 shrink-0"
                >
                  {calcLoading ? 'Calculating...' : 'Calculate Hours'}
                </button>
              </div>
            </form>

            {calcError && (
              <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl p-3 mt-4 text-red-400 text-xs">
                <AlertCircle size={15} />
                {calcError}
              </div>
            )}

            {/* Calculated Result Card */}
            {calcResult && (
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 fade-in-up">
                <div className="bg-white/05 p-4 rounded-xl border border-white/05">
                  <span className="text-[10px] text-white/40 uppercase block font-semibold">Employee</span>
                  <span className="font-bold text-sm text-white block">{calcResult.employee?.username}</span>
                  <span className="text-[10px] text-indigo-400 font-mono">#{calcResult.employee?.employeeId}</span>
                </div>

                <div className="bg-white/05 p-4 rounded-xl border border-white/05">
                  <span className="text-[10px] text-white/40 uppercase block font-semibold">Total Working Hours</span>
                  <span className="font-extrabold text-2xl gradient-text block">{calcResult.totalHours} hrs</span>
                  <span className="text-[10px] text-white/30 capitalize">Filtered by {calcResult.timeframe}</span>
                </div>

                <div className="bg-white/05 p-4 rounded-xl border border-white/05">
                  <span className="text-[10px] text-white/40 uppercase block font-semibold">Shift Days Logged</span>
                  <span className="font-bold text-xl text-green-400 block">{calcResult.presentDays} days</span>
                  <span className="text-[10px] text-white/30">Total attendance records</span>
                </div>

                <div className="bg-white/05 p-4 rounded-xl border border-white/05">
                  <span className="text-[10px] text-white/40 uppercase block font-semibold">Late Punch Ins</span>
                  <span className="font-bold text-xl text-yellow-400 block">{calcResult.lateEntries} days</span>
                  <span className="text-[10px] text-white/30">Past 9:00 AM</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">Filter Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Employee</label>
                <select
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="input-glass bg-neutral-900 border-white/10 text-white"
                >
                  <option value="" style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>
                      {emp.username} (#{emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="input-glass bg-neutral-900 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="input-glass bg-neutral-900 border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        {/* Table logs */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Late Entry</th>
                  <th className="text-right">Worked Hours</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    {isAdmin && (
                      <td className="font-semibold text-white">
                        {rec.user?.username || 'Unknown'}
                        <span className="text-[10px] block text-white/40 font-normal">#{rec.user?.employeeId || ''}</span>
                      </td>
                    )}
                    <td className="text-white/80">
                      {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="font-mono text-white/80">
                      {rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                    </td>
                    <td className="font-mono text-white/80">
                      {rec.logoutTime ? new Date(rec.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Still Active'}
                    </td>
                    <td>
                      {rec.lateEntry ? (
                        <span className="badge badge-red">Late Entry</span>
                      ) : (
                        <span className="badge badge-green">On Time</span>
                      )}
                    </td>
                    <td className="text-right font-mono font-bold text-indigo-400">
                      {rec.totalHours ? `${rec.totalHours.toFixed(2)} hrs` : '-'}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-white/20 text-sm">
                      No attendance punch logs found matching these dates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
