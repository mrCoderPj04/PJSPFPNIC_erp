'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Users, UserPlus, Search, Edit2, RotateCcw, Trash2, X, Check,
  AlertCircle, Lock, Key, Copy
} from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  username: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  salary?: number | null;
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

const API = process.env.NEXT_PUBLIC_API_URL || 'https://erp-backend-1-02lc.onrender.com/api';

function EmployeesContent() {
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
  const [formSalary, setFormSalary] = useState('');
  const [formRole, setFormRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  // Status / Password states
  const [createdCredentials, setCreatedCredentials] = useState<{ employeeId: string; tempPassword: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setPageLoading(true);
      const empRes = await fetch(`${API}/employees`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
          salary: formSalary ? parseFloat(formSalary) : 0,
          role: formRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create employee');

      setEmployees([data.employee, ...employees]);
      setCreatedCredentials({
        employeeId: data.employee.employeeId,
        tempPassword: data.tempPassword
      });
      setSuccessMessage('Employee created successfully.');
      setIsAddModalOpen(false);
      
      setFormUsername('');
      setFormEmail('');
      setFormPhone('');
      setFormDesignation('');
      setFormDepartmentId('');
      setFormPhotoUrl('');
      setFormSalary('');
      setFormRole('EMPLOYEE');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormUsername(emp.username);
    setFormEmail(emp.email || '');
    setFormPhone(emp.phone || '');
    setFormDesignation(emp.designation || '');
    setFormDepartmentId(emp.department?.id || '');
    setFormPhotoUrl(emp.photoUrl || '');
    setFormSalary(emp.salary ? String(emp.salary) : '');
    setFormRole(emp.role);
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditModalOpen(true);
  };

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
          salary: formSalary ? parseFloat(formSalary) : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update employee');

      // Re-fetch to get guaranteed fresh salary + all fields from server
      await fetchData();
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
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setCreatedCredentials({
        employeeId: emp.employeeId,
        tempPassword: data.tempPassword
      });
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to permanently delete ${emp.username}?`)) return;
    try {
      const res = await fetch(`${API}/employees/${emp.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setEmployees(employees.filter(e => e.id !== emp.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.includes(searchTerm) ||
      (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading || pageLoading) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <main className="flex-1 pt-24 pb-28 px-6 md:px-8 flex items-center justify-center">
          <div className="text-cyan-400 animate-pulse">Loading employee directory...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <main className="flex-1 pt-24 pb-28 px-6 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 fade-in-up border-b border-cyan-500/20 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Employee <span className="gradient-text">Directory</span>
            </h1>
            <p className="text-white/60 mt-1 text-sm">Manage staff accounts, profile images, and configure status.</p>
          </div>
          <button
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              setCreatedCredentials(null);
              setFormPhotoUrl('');
              setIsAddModalOpen(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 self-start font-extrabold"
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-4 mb-6 flex items-center gap-3 border-cyan-500/30">
          <Search size={18} className="text-cyan-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Employee ID, name, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 outline-none text-white w-full text-sm placeholder:text-white/40"
          />
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden border-cyan-500/30">
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation & Dept</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.username} className="w-full h-full object-cover" />
                          ) : (
                            emp.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{emp.username}</div>
                          <div className="text-xs text-cyan-400/80 font-mono">#{emp.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-white">{emp.designation || 'Staff'}</div>
                      <div className="text-xs text-white/50">{emp.department?.name || 'Unassigned'}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleStatusChange(emp.id, emp.status)}
                        className={`badge ${emp.status === 'ACTIVE' ? 'badge-green' : 'badge-red'} cursor-pointer`}
                      >
                        {emp.status}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400 transition-colors"
                          title="Edit Employee Profile"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(emp)}
                          className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors"
                          title="Reset Password"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp)}
                          className="p-2 hover:bg-pink-500/20 rounded-lg text-pink-400 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Employee */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 relative border-cyan-500/40">
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">Add New Employee Profile</h2>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Username</label>
                  <input type="text" required value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="input-glass" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="input-glass" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Phone</label>
                    <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="input-glass" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" value={formDesignation} onChange={(e) => setFormDesignation(e.target.value)} className="input-glass" />
                </div>

                {/* Profile Image Input */}
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Profile Image / Avatar</label>
                  <div className="flex items-center gap-3">
                    {formPhotoUrl && (
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-cyan-400">
                        <img src={formPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                      className="input-glass bg-black border-cyan-500/30 text-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as 'EMPLOYEE' | 'ADMIN')}
                      className="input-glass bg-black border-cyan-500/30 text-white"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={actionLoading} className="btn-primary w-full py-3 font-bold">
                  {actionLoading ? 'Creating...' : 'Create Employee'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Employee */}
        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 relative border-cyan-500/40">
              <button onClick={() => { setIsEditModalOpen(false); setSelectedEmployee(null); }} className="absolute top-4 right-4 text-white/60 hover:text-white">
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold mb-4 text-cyan-400">Edit Employee Profile</h2>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Username</label>
                  <input type="text" required value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="input-glass" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="input-glass" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Phone</label>
                    <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="input-glass" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" value={formDesignation} onChange={(e) => setFormDesignation(e.target.value)} className="input-glass" />
                </div>

                {/* Profile Image Input */}
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Profile Image / Avatar</label>
                  <div className="flex items-center gap-3">
                    {formPhotoUrl && (
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-cyan-400">
                        <img src={formPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="input-glass bg-black border-cyan-500/30 text-white"
                  >
                    <option value="">No Department / Unassigned</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={actionLoading} className="btn-primary w-full py-3 font-bold">
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Generated Credentials */}
        {createdCredentials && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 relative border-cyan-500/50 shadow-[0_0_35px_rgba(0,240,255,0.35)] animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setCreatedCredentials(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 mx-auto mb-3 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                  <Key size={24} />
                </div>
                <h2 className="text-xl font-extrabold text-white">Employee Credentials</h2>
                <p className="text-xs text-white/60 mt-1">Generated Employee ID and Temporary Password. Please share these with the employee.</p>
              </div>

              <div className="bg-black/80 border border-cyan-500/30 rounded-2xl p-5 space-y-4 font-mono shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase font-semibold">Employee ID</span>
                  <span className="text-cyan-400 font-bold text-base bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                    #{createdCredentials.employeeId}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-xs text-white/50 uppercase font-semibold">Temp Password</span>
                  <span className="text-green-400 font-bold text-base bg-green-500/15 px-3 py-1 rounded-lg border border-green-500/30">
                    {createdCredentials.tempPassword}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Employee ID: ${createdCredentials.employeeId}\nPassword: ${createdCredentials.tempPassword}`);
                    alert('📋 Credentials copied to clipboard!');
                  }}
                  className="btn-primary flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <Copy size={16} /> Copy Credentials
                </button>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="btn-tertiary py-3 px-5 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <ProtectedRoute>
      <EmployeesContent />
    </ProtectedRoute>
  );
}
