'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function SignoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center p-4">
      <div className="glass-card max-w-sm w-full p-8 text-center border-red-500/20">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <LogOut size={24} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Signing Out...</h2>
        <p className="text-xs text-white/40">Securing your session and redirecting to login portal.</p>
      </div>
    </div>
  );
}
