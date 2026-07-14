'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  MoreHorizontal,
  AlertTriangle,
  ArrowLeftRight,
  Store,
  Users,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils/cn';

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface MoreItem extends TabItem {
  adminOnly?: boolean;
}

const mainTabs: TabItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Items', href: '/items', icon: Package },
  { label: 'Stock In', href: '/stock-in', icon: PackagePlus },
  { label: 'Stock Out', href: '/stock-out', icon: PackageMinus },
];

const moreItems: MoreItem[] = [
  { label: 'Expiring', href: '/expiring', icon: AlertTriangle },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Shops', href: '/shops', icon: Store },
  { label: 'Team', href: '/users', icon: Users, adminOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, isAdmin } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleMoreItems = moreItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const isMoreActive = visibleMoreItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  function handleLogout() {
    setMoreOpen(false);
    clearAuth();
    router.push('/login');
  }

  function handleNavClick() {
    setMoreOpen(false);
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-border-default bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden">
        {mainTabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              )}
            >
              <tab.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              {tab.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
            isMoreActive
              ? 'text-primary'
              : 'text-foreground-muted hover:text-foreground-secondary'
          )}
        >
          <MoreHorizontal
            className={cn('h-5 w-5', isMoreActive && 'text-primary')}
          />
          More
        </button>
      </nav>

      <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-2 border-black bg-white p-4 pb-8 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-display text-2xl tracking-tight text-foreground-primary">
                More
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-raised hover:text-foreground-primary"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {visibleMoreItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border-subtle bg-raised/50 text-foreground-secondary hover:border-border-default hover:text-foreground-primary'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/5 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
