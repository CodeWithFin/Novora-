'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { formatDate } from '@/shared/utils/format';
import { ArrowLeftRight } from 'lucide-react';

export function RecentTransactions() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-danger">
          Failed to load transactions.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const transactions = data.recentTransactions ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest moves</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No recent transactions"
            className="py-6"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge
                      variant={tx.type === 'IN' ? 'success' : 'warning'}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {tx.itemName}
                  </TableCell>
                  <TableCell className="font-mono">{tx.quantity}</TableCell>
                  <TableCell className="text-foreground-secondary">
                    {tx.shopName ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground-muted">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
