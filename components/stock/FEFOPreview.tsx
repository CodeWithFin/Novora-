'use client';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { useStockOutPreview } from '@/lib/hooks/useStock';
import { formatDate } from '@/shared/utils/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

interface FEFOPreviewProps {
  itemId: string;
  quantity: number;
  className?: string;
}

export function FEFOPreview({ itemId, quantity, className }: FEFOPreviewProps) {
  const debouncedQty = useDebounce(quantity, 500);
  const { data, isLoading, isFetching } = useStockOutPreview(
    itemId,
    debouncedQty
  );

  if (!itemId || quantity <= 0) return null;

  if (isLoading || isFetching) {
    return (
      <div className={cn('flex items-center gap-2 py-2 text-sm', className)}>
        <LoadingSpinner size="sm" />
        <span className="text-foreground-muted">Calculating FEFO…</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className={cn(
        'rounded-md border border-border-subtle bg-raised/50 p-3 text-sm',
        !data.sufficient && 'border-danger/30 bg-danger/5',
        className
      )}
    >
      <p className="mb-2 font-medium text-foreground-secondary">
        FEFO Preview — {data.itemName}
      </p>
      {!data.sufficient ? (
        <p className="text-danger">
          Insufficient stock: requested {quantity}, available{' '}
          {data.totalAvailable}
        </p>
      ) : (
        <ul className="space-y-1">
          {data.batches
            .filter((b) => b.willDeduct > 0)
            .map((batch) => (
              <li
                key={batch.batchId}
                className="flex justify-between font-mono text-xs text-foreground-secondary"
              >
                <span>
                  Batch
                  {batch.expiryDate
                    ? ` (exp. ${formatDate(batch.expiryDate)})`
                    : ' (no expiry)'}
                </span>
                <span>-{batch.willDeduct}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
