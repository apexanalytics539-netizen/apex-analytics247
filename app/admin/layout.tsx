'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
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
  Trophy,
  Calendar,
  BrainCircuit,
  PlusCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ADMIN_EMAILS = ['apexanalytics539@gmail.com'];

// Admin navigation items with section mapping
const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, section: null },
  { name: 'Compose Event', href: '/admin?section=compose', icon: PlusCircle, section: 'compose' },
  { name: 'Leagues', href: '/admin?section=leagues', icon: Trophy, section: 'leagues' },
  { name: 'Fixtures', href: '/admin?section=fixtures', icon: Calendar, section: 'fixtures' },
  { name: 'AI Analysis', href: '/admin?section=ai', icon: BrainCircuit, section: 'ai' },
  { name: 'Users', href: '/admin?section=users', icon: Users, section: 'users' },
  { name: 'Bots', href: '/admin?section=bots', icon: Bot, section: 'bots' },
  { name: 'Approvals', href: '/admin?section=approvals', icon: ShieldCheck, section: 'approvals' },
  { name: 'Receipts', href: '/admin?section=receipts', icon: Receipt, section: 'receipts' },
  { name: 'Settings', href: '/admin?section=settings', icon: Settings, section: 'settings' },
];

// ✅ Sidebar Component - uses context for navigation
function AdminSidebarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { section, navigateTo } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // ✅ Handle navigation using context
  const handleNavigation = (item: typeof navItems[0]) => {
    console.log('🔍 Sidebar - Clicked:', item.name, 'section:', item.section)
    setMobileOpen(false)
    
    if (item.section) {
      // Use context to navigate
      navigateTo(item.section as any)
    } else {
      router.push('/admin')
    }
  }

  return (
    <>
      {/* ✅ Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[rgba(18,23,33,0.95)] rounded-lg border border-white/10 text-white hover:bg-white/10 transition"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ✅ Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ✅ SIDEBAR */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen
          bg-[#141a24] 
          border-r border-white/5 
          p-4 
          flex flex-col justify-between 
          transition-all duration-300 
          ${sidebarOpen ? 'w-[18rem]' : 'w-[5rem]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className={`flex items-center space-x-2 ${!sidebarOpen && 'hidden'}`}>
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-xl text-white tracking-wide">Apex Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-gray-400"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm font-medium text-gray-400 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navItems.map((item) => {
              // ✅ Check if this section is active
              const isActive = pathname === '/admin' && 
                ((item.section === null && !section) || 
                 (item.section !== null && section === item.section))
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all 
                    ${isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'hover:bg-white/5 hover:text-white'
                    }
                    ${!sidebarOpen && 'lg:justify-center lg:px-2'}
                  `}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <span className={`flex items-center space-x-3 ${!sidebarOpen && 'lg:space-x-0'}`}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span>{item.name}</span>}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section: Logout */}
        <div className="space-y-1 border-t border-white/5 pt-4 text-sm font-medium text-gray-400">
          <button 
            onClick={() => supabase.auth.signOut()} 
            className={`
              w-full flex items-center px-4 py-3 rounded-lg transition 
              hover:bg-white/5 hover:text-white text-left
              ${!sidebarOpen && 'lg:justify-center lg:px-2'}
            `}
            title={!sidebarOpen ? 'Log Out' : ''}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="ml-3">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ✅ Main Layout - Wraps with AdminProvider
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('🔍 Admin Layout - User:', user?.email);
        
        if (error) {
          console.error('❌ Auth error:', error);
          router.push('/auth/signin');
          return;
        }

        if (!user) {
          console.log('❌ No user found');
          router.push('/auth/signin');
          return;
        }

        if (ADMIN_EMAILS.includes(user.email || '')) {
          console.log('✅ Admin access granted');
          setIsAuthorized(true);
        } else {
          console.log('❌ Not admin, email:', user.email);
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    }
    checkAdminAccess();
  }, [router]);

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
      <AdminSidebarContent />
      
      {/* ✅ MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        
        {/* ✅ HEADER */}
        <header className="sticky top-0 z-30 bg-[#141a24]/95 backdrop-blur-xl border-b border-white/5 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex justify-between items-center min-h-[64px]">
          <div className="flex items-center gap-2">
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

        {/* ✅ MAIN CONTENT AREA */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-auto w-full">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}