'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Zap, ChevronLeft, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ItemSearchSelect, addRecentItem } from '@/components/stock/ItemSearchSelect';
import { FEFOPreview } from '@/components/stock/FEFOPreview';
import { DispatchReceipt } from '@/components/stock/DispatchReceipt';
import { useUiStore } from '@/lib/store/uiStore';
import { useShops } from '@/lib/hooks/useShops';
import { useStockOut } from '@/lib/hooks/useStock';
import { useAuth } from '@/lib/hooks/useAuth';
import { queueDispatch } from '@/lib/offline/dispatchQueue';
import type { Item } from '@/shared/types/item';
import { cn } from '@/lib/utils/cn';

const LAST_SHOP_KEY = 'novora_last_shop';

interface DispatchItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  totalStock: number;
}

export function QuickDispatch() {
  const pathname = usePathname();
  const { isViewer } = useAuth();
  const open = useUiStore((s) => s.quickDispatchOpen);
  const closeQuickDispatch = useUiStore((s) => s.closeQuickDispatch);
  const offline = useUiStore((s) => s.offline);

  const { data: shops } = useShops();
  const stockOut = useStockOut();

  const [step, setStep] = useState(1);
  const [shopId, setShopId] = useState('');
  const [lastShopId, setLastShopId] = useState('');
  const [items, setItems] = useState<DispatchItem[]>([]);
  const [receipt, setReceipt] = useState<{
    shopName: string;
    items: { name: string; quantity: number; unit: string }[];
    timestamp: Date;
  } | null>(null);

  const activeShops = (shops ?? []).filter((s) => s.isActive);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_SHOP_KEY) ?? '';
    setLastShopId(stored);
    if (open && !shopId && stored) setShopId(stored);
  }, [open, shopId]);

  const reset = () => {
    setStep(1);
    const stored = localStorage.getItem(LAST_SHOP_KEY) ?? '';
    setLastShopId(stored);
    setShopId(stored);
    setItems([]);
    setReceipt(null);
  };

  const handleClose = () => {
    closeQuickDispatch();
    if (!receipt) reset();
  };

  const addItem = (item: Item) => {
    addRecentItem(item.id);
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          quantity: 1,
          unit: item.unit,
          totalStock: item.totalStock,
        },
      ];
    });
  };

  const handleDispatch = async () => {
    if (!shopId || items.length === 0) return;

    const shop = activeShops.find((s) => s.id === shopId);
    const payload = {
      items: items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
      })),
      shopId,
    };

    try {
      if (offline) {
        await queueDispatch(payload);
        toast.success('Dispatch queued');
      } else {
        await stockOut.mutateAsync(payload);
        toast.success('Dispatched');
      }

      localStorage.setItem(LAST_SHOP_KEY, shopId);
      setLastShopId(shopId);
      setReceipt({
        shopName: shop?.name ?? 'Unknown',
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        })),
        timestamp: new Date(),
      });
      closeQuickDispatch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Dispatch failed');
    }
  };

  if (isViewer || pathname === '/stock-out') return null;

  return (
    <>
      <button
        type="button"
        onClick={() => useUiStore.getState().openQuickDispatch()}
        className="canvas-toolbar-fab fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white transition-transform hover:scale-105 hover:-rotate-3 md:bottom-8 md:right-8"
        aria-label="Quick Dispatch"
      >
        <Zap className="h-7 w-7" strokeWidth={2.4} />
      </button>

      {receipt && (
        <DispatchReceipt
          shopName={receipt.shopName}
          items={receipt.items}
          timestamp={receipt.timestamp}
          onDispatchAgain={() => {
            setReceipt(null);
            reset();
            useUiStore.getState().openQuickDispatch();
          }}
          onBack={() => setReceipt(null)}
        />
      )}

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <>
            <DialogHeader>
                <DialogTitle>
                  Quick Dispatch — Step {step} of 4
                </DialogTitle>
              </DialogHeader>

              <div className="mb-4 flex gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      s <= step ? 'bg-primary' : 'bg-border-default'
                    )}
                  />
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-foreground-secondary">
                    Where are you dispatching to?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {activeShops.map((shop) => (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() => {
                          setShopId(shop.id);
                          setLastShopId(shop.id);
                          localStorage.setItem(LAST_SHOP_KEY, shop.id);
                          setStep(2);
                        }}
                        className={cn(
                          'min-h-[56px] rounded-lg border p-3 text-left transition-colors',
                          shopId === shop.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border-default hover:border-primary/50'
                        )}
                      >
                        <p className="font-medium">{shop.name}</p>
                        {shop.location && (
                          <p className="text-xs text-foreground-muted">
                            {shop.location}
                          </p>
                        )}
                        {shop.id === lastShopId && (
                          <span className="mt-1 inline-block text-xs text-primary">
                            Last used
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-foreground-secondary">
                    What are you dispatching?
                  </p>
                  <ItemSearchSelect onSelect={addItem} />
                  {items.length > 0 && (
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li
                          key={item.itemId}
                          className="flex items-center justify-between rounded-md bg-raised px-3 py-2"
                        >
                          <span className="text-sm">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.map((i) =>
                                    i.itemId === item.itemId
                                      ? {
                                          ...i,
                                          quantity: Math.max(
                                            1,
                                            i.quantity - 1
                                          ),
                                        }
                                      : i
                                  )
                                )
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-mono w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.map((i) =>
                                    i.itemId === item.itemId
                                      ? { ...i, quantity: i.quantity + 1 }
                                      : i
                                  )
                                )
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.filter(
                                    (i) => i.itemId !== item.itemId
                                  )
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    onClick={() => setStep(3)}
                    disabled={items.length === 0}
                    className="w-full"
                  >
                    Next
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-foreground-secondary">
                    Confirm quantities
                  </p>
                  {items.map((item) => (
                    <div key={item.itemId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-foreground-muted">
                            Available: {item.totalStock} {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12"
                            onClick={() =>
                              setItems((prev) =>
                                prev.map((i) =>
                                  i.itemId === item.itemId
                                    ? {
                                        ...i,
                                        quantity: Math.max(1, i.quantity - 1),
                                      }
                                    : i
                                )
                              )
                            }
                          >
                            <Minus className="h-5 w-5" />
                          </Button>
                          <span className="font-mono text-lg w-10 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12"
                            onClick={() =>
                              setItems((prev) =>
                                prev.map((i) =>
                                  i.itemId === item.itemId
                                    ? { ...i, quantity: i.quantity + 1 }
                                    : i
                                )
                              )
                            }
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <FEFOPreview
                        itemId={item.itemId}
                        quantity={item.quantity}
                      />
                    </div>
                  ))}
                  <Button onClick={() => setStep(4)} className="w-full">
                    Preview Dispatch
                  </Button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-foreground-secondary">
                    Ready to dispatch?
                  </p>
                  <div className="rounded-lg bg-raised p-4 text-sm">
                    <p>
                      <span className="text-foreground-muted">Shop:</span>{' '}
                      {activeShops.find((s) => s.id === shopId)?.name}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {items.map((item) => (
                        <li key={item.itemId} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="font-mono">
                            {item.quantity} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 font-mono text-foreground-muted">
                      Total:{' '}
                      {items.reduce((s, i) => s + i.quantity, 0)} units
                    </p>
                  </div>
                  <Button
                    onClick={handleDispatch}
                    disabled={stockOut.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {stockOut.isPending ? 'Dispatching…' : 'Dispatch Now'}
                  </Button>
                </div>
              )}

              {step > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  className="mt-2"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
          </>
        </DialogContent>
      </Dialog>
    </>
  );
}
