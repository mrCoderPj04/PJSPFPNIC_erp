'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import {
  Users, UserPlus, Search, Edit2, RotateCcw, Trash2, X, Check,
  AlertCircle, Lock
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  username: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  role: 'ADMIN' | 'EMPLOYEE';
  designation: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  department?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  manager?: { id: string; username: string } | null;
  loginLogs?: { loginAt: string; logoutAt: string | null }[];
}

interface Department {
  id: string;
  name: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function EmployeesPage() {
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State lists
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Add / Edit form state
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formRole, setFormRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  // Status / Password states
  const [createdCredentials, setCreatedCredentials] = useState<{ employeeId: string; tempPassword: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Security route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
    if (!isLoading && isAuthenticated) {
      if (user?.role !== 'ADMIN') {
        router.replace('/dashboard');
      } else if (user?.isFirstLogin) {
        router.replace('/change-password');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Load initial page data
  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setPageLoading(true);
      // Fetch employees
      const empRes = await fetch(`${API}/employees`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }

      // Fetch departments
      const deptRes = await fetch(`${API}/departments`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken && user?.role === 'ADMIN') {
      fetchData();
    }
  }, [isAuthenticated, accessToken, user, fetchData]);

  // Handle Add Employee Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setCreatedCredentials(null);
    setActionLoading(true);

    try {
      const res = await fetch(`${API}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: formUsername,
          email: formEmail || undefined,
          phone: formPhone || undefined,
          departmentId: formDepartmentId || undefined,
          designation: formDesignation || undefined,
          photoUrl: formPhotoUrl || undefined,
          role: formRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create employee');
      }

      setEmployees([data.employee, ...employees]);
      setCreatedCredentials({
        employeeId: data.employee.employeeId,
        tempPassword: data.tempPassword
      });
      setSuccessMessage(data.message || 'Employee created successfully.');
      
      // Clean up fields
      setFormUsername('');
      setFormEmail('');
      setFormPhone('');
      setFormDesignation('');
      setFormDepartmentId('');
      setFormPhotoUrl('');
      setFormRole('EMPLOYEE');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal with Employee details
  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormUsername(emp.username);
    setFormEmail(emp.email || '');
    setFormPhone(emp.phone || '');
    setFormDesignation(emp.designation || '');
    setFormDepartmentId(emp.department?.id || '');
    setFormPhotoUrl(emp.photoUrl || '');
    setFormRole(emp.role);
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditModalOpen(true);
  };

  // Handle Edit Employee Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setErrorMessage('');
    setSuccessMessage('');
    setActionLoading(true);

    try {
      const res = await fetch(`${API}/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: formUsername,
          email: formEmail || undefined,
          phone: formPhone || undefined,
          departmentId: formDepartmentId || undefined,
          designation: formDesignation || undefined,
          photoUrl: formPhotoUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      setEmployees(employees.map(emp => emp.id === selectedEmployee.id ? { ...emp, ...data.employee } : emp));
      setSuccessMessage('Employee details updated successfully.');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSelectedEmployee(null);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Employee Status (ACTIVE / INACTIVE / LOCKED)
  const handleStatusChange = async (empId: string, currentStatus: string) => {
    let nextStatus: 'ACTIVE' | 'INACTIVE' | 'LOCKED' = 'ACTIVE';
    if (currentStatus === 'ACTIVE') nextStatus = 'INACTIVE';
    else if (currentStatus === 'INACTIVE') nextStatus = 'LOCKED';

    try {
      const res = await fetch(`${API}/employees/${empId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(employees.map(emp => emp.id === empId ? { ...emp, status: data.employee.status } : emp));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Employee Password
  const handleResetPassword = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to reset password for ${emp.username}?`)) return;
    setErrorMessage('');
    setSuccessMessage('');
    setCreatedCredentials(null);

    try {
      const res = await fetch(`${API}/employees/${emp.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      setCreatedCredentials({
        employeeId: emp.employeeId,
        tempPassword: data.tempPassword
      });
    } catch (err: any) {
      alert(err.message || 'Error occurred during reset');
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to permanently delete ${emp.username}?`)) return;
    try {
      const res = await fetch(`${API}/employees/${emp.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setEmployees(employees.filter(e => e.id !== emp.id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete employee');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter list
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.includes(searchTerm) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            Loading employees list...
          </div>
        </main>
      </div>
    );
  }

  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const lockedCount = employees.filter(e => e.status === 'LOCKED').length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 fade-in-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Employee <span className="gradient-text">Directory</span>
            </h1>
            <p className="text-white/40 mt-1 text-sm">Manage company employee accounts and configuration credentials.</p>
          </div>
          <button
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              setCreatedCredentials(null);
              setIsAddModalOpen(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 self-start"
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>

        {/* Stats segment */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="stat-card fade-in-up delay-100">
            <div className="text-2xl font-bold mb-0.5">{employees.length}</div>
            <div className="text-xs text-white/50 font-medium">Total Accounts</div>
          </div>
          <div className="stat-card fade-in-up delay-200">
            <div className="text-2xl font-bold mb-0.5 text-green-400">{activeCount}</div>
            <div className="text-xs text-white/50 font-medium">Active Members</div>
          </div>
          <div className="stat-card fade-in-up delay-300">
            <div className="text-2xl font-bold mb-0.5 text-red-400">{lockedCount}</div>
            <div className="text-xs text-white/50 font-medium">Locked / Disabled</div>
          </div>
        </div>

        {/* Search bar */}
        <div className="glass-card p-4 mb-6 flex items-center gap-3">
          <Search size={18} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search by Employee ID, name, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 outline-none text-white w-full text-sm placeholder:text-white/20"
          />
        </div>

        {/* List table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>Status</th>
                  <th>Latest Session</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const statusBadgeClass =
                    emp.status === 'ACTIVE'
                      ? 'badge-green'
                      : emp.status === 'INACTIVE'
                      ? 'badge-yellow'
                      : 'badge-red';

                  const lastLogin = emp.loginLogs?.[0]?.loginAt;

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt={emp.username} className="w-full h-full object-cover" />
                            ) : (
                              emp.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{emp.username}</div>
                            <div className="text-xs text-white/40">#{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-white/80">{emp.designation || 'No Designation'}</div>
                        <div className="text-xs text-white/40">
                          {emp.department?.name || 'No Dept'} ·{' '}
                          <span className={emp.role === 'ADMIN' ? 'text-purple-400 font-medium' : 'text-white/30'}>
                            {emp.role}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleStatusChange(emp.id, emp.status)}
                          className={`badge ${statusBadgeClass} hover:brightness-125 transition-all text-xs font-semibold cursor-pointer`}
                          title="Click to cycle status"
                        >
                          {emp.status}
                        </button>
                      </td>
                      <td className="text-xs text-white/50">
                        {lastLogin ? (
                          <>
                            <div>{new Date(lastLogin).toLocaleDateString()}</div>
                            <div className="text-[10px] text-white/30">
                              {new Date(lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </>
                        ) : (
                          'Never logged in'
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                            title="Edit details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleResetPassword(emp)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-yellow-400 transition-colors"
                            title="Reset password"
                          >
                            <RotateCcw size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-400/60 hover:text-red-400 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-white/20 text-sm">
                      No employees match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Display Temporary Credentials */}
        {createdCredentials && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-sm w-full p-6 relative border-yellow-500/30">
              <div className="flex items-center gap-3 text-yellow-400 mb-4">
                <Lock size={24} />
                <h3 className="text-lg font-bold">Temporary Credentials</h3>
              </div>
              <p className="text-sm text-white/70 mb-4">
                Share these login credentials securely. The employee will be forced to change the password on their first login.
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-xs text-white/40 block mb-1">Employee ID</span>
                  <div className="bg-white/05 rounded-xl p-3 flex items-center justify-between border border-white/05 select-all">
                    <span className="font-mono text-base font-bold tracking-wider text-white">{createdCredentials.employeeId}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-white/40 block mb-1">Temporary Password</span>
                  <div className="bg-white/05 rounded-xl p-3 flex items-center justify-between border border-white/05 select-all">
                    <span className="font-mono text-base font-bold tracking-wider text-white">{createdCredentials.tempPassword}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setCreatedCredentials(null)}
                className="btn-primary w-full"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Modal: Add Employee */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <UserPlus size={22} className="text-indigo-400" />
                <h2 className="text-xl font-bold">New Employee Profile</h2>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-4 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {errorMessage}
                </div>
              )}
              {successMessage && !createdCredentials && (
                <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-xl p-4 mb-4 text-green-400 text-sm">
                  <Check size={16} />
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. johndoe"
                    className="input-glass"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. john@agency.com"
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +91 99887766"
                      className="input-glass"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Designation</label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g. Frontend Dev"
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Department</label>
                    <select
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                      className="input-glass bg-neutral-900 border-white/10 text-white"
                    >
                      <option value="" style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id} style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Profile Picture URL</label>
                  <input
                    type="url"
                    value={formPhotoUrl}
                    onChange={(e) => setFormPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or avatar URL"
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">System Role</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        checked={formRole === 'EMPLOYEE'}
                        onChange={() => setFormRole('EMPLOYEE')}
                        className="accent-indigo-500"
                      />
                      Employee Workspace
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-purple-400">
                      <input
                        type="radio"
                        name="role"
                        checked={formRole === 'ADMIN'}
                        onChange={() => setFormRole('ADMIN')}
                        className="accent-indigo-500"
                      />
                      Administrator Access
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {actionLoading ? 'Creating User...' : 'Create Employee Profile'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Employee */}
        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 relative">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEmployee(null);
                }}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <Users size={22} className="text-indigo-400" />
                <h2 className="text-xl font-bold">Edit Details: {selectedEmployee.username}</h2>
              </div>

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

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="input-glass"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. john@agency.com"
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +91 99887766"
                      className="input-glass"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Designation</label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Department</label>
                    <select
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                      className="input-glass bg-neutral-900 border-white/10 text-white"
                    >
                      <option value="" style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id} style={{ backgroundColor: '#0a0a1a', color: '#f8fafc' }}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Profile Picture URL</label>
                  <input
                    type="url"
                    value={formPhotoUrl}
                    onChange={(e) => setFormPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or avatar URL"
                    className="input-glass"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {actionLoading ? 'Updating details...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
