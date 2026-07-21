'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CheckSquare, Clock, MessageSquare,
  Calendar, FileText, BarChart3, Settings, LogOut, Building2, UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_LINKS = [
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/register', icon: <UserPlus size={18} />, label: 'Register User' },
  { href: '/dashboard/employees', icon: <Users size={18} />, label: 'Employees' },
  { href: '/dashboard/departments', icon: <Building2 size={18} />, label: 'Departments' },
  { href: '/dashboard/tasks', icon: <CheckSquare size={18} />, label: 'Tasks' },
  { href: '/dashboard/attendance', icon: <Clock size={18} />, label: 'Attendance' },
  { href: '/dashboard/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { href: '/dashboard/meetings', icon: <Calendar size={18} />, label: 'Meetings' },
  { href: '/dashboard/reports', icon: <FileText size={18} />, label: 'Reports' },
  { href: '/dashboard/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Settings' },
];

const EMPLOYEE_LINKS = [
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/dashboard/tasks', icon: <CheckSquare size={18} />, label: 'Tasks' },
  { href: '/dashboard/attendance', icon: <Clock size={18} />, label: 'Attendance' },
  { href: '/dashboard/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { href: '/dashboard/meetings', icon: <Calendar size={18} />, label: 'Meetings' },
  { href: '/dashboard/reports', icon: <FileText size={18} />, label: 'Reports' },
  { href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const links = user?.role === 'ADMIN' ? ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <>
      {/* Fixed Top Header bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-950/80 backdrop-blur-md border-b border-white/05 flex items-center justify-between px-6 z-40">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-white/10 bg-neutral-900">
            <img src="/logo.png" alt="PJERP Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-base leading-none gradient-text">PJERP</div>
            <div className="text-white/30 text-[10px] leading-none mt-0.5 uppercase tracking-widest font-semibold">PJSOFONIC</div>
          </div>
        </Link>

        {/* User Badge Info */}
        <div className="flex items-center gap-3 bg-white/05 border border-white/05 p-1.5 pr-3 rounded-full">
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left leading-tight min-w-0">
            <div className="font-medium text-xs text-white truncate max-w-[80px]">{user?.username}</div>
            <div className="text-[9px] text-white/30 truncate">#{user?.employeeId}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 ml-1" />
        </div>
      </header>

      {/* Fixed Bottom Dock Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-neutral-950/90 backdrop-blur-md border-t border-white/05 flex items-center justify-start gap-1 overflow-x-auto no-scrollbar scroll-smooth px-4 z-40 select-none">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center shrink-0 min-w-[70px] h-14 rounded-xl transition-all gap-1 border ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400'
                  : 'border-transparent hover:bg-white/05 text-white/60 hover:text-white'
              }`}
            >
              <span>{link.icon}</span>
              <span className="text-[10px] font-medium leading-none">{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => logout()}
          className="flex flex-col items-center justify-center shrink-0 min-w-[70px] h-14 rounded-xl transition-all gap-1 border border-transparent hover:bg-red-500/10 text-red-400/80 hover:text-red-400"
        >
          <LogOut size={18} />
          <span className="text-[10px] font-medium leading-none">Sign Out</span>
        </button>
      </nav>
    </>
  );
}
