'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBatchCreateItems, useItems } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';

interface BatchRow {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
}

const emptyRow = (id: string): BatchRow => ({
  id,
  name: '',
  sku: '',
  barcode: '',
  category: '',
  unit: 'pcs',
});

export function BatchAddTable() {
  const router = useRouter();
  const { isViewer } = useAuth();
  const batchCreate = useBatchCreateItems();
  const { data: itemsData } = useItems({ limit: 100 });
  const [rows, setRows] = useState<BatchRow[]>(() => [emptyRow('row-0')]);

  const categories = [
    ...new Set(
      (itemsData?.data ?? [])
        .map((i) => i.category)
        .filter((c): c is string => !!c)
    ),
  ];

  const updateRow = (id: string, field: keyof BatchRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () =>
    setRows((prev) => [...prev, emptyRow(crypto.randomUUID())]);

  const removeRow = (id: string) => {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev
    );
  };

  const handleSubmit = async () => {
    if (isViewer) return;

    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      toast.error('Add at least one item with a name');
      return;
    }

    try {
      const result = await batchCreate.mutateAsync(
        validRows.map((r) => ({
          name: r.name.trim(),
          sku: r.sku.trim() || null,
          barcode: r.barcode.trim() || null,
          category: r.category.trim() || null,
          unit: r.unit.trim() || 'pcs',
          minStock: 10,
        }))
      );
      toast.success(
        `${result.created} items added, ${result.skipped} already existed${
          result.stocked ? `, ${result.stocked} stocked in` : ''
        }`
      );
      router.push('/items');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add items');
    }
  };

  return (
    <div className="space-y-4">
      <p className="font-hand text-xl text-foreground-secondary">
        Type product names — SKU, barcode, and the rest are optional. Empty
        rows are ignored.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Product name *</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                    disabled={isViewer}
                    placeholder="Product name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="font-mono"
                    value={row.sku}
                    onChange={(e) => updateRow(row.id, 'sku', e.target.value)}
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="font-mono"
                    value={row.barcode}
                    onChange={(e) =>
                      updateRow(row.id, 'barcode', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    list="batch-categories"
                    value={row.category}
                    onChange={(e) =>
                      updateRow(row.id, 'category', e.target.value)
                    }
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.unit}
                    onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                    disabled={isViewer}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    disabled={isViewer}
                  >
                    <Trash2 className="h-4 w-4 text-foreground-muted" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <datalist id="batch-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {!isViewer && (
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Another row
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={batchCreate.isPending}
          >
            {batchCreate.isPending ? 'Adding…' : 'Save products'}
          </Button>
        </div>
      )}
    </div>
  );
}
