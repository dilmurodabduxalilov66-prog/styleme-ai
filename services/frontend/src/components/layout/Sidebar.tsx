'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/utils/cn';
import {
  Calendar,
  Users,
  Award,
  Wallet,
  Settings,
  ShieldCheck,
  TrendingUp,
  LineChart,
  HardDrive,
  UserCheck,
  LogOut,
  FolderLock
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const { sidebarExpanded, toggleSidebar } = useUIStore();

  const role = user?.role || 'USER';

  const menuItems: Record<string, Array<{ name: string; href: string; icon: any }>> = {
    BARBER: [
      { name: 'Kalendar', href: '/schedule', icon: Calendar },
      { name: 'Mijozlar (CRM)', href: '/crm', icon: Users },
      { name: 'Kassa (Ledger)', href: '/ledger', icon: Wallet },
      { name: 'Reyting', href: '/reputation', icon: Award },
      { name: 'Profil Sozlamalari', href: '/barber-profile', icon: Settings },
    ],
    ADMIN: [
      { name: 'Triage Quti', href: '/triage', icon: ShieldCheck },
      { name: 'Tasdiqlash', href: '/verify', icon: UserCheck },
      { name: 'Moderatsiya', href: '/moderate', icon: FolderLock },
      { name: 'Tizim Stats', href: '/stats', icon: LineChart },
      { name: 'Sartaroshlar', href: '/manage-barbers', icon: Users },
      { name: 'Pul Qaytarish', href: '/refunds', icon: Wallet },
    ],
    OWNER: [
      { name: 'Moliya BI', href: '/bi', icon: Wallet },
      { name: 'O\'sish Ko\'rsatkichlari', href: '/growth', icon: TrendingUp },
      { name: 'Server Telemetriya', href: '/telemetry', icon: HardDrive },
      { name: 'Admin Boshqaruvi', href: '/admins', icon: Users },
      { name: 'Tizim Stavkalari', href: '/settings', icon: Settings },
    ],
  };

  const activeMenuItems = menuItems[role] || [];

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col glass-panel transition-all duration-300 ease-in-out h-screen sticky top-0",
        sidebarExpanded ? "w-64" : "w-16"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-4 border-b border-border-glass">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {sidebarExpanded && (
            <span className="font-display text-lg font-bold tracking-tight text-text-primary whitespace-nowrap">
              StyleMe <span className="text-primary">Ops</span>
            </span>
          )}
        </Link>
      </div>

      {/* Main Navigation links */}
      <nav className="flex-1 space-y-1 p-2">
        {activeMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary border-l-4 border-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-border-glass"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarExpanded && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Panel Actions */}
      <div className="p-2 border-t border-border-glass">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors duration-150"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {sidebarExpanded && <span>Tizimdan Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}
