'use client';

import Link from 'next/link';
import { Zap, PackagePlus, AlertTriangle } from 'lucide-react';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { StockMovementChart } from '@/components/dashboard/StockMovementChart';
import { LowStockList } from '@/components/dashboard/LowStockList';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { ExpiryAlerts } from '@/components/dashboard/ExpiryAlerts';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StickyNote } from '@/components/ui/StickyNote';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useUiStore } from '@/lib/store/uiStore';
import { formatDateTime } from '@/shared/utils/format';

function StaffDashboard() {
  const { data, isLoading } = useDashboard();
  const { user } = useAuth();
  const openQuickDispatch = useUiStore((s) => s.openQuickDispatch);
  const { data: txData } = useTransactions({
    page: 1,
    limit: 10,
  });

  if (isLoading) return <PageLoader />;

  const myTx = (txData?.data ?? []).filter(
    (t) => t.createdByName === user?.displayName || t.createdByName === user?.email
  );

  return (
    <div className="space-y-8">
      <StickyNote tone="yellow" icon={AlertTriangle} className="max-w-xl">
        <span className="text-xl">
          {data?.lowStockCount ?? 0} items running low ·{' '}
          {data?.expiringIn7Days ?? 0} expiring this week
        </span>
      </StickyNote>

      <div className="grid gap-5 sm:grid-cols-2">
        <StickyNote
          tone="cyan"
          icon={Zap}
          title="Quick dispatch"
          as="button"
          onClick={openQuickDispatch}
        >
          <span className="text-lg opacity-90">
            Dispatch stock in under 30 seconds
          </span>
        </StickyNote>

        <StickyNote tone="green" icon={PackagePlus} title="Stock in">
          <Button asChild className="mt-2 font-hand text-lg uppercase">
            <Link href="/stock-in">Record stock in</Link>
          </Button>
        </StickyNote>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="hand-title text-3xl">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myTx.length === 0 ? (
            <p className="font-hand text-lg text-foreground-muted">
              No recent activity yet — go make some moves!
            </p>
          ) : (
            myTx.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between border-b border-border-subtle py-2 text-sm last:border-0"
              >
                <span className="font-hand text-lg">
                  <span
                    className={
                      tx.type === 'IN' ? 'text-success' : 'text-warning'
                    }
                  >
                    {tx.type}
                  </span>{' '}
                  {tx.itemName} × {tx.quantity}
                </span>
                <span className="font-mono text-xs text-foreground-muted">
                  {formatDateTime(tx.createdAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-8">
      <SummaryCards />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <StockMovementChart />
        </div>
        <div className="lg:col-span-2">
          <LowStockList />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactions />
        <ExpiryAlerts />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isStaff, isAdmin, isViewer, org } = useAuth();

  return (
    <div>
      <PageHeader
        eyebrow="Today’s board"
        title="Dashboard"
        subtitle={`Hey ${org?.name ?? 'team'} — stock, shops, and FEFO in one playful workspace.`}
      />
      {isStaff && !isAdmin && !isViewer ? (
        <StaffDashboard />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}
