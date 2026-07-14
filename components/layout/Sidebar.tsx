'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  ArrowLeftRight,
  Store,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/lib/store/uiStore';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/items', icon: Package },
  { label: 'Stock In', href: '/stock-in', icon: PackagePlus },
  { label: 'Stock Out', href: '/stock-out', icon: PackageMinus },
  { label: 'Expiring', href: '/expiring', icon: AlertTriangle },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Shops', href: '/shops', icon: Store },
  { label: 'Team', href: '/users', icon: Users, adminOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        role === 'admin' && 'bg-primary/15 text-primary',
        role === 'staff' && 'bg-accent/15 text-accent',
        role === 'viewer' && 'bg-foreground-muted/15 text-foreground-muted'
      )}
    >
      {role}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, org, clearAuth, isAdmin } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border-default bg-white/95 shadow-[8px_0_30px_rgba(15,23,42,0.04)] backdrop-blur-md transition-all duration-300 md:flex',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b border-border-subtle',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white font-display text-2xl leading-none text-black shadow-[0_6px_18px_rgba(15,23,42,0.12)]">
            N
          </div>
          {!sidebarCollapsed && (
            <span className="font-display text-2xl leading-none tracking-tight text-black">
              Novora
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-thin">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-hand font-bold uppercase tracking-wide transition-colors',
                isActive
                  ? 'nav-active'
                  : 'text-foreground-secondary hover:bg-raised hover:text-foreground-primary',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-2">
        {!sidebarCollapsed && org && user && (
          <div className="mb-2 rounded-lg border border-border-default bg-[#bcecff]/40 px-3 py-2">
            <p className="truncate text-xs font-bold text-foreground-primary">
              {org.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-xs text-foreground-muted">
                {user.email}
              </p>
              <RoleBadge role={user.role} />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-hand font-bold uppercase tracking-wide text-foreground-secondary transition-colors hover:bg-danger/10 hover:text-danger',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span>Log out</span>}
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-foreground-muted transition-colors hover:bg-raised hover:text-foreground-secondary',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
