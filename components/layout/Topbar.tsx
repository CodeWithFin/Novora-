'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ScanLine,
  Bell,
  LogOut,
  User,
  Menu,
  Loader2,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/lib/store/uiStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { getItems } from '@/lib/api/items';
import type { Item } from '@/shared/types/item';
import { cn } from '@/lib/utils/cn';

interface TopbarProps {
  title?: string;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/items': 'Inventory',
  '/stock-in': 'Stock In',
  '/stock-out': 'Stock Out',
  '/expiring': 'Expiring Products',
  '/transactions': 'Transactions',
  '/shops': 'Shops',
  '/users': 'Team',
  '/settings': 'Settings',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        role === 'admin' && 'bg-primary/10 text-primary',
        role === 'staff' && 'bg-accent/10 text-accent',
        role === 'viewer' && 'bg-foreground-muted/10 text-foreground-muted'
      )}
    >
      {role}
    </span>
  );
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const displayTitle =
    title ??
    pageTitles[pathname] ??
    pageTitles[`/${pathname.split('/')[1]}`] ??
    'Novora';
  const { user, clearAuth } = useAuth();
  const { openScanner, toggleSidebar } = useUiStore();
  const { data: dashboardSummary } = useDashboard();
  const alertCount = dashboardSummary?.lowStockCount ?? 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    getItems({ search: debouncedQuery, limit: 5 })
      .then(({ data }) => {
        if (!cancelled) {
          setSearchResults(data);
          setSearchOpen(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSelect(item: Item) {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/items?search=${encodeURIComponent(item.name)}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/items?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border-default bg-white/92 px-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-md md:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-raised hover:text-foreground-primary md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="shrink-0 hand-title text-3xl tracking-tight text-black">
        {displayTitle}
      </h1>

      <div ref={searchRef} className="relative mx-auto hidden w-full max-w-md md:block">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              id="global-search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => searchQuery && setSearchOpen(true)}
              placeholder="Search items by name or SKU..."
              className="w-full rounded-lg border border-border-default bg-white py-2 pl-10 pr-4 text-sm font-semibold text-foreground-primary placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-foreground-muted" />
            )}
          </div>
        </form>

        {searchOpen && debouncedQuery.trim() && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border-default bg-overlay shadow-lg">
            {searchResults.length === 0 && !searchLoading ? (
              <p className="px-4 py-3 text-sm text-foreground-muted">
                No items found
              </p>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSearchSelect(item)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-raised"
                >
                  <div>
                    <p className="text-foreground-primary">{item.name}</p>
                    {item.sku && (
                      <p className="font-mono text-xs text-foreground-muted">
                        {item.sku}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'font-mono text-xs',
                      item.status === 'out' && 'text-danger',
                      item.status === 'low' && 'text-warning',
                      item.status === 'ok' && 'text-foreground-secondary'
                    )}
                  >
                    {item.totalStock}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={openScanner}
          className="rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-raised hover:text-foreground-primary"
          aria-label="Scan barcode"
        >
          <ScanLine className="h-5 w-5" />
        </button>

        <Link
          href="/items?status=low"
          className="relative rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-raised hover:text-foreground-primary"
          aria-label="Low stock alerts"
        >
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-raised"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-primary text-sm font-bold text-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[220px] overflow-hidden rounded-lg border border-border-default bg-overlay p-1 shadow-lg"
            >
              <div className="border-b border-border-subtle px-3 py-2.5">
                <p className="text-sm font-medium text-foreground-primary">
                  {displayName}
                </p>
                <p className="truncate text-xs text-foreground-muted">
                  {user?.email}
                </p>
                {user && (
                  <div className="mt-1.5">
                    <RoleBadge role={user.role} />
                  </div>
                )}
              </div>

              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-secondary outline-none hover:bg-raised hover:text-foreground-primary"
                >
                  <User className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border-subtle" />

              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-danger outline-none hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
