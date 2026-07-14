'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StockLineItem,
  type StockLine,
} from '@/components/stock/StockLineItem';
import { useStockIn } from '@/lib/hooks/useStock';
import { useItem } from '@/lib/hooks/useItems';
import { useAuth } from '@/lib/hooks/useAuth';

const newLine = (): StockLine => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `line-${Math.random().toString(36).slice(2)}`,
  itemId: '',
  itemName: '',
  quantity: 1,
});

export function StockInForm() {
  const searchParams = useSearchParams();
  const prefillItemId = searchParams.get('itemId');
  const { isViewer } = useAuth();
  const stockIn = useStockIn();
  const { data: prefillItem } = useItem(prefillItemId ?? '');

  const [lines, setLines] = useState<StockLine[]>([
    { id: 'line-0', itemId: '', itemName: '', quantity: 1 },
  ]);
  const [transactionDate, setTransactionDate] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');

  useEffect(() => {
    setTransactionDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (prefillItem) {
      setLines([
        {
          id: crypto.randomUUID(),
          itemId: prefillItem.id,
          itemName: prefillItem.name,
          quantity: 1,
        },
      ]);
    }
  }, [prefillItem]);

  const updateLine = (index: number, line: StockLine) => {
    setLines((prev) => prev.map((l, i) => (i === index ? line : l)));
  };

  const removeLine = (index: number) => {
    setLines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    try {
      await stockIn.mutateAsync({
        items: validLines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          expiryDate: l.expiryDate,
          notes: l.notes,
        })),
        transactionDate,
        globalNotes: globalNotes || undefined,
      });
      toast.success('Stock recorded');
      setLines([newLine()]);
      setGlobalNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record stock');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {lines.map((line, index) => (
        <StockLineItem
          key={line.id}
          line={line}
          mode="in"
          onChange={(l) => updateLine(index, l)}
          onRemove={() => removeLine(index)}
          canRemove={lines.length > 1}
          disabled={isViewer}
        />
      ))}

      {!isViewer && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setLines((prev) => [...prev, newLine()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Item
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="txDate">Transaction Date</Label>
          <Input
            id="txDate"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            disabled={isViewer}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={globalNotes}
          onChange={(e) => setGlobalNotes(e.target.value)}
          placeholder="Optional notes for this stock-in"
          disabled={isViewer}
        />
      </div>

      {!isViewer && (
        <Button type="submit" disabled={stockIn.isPending} className="w-full sm:w-auto">
          {stockIn.isPending ? 'Recording…' : 'Record Stock In'}
        </Button>
      )}
    </form>
  );
}
