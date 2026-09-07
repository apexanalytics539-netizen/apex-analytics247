'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, PlusCircle, User, Settings, 
  BrainCircuit, Ticket, LogOut, ChevronLeft, ChevronRight,
  GraduationCap, BarChart3, Star, BookOpen, TrendingUp, Calendar,
  Home, Search, Users, Menu, X
} from 'lucide-react'

interface SidebarProps {
  fixtureCount?: number
  onSignOut: () => void
}

export default function Sidebar({ fixtureCount = 0, onSignOut }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // ✅ Desktop collapse state (your existing feature)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // ✅ Mobile sidebar state (new)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigationItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'AI Analysis', icon: BrainCircuit, href: '/dashboard/analyze' },
    { label: 'New Bet Slip', icon: PlusCircle, href: '/dashboard/betslip' },
    { label: 'Booking Codes', icon: Ticket, href: '/dashboard/booking' },
    { label: 'Grade Results', icon: GraduationCap, href: '/dashboard/grade' },
    { label: 'My Accuracy', icon: BarChart3, href: '/dashboard/accuracy' },
    { label: 'Favorite Teams', icon: Star, href: '/dashboard/favorites' },
    { label: 'Live Scores', icon: TrendingUp, href: '/dashboard/live' },
    { label: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
    { label: 'Profile', icon: User, href: '/dashboard/profile' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ]

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

      {/* ✅ Sidebar - Desktop + Mobile */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen
          bg-[rgba(18,23,33,0.75)] 
          backdrop-blur-md 
          border-r border-white/5 
          p-4 
          flex flex-col justify-between 
          transition-all duration-300 
          ${sidebarOpen ? 'w-[18rem]' : 'w-[5rem]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className={`flex items-center space-x-2 ${!sidebarOpen && 'hidden'}`}>
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-xl text-white tracking-wide">Apex Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              {/* ✅ Mobile close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-gray-400"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
              {/* ✅ Desktop collapse/expand button */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-sm font-medium text-gray-400 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.href) {
                      router.push(item.href)
                      setMobileOpen(false) // ✅ Close mobile sidebar on navigation
                    }
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all 
                    ${isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'hover:bg-white/5 hover:text-white'
                    }
                    ${!sidebarOpen && 'lg:justify-center lg:px-2'}
                  `}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className={`flex items-center space-x-3 ${!sidebarOpen && 'lg:space-x-0'}`}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </span>
                  {sidebarOpen && item.label === 'Dashboard' && fixtureCount > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0">
                      {fixtureCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section: Logout */}
        <div className="space-y-1 border-t border-white/5 pt-4 text-sm font-medium text-gray-400">
          <button 
            onClick={onSignOut} 
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
  )
}