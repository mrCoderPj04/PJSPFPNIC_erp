'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Clock, MessageSquare,
  FileText, BarChart3, Settings, LogOut, Building2, Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_LINKS = [
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/dashboard/employees', icon: <Users size={18} />, label: 'Employees' },
  { href: '/dashboard/departments', icon: <Building2 size={18} />, label: 'Departments' },
  { href: '/dashboard/attendance', icon: <Clock size={18} />, label: 'Attendance' },
  { href: '/dashboard/notifications', icon: <Bell size={18} />, label: 'Alerts' },
  { href: '/dashboard/chat', icon: <MessageSquare size={18} />, label: 'Messages' },
  { href: '/dashboard/reports', icon: <FileText size={18} />, label: 'Reports' },
  { href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Settings' },
];

// Reports removed from employee portal
const EMPLOYEE_LINKS = [
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/dashboard/attendance', icon: <Clock size={18} />, label: 'Attendance' },
  { href: '/dashboard/notifications', icon: <Bell size={18} />, label: 'Alerts' },
  { href: '/dashboard/chat', icon: <MessageSquare size={18} />, label: 'Messages' },
  { href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const links = user?.role === 'ADMIN' ? ADMIN_LINKS : EMPLOYEE_LINKS;

  // Admin displayed as PJSOFONIC
  const displayName = user?.role === 'ADMIN' ? 'PJSOFONIC' : user?.username;

  return (
    <>
      {/* Fixed Top Header bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-cyan-500/20 flex items-center justify-between px-6 z-40">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-cyan-500/40 bg-black group-hover:shadow-[0_0_15px_rgba(0,240,255,0.6)] transition-all">
            <img src="/EMS.png" alt="PJSOFONIC EMS Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-base leading-none gradient-text tracking-wide">PJSOFONIC</div>
            <div className="text-cyan-400/70 text-[10px] leading-none mt-0.5 uppercase tracking-widest font-semibold">Employee Management</div>
          </div>
        </Link>

        {/* User Badge Info */}
        <div className="flex items-center gap-3 bg-white/05 border border-cyan-500/30 p-1.5 pr-3 rounded-full hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all">
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden border border-white/20">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="hidden sm:block text-left leading-tight min-w-0">
            <div className="font-medium text-xs text-white truncate max-w-[100px]">{displayName}</div>
            <div className="text-[9px] text-cyan-400/60 truncate">#{user?.employeeId}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 ml-1 shadow-[0_0_8px_#39ff14]" />
        </div>
      </header>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/95 backdrop-blur-md border-t border-cyan-500/20 flex items-center justify-start gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-4 z-40 select-none">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center shrink-0 min-w-[68px] h-14 rounded-xl transition-all gap-1 border ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.5)]'
                  : 'border-transparent text-white/70 hover:text-cyan-400 hover:bg-cyan-400/10 hover:shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              }`}
            >
              <span>{link.icon}</span>
              <span className="text-[10px] font-semibold leading-none">{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => logout()}
          className="flex flex-col items-center justify-center shrink-0 min-w-[68px] h-14 rounded-xl transition-all gap-1 border border-transparent hover:bg-pink-500/20 text-pink-500 hover:text-pink-300 hover:shadow-[0_0_15px_rgba(255,0,127,0.6)]"
        >
          <LogOut size={18} />
          <span className="text-[10px] font-semibold leading-none">Sign Out</span>
        </button>
      </nav>
    </>
  );
}
