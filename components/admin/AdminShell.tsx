'use client'

import { PenSquare, Trophy, CalendarClock, BrainCircuit, ShieldCheck, Users } from 'lucide-react'

export type AdminSection = 'compose' | 'leagues' | 'fixtures' | 'ai' | 'users'

const NAV_ITEMS: { id: AdminSection; label: string; icon: any; description: string }[] = [
  { id: 'compose', label: 'Compose Event', icon: PenSquare, description: 'Manually publish a fixture & pick' },
  { id: 'leagues', label: 'League Control', icon: Trophy, description: 'Enable or disable leagues' },
  { id: 'fixtures', label: 'Match Queue', icon: CalendarClock, description: 'Fixtures awaiting or in analysis' },
  { id: 'ai', label: 'AI Performance', icon: BrainCircuit, description: 'Model accuracy & analysis tools' },
  { id: 'users', label: 'Users', icon: Users, description: 'Manage accounts & admin access' },
]

export default function AdminShell({
  active,
  onNavigate,
  children,
}: {
  active: AdminSection
  onNavigate: (section: AdminSection) => void
  children: React.ReactNode
}) {
  const activeItem = NAV_ITEMS.find((i) => i.id === active)

  return (
    <div className="min-h-screen bg-[#0a0c12] text-slate-200 flex">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-[#0d0f16] border-r border-white/5 flex flex-col">
        <div className="px-5 py-6 border-b border-white/5 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="text-sm font-bold text-white leading-none">Apex Analytics</div>
            <div className="text-[10px] text-slate-500 mt-1">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.id === active
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/5 text-[10px] text-slate-600">
          Internal tool &middot; not visible to end users
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 flex-shrink-0">
          <div>
            <div className="text-[11px] text-slate-500 font-mono">Admin / {activeItem?.label}</div>
            <h1 className="text-lg font-bold text-white">{activeItem?.label}</h1>
          </div>
          <p className="text-xs text-slate-500 max-w-xs text-right hidden md:block">{activeItem?.description}</p>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}