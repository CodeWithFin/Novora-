'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickDispatch } from '@/components/stock/QuickDispatch';
import { ScannerDrawer } from '@/components/scanner/ScannerDrawer';
import { ShortcutsHelpModal } from '@/components/ShortcutsHelpModal';
import { AppFloaters } from '@/components/layout/AppFloaters';
import { useUiStore } from '@/lib/store/uiStore';
import { syncQueue } from '@/lib/offline/dispatchQueue';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const offline = useUiStore((s) => s.offline);
  const syncing = useUiStore((s) => s.syncing);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setOffline = useUiStore((s) => s.setOffline);
  const setSyncing = useUiStore((s) => s.setSyncing);
  const openQuickDispatch = useUiStore((s) => s.openQuickDispatch);
  const closeAll = useUiStore((s) => s.closeAll);
  const openShortcuts = useUiStore((s) => s.openShortcuts);

  useEffect(() => {
    const handleOnline = async () => {
      setOffline(false);
      setSyncing(true);
      const { synced, failed } = await syncQueue(api);
      setSyncing(false);
      if (synced > 0) {
        toast.success(`${synced} dispatch${synced > 1 ? 'es' : ''} synced`);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['stock'] });
      }
      if (failed > 0) {
        toast.error(`${failed} dispatch${failed > 1 ? 'es' : ''} failed to sync`);
      }
    };

    const handleOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline, setSyncing, queryClient]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as Element).tagName
        )
      ) {
        return;
      }

      switch (e.key) {
        case 'D':
        case 'd':
          if (pathname !== '/stock-out') openQuickDispatch();
          break;
        case 'I':
        case 'i':
          router.push('/stock-in');
          break;
        case 'S':
        case 's':
          document
            .querySelector<HTMLInputElement>('#global-search')
            ?.focus();
          break;
        case 'Escape':
          closeAll();
          break;
        case '?':
          openShortcuts();
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [router, pathname, openQuickDispatch, closeAll, openShortcuts]);

  return (
    <div className="app-fun flex min-h-screen bg-transparent">
      {(offline || syncing) && (
        <div
          className={cn(
            'fixed top-0 left-0 right-0 z-[60] py-2 text-center text-sm font-hand font-bold',
            syncing
              ? 'bg-primary/20 text-black'
              : 'bg-warning/25 text-black'
          )}
        >
          {syncing
            ? 'Syncing queued dispatches...'
            : "You're offline — dispatches will be queued and synced when you reconnect"}
        </div>
      )}

      <Sidebar />
      <div
        className={cn(
          'relative flex flex-1 flex-col pb-16 transition-[margin] duration-300 md:pb-0',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        <Topbar />
        <main className="fun-content relative flex-1 overflow-hidden p-4 md:p-6">
          <AppFloaters />
          <div className="fun-content">{children}</div>
        </main>
      </div>
      <MobileNav />
      <QuickDispatch />
      <ScannerDrawer />
      <ShortcutsHelpModal />
    </div>
  );
}
