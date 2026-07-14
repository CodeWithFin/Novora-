'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, Package, Plus } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ItemStatusBadge } from '@/components/items/ItemStatusBadge';
import { ItemForm } from '@/components/items/ItemForm';
import { useItems, useDeleteItem } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatCurrency, formatDate, daysUntil } from '@/shared/utils/format';
import { getStockStatus, getExpiryUrgency } from '@/shared/utils/stock';
import type { Item } from '@/shared/types/item';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface ItemsTableProps {
  search?: string;
  category?: string;
  status?: string;
  onAdd?: () => void;
}

export function ItemsTable({ search, category, status, onAdd }: ItemsTableProps) {
  const { isAdmin, isViewer } = useAuth();
  const params: Record<string, string | number> = { limit: 50 };
  if (search) params.search = search;
  if (category) params.category = category;
  if (status && status !== 'all') params.status = status;

  const { data, isLoading, isError, refetch } = useItems(params);
  const deleteItem = useDeleteItem();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem.mutateAsync(deleteTarget.id);
      toast.success('Item deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const categories = [
    ...new Set(
      (data?.data ?? [])
        .map((i) => i.category)
        .filter((c): c is string => !!c)
    ),
  ];

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
        Failed to load items.{' '}
        <button type="button" onClick={() => refetch()} className="underline">
          Retry
        </button>
      </p>
    );
  }

  const items = data?.data ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={search || category || status ? 'No matches' : 'No products yet'}
        description={
          search || category || status
            ? 'Try adjusting your filters.'
            : 'Type a product name and you’re done. Stock is optional.'
        }
        action={
          onAdd ? (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first product
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Status</TableHead>
              {!isViewer && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const itemStatus =
                item.status ?? getStockStatus(item.totalStock, item.minStock);
              const isOpen = expanded.has(item.id);
              return (
                <Fragment key={item.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-foreground-muted" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-foreground-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.sku ?? '—'}
                    </TableCell>
                    <TableCell>{item.category ?? '—'}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {item.price != null ? formatCurrency(item.price) : '—'}
                    </TableCell>
                    <TableCell className="font-mono">{item.totalStock}</TableCell>
                    <TableCell className="font-mono">{item.minStock}</TableCell>
                    <TableCell>
                      <ItemStatusBadge status={itemStatus} />
                    </TableCell>
                    {!isViewer && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  {isOpen && item.batches?.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={isViewer ? 9 : 10} className="bg-raised/30 p-0">
                        <BatchBreakdown batches={item.batches} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => {
          const itemStatus =
            item.status ?? getStockStatus(item.totalStock, item.minStock);
          const isOpen = expanded.has(item.id);
          return (
            <div
              key={item.id}
              className="rounded-lg border border-border-subtle bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.sku && (
                    <p className="font-mono text-xs text-foreground-muted">
                      {item.sku}
                    </p>
                  )}
                </div>
                <ItemStatusBadge status={itemStatus} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-sm">
                  Stock: {item.totalStock}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(item.id)}
                >
                  {isOpen ? 'Hide' : 'Batches'}
                </Button>
              </div>
              {isOpen && (
                <div className="mt-3 border-t border-border-subtle pt-3 text-sm text-foreground-secondary">
                  <p>Category: {item.category ?? '—'}</p>
                  <p>Unit: {item.unit}</p>
                  <p>
                    Price:{' '}
                    {item.price != null ? formatCurrency(item.price) : '—'}
                  </p>
                  {item.batches?.length > 0 && (
                    <BatchBreakdown batches={item.batches} className="mt-2" />
                  )}
                </div>
              )}
              {!isViewer && (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditItem(item)}
                  >
                    Edit
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ItemForm
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        item={editItem}
        categories={categories}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete item"
        description={`This will permanently delete ${deleteTarget?.name} and all its stock and transaction history.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteItem.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

function BatchBreakdown({
  batches,
  className,
}: {
  batches: Item['batches'];
  className?: string;
}) {
  return (
    <div className={cn('px-4 py-3', className)}>
      <p className="mb-2 text-xs font-medium text-foreground-muted">
        Batch breakdown
      </p>
      <ul className="space-y-1">
        {batches.map((batch) => {
          const days = batch.expiry_date
            ? daysUntil(batch.expiry_date)
            : null;
          const urgency =
            days != null ? getExpiryUrgency(days) : 'ok';
          return (
            <li
              key={batch.id}
              className={cn(
                'flex justify-between rounded px-2 py-1 text-sm',
                urgency === 'critical' && 'bg-danger/10 text-danger',
                urgency === 'warning' && 'bg-warning/10 text-warning',
                urgency === 'soon' && 'bg-yellow-500/10 text-yellow-400'
              )}
            >
              <span className="font-mono">{batch.quantity} units</span>
              <span>
                {batch.expiry_date
                  ? `Exp ${formatDate(batch.expiry_date)} (${days}d)`
                  : 'No expiry'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
