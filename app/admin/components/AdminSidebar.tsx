'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  ShieldCheck, 
  Receipt, 
  Settings,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Bots', href: '/admin/bots', icon: Bot },
  { name: 'Approvals', href: '/admin/approvals', icon: ShieldCheck },
  { name: 'Receipts', href: '/admin/receipts', icon: Receipt },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#141a24] border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        <p className="text-[#8e96a3] text-sm">Manage your platform</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20'
                  : 'text-[#8e96a3] hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/5">
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition w-full">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}