'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ItemSearchSelect } from '@/components/stock/ItemSearchSelect';
import type { Item } from '@/shared/types/item';

export interface StockLine {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  expiryDate?: string;
  notes?: string;
  maxStock?: number;
}

interface StockLineItemProps {
  line: StockLine;
  mode: 'in' | 'out';
  onChange: (line: StockLine) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

export function StockLineItem({
  line,
  mode,
  onChange,
  onRemove,
  canRemove,
  disabled = false,
}: StockLineItemProps) {
  const adjustQty = (delta: number) => {
    const next = Math.max(1, line.quantity + delta);
    onChange({ ...line, quantity: next });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Label className="mb-2 block">Item</Label>
          {line.itemId ? (
            <p className="text-sm font-medium">{line.itemName}</p>
          ) : (
            <ItemSearchSelect
              onSelect={(item: Item) =>
                onChange({
                  ...line,
                  itemId: item.id,
                  itemName: item.name,
                  maxStock: item.totalStock,
                })
              }
              disabled={disabled}
            />
          )}
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4 text-foreground-muted" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label className="mb-2 block">Quantity</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjustQty(-1)}
              disabled={disabled || line.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min={1}
              className="w-20 text-center font-mono"
              value={line.quantity}
              onChange={(e) =>
                onChange({
                  ...line,
                  quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                })
              }
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjustQty(1)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {mode === 'out' && line.maxStock != null && (
            <p className="mt-1 text-xs text-foreground-muted">
              Available: {line.maxStock}
            </p>
          )}
        </div>

        {mode === 'in' && (
          <div className="flex-1">
            <Label className="mb-2 block">Expiry Date</Label>
            <Input
              type="date"
              value={line.expiryDate ?? ''}
              onChange={(e) =>
                onChange({ ...line, expiryDate: e.target.value || undefined })
              }
              disabled={disabled}
            />
          </div>
        )}

        <div className="min-w-[160px] flex-1">
          <Label className="mb-2 block">Notes</Label>
          <Input
            value={line.notes ?? ''}
            onChange={(e) => onChange({ ...line, notes: e.target.value })}
            placeholder="Optional"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
