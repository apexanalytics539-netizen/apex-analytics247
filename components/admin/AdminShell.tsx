'use client';

import { ReactNode } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Trophy, 
  Calendar, 
  BrainCircuit, 
  Users,
  Bot,
  ShieldCheck,
  Receipt,
  Settings
} from 'lucide-react';

export type AdminSection = 'compose' | 'leagues' | 'fixtures' | 'ai' | 'users' | 'bots' | 'approvals' | 'receipts' | 'settings';

interface AdminShellProps {
  children: ReactNode;
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
}

const navItems: { id: AdminSection; label: string; icon: any }[] = [
  { id: 'compose', label: 'Compose', icon: PlusCircle },
  { id: 'leagues', label: 'Leagues', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'ai', label: 'AI Analysis', icon: BrainCircuit },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'bots', label: 'Bots', icon: Bot },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminShell({ children, active, onNavigate }: AdminShellProps) {
  return (
    <div className="w-full">
      {/* ✅ Responsive Navigation Tabs */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-6">
        <div className="flex gap-1 sm:gap-2 min-w-max pb-2">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap
                  ${isActive 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'text-[#8e96a3] hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}