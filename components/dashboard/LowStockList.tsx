'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils/cn';

export function LowStockList() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const { isViewer } = useAuth();

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-danger">
          Failed to load low stock items.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const items = data.lowStockItems ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Needs a top-up</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All items are well stocked"
            className="py-6"
          />
        ) : (
          <ul className="scrollbar-thin max-h-[300px] space-y-2 overflow-y-auto">
            {items.map((item) => {
              const isOut = item.totalStock === 0;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-raised/50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground-primary">
                      {item.name}
                    </p>
                    <p
                      className={cn(
                        'font-mono text-xs',
                        isOut
                          ? 'text-danger'
                          : 'text-warning'
                      )}
                    >
                      {item.totalStock} / {item.minStock} min
                    </p>
                  </div>
                  {!isViewer && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/stock-in?itemId=${item.id}`}>
                        Stock In
                      </Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
