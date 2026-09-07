'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, 
  XCircle, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Bot, 
  ShieldCheck, 
  Receipt, 
  Settings,
  Home,
  Trophy,
  Calendar,
  BarChart3,
  TrendingUp,
  Star,
  BookOpen,
  GraduationCap,
  PlusCircle,
  Ticket,
  BrainCircuit
} from 'lucide-react';

const ADMIN_EMAILS = ['apexanalytics539@gmail.com'];

// Admin navigation items
const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Compose Event', href: '/admin?section=compose', icon: PlusCircle },
  { name: 'Leagues', href: '/admin?section=leagues', icon: Trophy },
  { name: 'Fixtures', href: '/admin?section=fixtures', icon: Calendar },
  { name: 'AI Analysis', href: '/admin?section=ai', icon: BrainCircuit },
  { name: 'Users', href: '/admin?section=users', icon: Users },
  { name: 'Bots', href: '/admin/bots', icon: Bot },
  { name: 'Approvals', href: '/admin/approvals', icon: ShieldCheck },
  { name: 'Receipts', href: '/admin/receipts', icon: Receipt },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      if (ADMIN_EMAILS.includes(user.email || '')) {
        setIsAuthorized(true);
      }
      setLoading(false);
    }
    checkAdminAccess();
  }, [supabase, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[#8e96a3] text-sm">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-white flex-col gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-[#8e96a3] max-w-sm">You are not authorized to view the Admin Panel.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-[#6366f1] rounded-xl font-bold text-white hover:opacity-90 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex">
      
      {/* ✅ MOBILE OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ✅ SIDEBAR - Responsive */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-50
          h-screen bg-[#141a24] border-r border-white/5
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-20'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 min-h-[72px]">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'lg:hidden'}`}>
            <span className="text-xl font-bold text-white">Apex</span>
            <span className="text-xl font-bold text-emerald-400">Admin</span>
          </div>
          <div className={`flex items-center gap-2 ${sidebarOpen ? 'w-auto' : 'lg:w-full lg:justify-center'}`}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-400">A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href.split('?')[0]);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-[#8e96a3] hover:text-white hover:bg-white/5'
                  }
                  ${!sidebarOpen && 'lg:justify-center lg:px-2'}
                `}
                title={!sidebarOpen ? item.name : ''}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={`${!sidebarOpen && 'lg:hidden'} truncate`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => supabase.auth.signOut()}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-red-400 hover:bg-red-500/10 transition
              ${!sidebarOpen && 'lg:justify-center lg:px-2'}
            `}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`${!sidebarOpen && 'lg:hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ✅ MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        
        {/* ✅ HEADER - Responsive */}
        <header className="sticky top-0 z-30 bg-[#141a24]/95 backdrop-blur-xl border-b border-white/5 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex justify-between items-center min-h-[64px]">
          <div className="flex items-center gap-2">
            {/* ✅ Hamburger Menu Button (Mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Page Title - Mobile friendly */}
            <h1 className="text-base sm:text-lg md:text-xl font-bold truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">
              Admin Panel
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-400 hover:text-red-300 bg-red-500/10 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-red-500/20 transition whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ✅ MAIN CONTENT AREA - Responsive padding */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-auto w-full">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}