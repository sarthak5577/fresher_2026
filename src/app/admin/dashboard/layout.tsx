'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, CreditCard, QrCode, Settings,
  FileBarChart, LogOut, Menu, X, GraduationCap, Shield, CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/dashboard/students', label: 'Students', icon: Users },
  { href: '/admin/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/dashboard/verify', label: 'Verify Payments', icon: CheckCircle },
  { href: '/admin/dashboard/scanner', label: 'QR Scanner', icon: QrCode },
  { href: '/admin/dashboard/settings', label: 'Event Settings', icon: Settings },
  { href: '/admin/dashboard/reports', label: 'Reports', icon: FileBarChart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('name, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      setAdminName(profile.name || user.email || 'Admin');
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full spinner mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-purple-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">FRESHERS 2026</div>
            <div className="text-purple-400 text-xs flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/30 text-white border border-purple-600/40'
                  : 'text-slate-400 hover:text-white hover:bg-purple-900/20'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="p-4 border-t border-purple-900/30">
        <div className="flex items-center gap-3 mb-3 px-4">
          <div className="w-8 h-8 rounded-lg bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold text-sm">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{adminName}</div>
            <div className="text-slate-500 text-xs">Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0118] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0f0528] border-r border-purple-900/30 fixed left-0 top-0 bottom-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 flex flex-col w-64 bg-[#0f0528] border-r border-purple-900/30 h-full">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#0f0528] border-b border-purple-900/30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-white font-bold text-sm">FRESHERS 2026 Admin</div>
          <div className="w-6" />
        </div>

        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

