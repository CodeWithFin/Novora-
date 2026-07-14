'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useExpiringBatches } from '@/lib/hooks/useStock';
import { formatDate, daysUntil } from '@/shared/utils/format';
import { getExpiryUrgency } from '@/shared/utils/stock';
import { cn } from '@/lib/utils/cn';

const urgencyStyles = {
  critical: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  soon: 'bg-yellow-500/10 text-yellow-400',
  ok: '',
};

export function ExpiryAlerts() {
  const { data, isLoading, isError, refetch } = useExpiringBatches(30);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-danger">
          Failed to load expiry alerts.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const batches = data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Watch these dates</CardTitle>
        <Link
          href="/expiring?days=30"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nothing expiring in 30 days"
            className="py-6"
          />
        ) : (
          <ul className="scrollbar-thin max-h-[280px] space-y-2 overflow-y-auto">
            {batches.slice(0, 10).map((batch) => {
              const days = batch.daysRemaining ?? daysUntil(batch.expiryDate);
              const urgency = getExpiryUrgency(days);
              return (
                <li
                  key={batch.id}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2',
                    urgencyStyles[urgency]
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {batch.itemName}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {batch.quantity} {batch.itemUnit} · exp{' '}
                      {formatDate(batch.expiryDate)}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {days}d
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
