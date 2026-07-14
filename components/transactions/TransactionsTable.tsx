'use client';

import { useState } from 'react';
import { Undo2, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { UndoTransactionDialog } from '@/components/transactions/UndoTransactionDialog';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/shared/utils/format';
import type { Transaction } from '@/shared/types/transaction';

interface TransactionsTableProps {
  search?: string;
  type?: string;
  shopId?: string;
  page?: number;
  onPageChange?: (page: number) => void;
}

export function TransactionsTable({
  search,
  type,
  shopId,
  page = 1,
  onPageChange,
}: TransactionsTableProps) {
  const { isAdmin } = useAuth();
  const params: Record<string, string | number> = { page, limit: 20 };
  if (search) params.search = search;
  if (type && type !== 'all') params.type = type;
  if (shopId && shopId !== 'all') params.shopId = shopId;

  const { data, isLoading, isError, refetch } = useTransactions(params);
  const [undoTarget, setUndoTarget] = useState<Transaction | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-danger">
        Failed to load transactions.{' '}
        <button type="button" onClick={() => refetch()} className="underline">
          Retry
        </button>
      </p>
    );
  }

  const transactions = data?.data ?? [];
  const meta = data?.meta;

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions found"
        description="Try adjusting your filters."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>By</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {formatDate(tx.transactionDate)}
                </TableCell>
                <TableCell>
                  <Badge variant={tx.type === 'IN' ? 'success' : 'warning'}>
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell>{tx.itemName}</TableCell>
                <TableCell className="font-mono text-xs">
                  {tx.itemSku ?? '—'}
                </TableCell>
                <TableCell className="font-mono">{tx.quantity}</TableCell>
                <TableCell>{tx.shopName ?? '—'}</TableCell>
                <TableCell className="max-w-[120px] truncate text-foreground-muted">
                  {tx.notes ?? '—'}
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {tx.createdByName ?? '—'}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUndoTarget(tx)}
                    >
                      <Undo2 className="mr-1 h-4 w-4" />
                      Undo
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && onPageChange && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <UndoTransactionDialog
        transaction={undoTarget}
        open={!!undoTarget}
        onOpenChange={(open) => !open && setUndoTarget(null)}
      />
    </>
  );
}
