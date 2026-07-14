'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  StockLineItem,
  type StockLine,
} from '@/components/stock/StockLineItem';
import { FEFOPreview } from '@/components/stock/FEFOPreview';
import { DispatchReceipt } from '@/components/stock/DispatchReceipt';
import { useStockOut } from '@/lib/hooks/useStock';
import { useShops } from '@/lib/hooks/useShops';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/lib/store/uiStore';
import { queueDispatch } from '@/lib/offline/dispatchQueue';

const LAST_SHOP_KEY = 'novora_last_shop';
const LAST_DISPATCH_KEY = 'novora_last_dispatch';

const newLine = (): StockLine => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `line-${Math.random().toString(36).slice(2)}`,
  itemId: '',
  itemName: '',
  quantity: 1,
});

interface ReceiptData {
  shopName: string;
  items: { name: string; quantity: number; unit: string }[];
  timestamp: Date;
}

export function StockOutForm() {
  const { isViewer } = useAuth();
  const { data: shops } = useShops();
  const stockOut = useStockOut();
  const offline = useUiStore((s) => s.offline);

  const [shopId, setShopId] = useState('');
  const [lines, setLines] = useState<StockLine[]>([
    { id: 'line-0', itemId: '', itemName: '', quantity: 1 },
  ]);
  const [transactionDate, setTransactionDate] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    setShopId(localStorage.getItem(LAST_SHOP_KEY) ?? '');
    setTransactionDate(new Date().toISOString().slice(0, 10));
  }, []);

  const activeShops = (shops ?? []).filter((s) => s.isActive);

  const handleShopChange = (value: string) => {
    setShopId(value);
    localStorage.setItem(LAST_SHOP_KEY, value);
  };

  const updateLine = (index: number, line: StockLine) => {
    setLines((prev) => prev.map((l, i) => (i === index ? line : l)));
  };

  const removeLine = (index: number) => {
    setLines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const checkDuplicateDispatch = (): boolean => {
    try {
      const raw = localStorage.getItem(LAST_DISPATCH_KEY);
      if (!raw) return false;
      const last = JSON.parse(raw) as {
        shopId: string;
        itemIds: string[];
        timestamp: number;
      };
      const validLines = lines.filter((l) => l.itemId);
      const itemIds = validLines.map((l) => l.itemId).sort().join(',');
      const lastIds = [...last.itemIds].sort().join(',');
      const within10Min = Date.now() - last.timestamp < 10 * 60 * 1000;
      return (
        within10Min && last.shopId === shopId && lastIds === itemIds
      );
    } catch {
      return false;
    }
  };

  const executeDispatch = async () => {
    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    const payload = {
      items: validLines.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        notes: l.notes,
      })),
      shopId,
      transactionDate,
      globalNotes: globalNotes || undefined,
    };

    const shop = activeShops.find((s) => s.id === shopId);

    if (offline) {
      await queueDispatch(payload);
      toast.success('Dispatch queued — will sync when online');
      setReceipt({
        shopName: shop?.name ?? 'Unknown',
        items: validLines.map((l) => ({
          name: l.itemName,
          quantity: l.quantity,
          unit: 'units',
        })),
        timestamp: new Date(),
      });
      return;
    }

    await stockOut.mutateAsync(payload);

    localStorage.setItem(
      LAST_DISPATCH_KEY,
      JSON.stringify({
        shopId,
        itemIds: validLines.map((l) => l.itemId),
        timestamp: Date.now(),
      })
    );

    setReceipt({
      shopName: shop?.name ?? 'Unknown',
      items: validLines.map((l) => ({
        name: l.itemName,
        quantity: l.quantity,
        unit: 'units',
      })),
      timestamp: new Date(),
    });

    toast.success('Stock dispatched');
    setLines([newLine()]);
    setGlobalNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!shopId) {
      toast.error('Select a shop');
      return;
    }

    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    if (checkDuplicateDispatch()) {
      setDuplicateWarning(true);
      return;
    }

    try {
      await executeDispatch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dispatch failed');
    }
  };

  if (receipt) {
    return (
      <DispatchReceipt
        shopName={receipt.shopName}
        items={receipt.items}
        timestamp={receipt.timestamp}
        onDispatchAgain={() => {
          setReceipt(null);
          setLines([newLine()]);
        }}
        onBack={() => setReceipt(null)}
      />
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Shop *</Label>
          <Select value={shopId} onValueChange={handleShopChange} disabled={isViewer}>
            <SelectTrigger>
              <SelectValue placeholder="Select shop" />
            </SelectTrigger>
            <SelectContent>
              {activeShops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                  {shop.location ? ` — ${shop.location}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {lines.map((line, index) => (
          <div key={line.id} className="space-y-2">
            <StockLineItem
              line={line}
              mode="out"
              onChange={(l) => updateLine(index, l)}
              onRemove={() => removeLine(index)}
              canRemove={lines.length > 1}
              disabled={isViewer}
            />
            {line.itemId && line.quantity > 0 && (
              <FEFOPreview itemId={line.itemId} quantity={line.quantity} />
            )}
          </div>
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
            disabled={isViewer}
          />
        </div>

        {!isViewer && (
          <Button type="submit" disabled={stockOut.isPending}>
            {stockOut.isPending ? 'Dispatching…' : 'Dispatch Stock'}
          </Button>
        )}
      </form>

      <ConfirmDialog
        open={duplicateWarning}
        onOpenChange={setDuplicateWarning}
        title="Duplicate dispatch?"
        description={`You dispatched these items to this shop recently. Dispatch again?`}
        confirmLabel="Dispatch Again"
        loading={stockOut.isPending}
        onConfirm={async () => {
          setDuplicateWarning(false);
          try {
            await executeDispatch();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Dispatch failed');
          }
        }}
      />
    </>
  );
}
