'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { itemSchema } from '@/lib/schemas/item.schema';
import { useCreateItem, useUpdateItem } from '@/lib/hooks/useItems';
import { useStockIn } from '@/lib/hooks/useStock';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Item } from '@/shared/types/item';
import type { z } from 'zod';
import { cn } from '@/lib/utils/cn';

type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  categories?: string[];
  defaultBarcode?: string;
}

export function ItemForm({
  open,
  onOpenChange,
  item,
  categories = [],
  defaultBarcode,
}: ItemFormProps) {
  const { isViewer } = useAuth();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const stockIn = useStockIn();
  const isEdit = !!item;
  const nameRef = useRef<HTMLInputElement | null>(null);

  const [showMore, setShowMore] = useState(false);
  const [startingQty, setStartingQty] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category: '',
      unit: 'pcs',
      price: undefined,
      minStock: 0,
    },
  });

  const { ref: nameRegisterRef, ...nameRegister } = register('name');

  useEffect(() => {
    if (!open) return;

    setShowMore(!!item || !!defaultBarcode);
    setStartingQty('');
    setExpiryDate('');
    reset(
      item
        ? {
            name: item.name,
            sku: item.sku ?? '',
            barcode: item.barcode ?? '',
            category: item.category ?? '',
            unit: item.unit,
            price: item.price ?? undefined,
            minStock: item.minStock,
          }
        : {
            name: '',
            sku: '',
            barcode: defaultBarcode ?? '',
            category: '',
            unit: 'pcs',
            price: undefined,
            minStock: 0,
          }
    );

    const t = window.setTimeout(() => nameRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, item, defaultBarcode, reset]);

  const saveItem = async (values: ItemFormValues, addAnother: boolean) => {
    if (isViewer) return;

    const payload = {
      name: values.name.trim(),
      sku: values.sku?.trim() || null,
      barcode: values.barcode?.trim() || null,
      category: values.category?.trim() || null,
      unit: values.unit?.trim() || 'pcs',
      price: values.price ?? null,
      minStock: values.minStock ?? 0,
    };

    try {
      if (isEdit && item) {
        await updateItem.mutateAsync({ id: item.id, data: payload });
        toast.success('Item updated');
        onOpenChange(false);
        reset();
        return;
      }

      const created = await createItem.mutateAsync(payload);
      const qty = parseInt(startingQty, 10);

      if (Number.isFinite(qty) && qty > 0) {
        await stockIn.mutateAsync({
          items: [
            {
              itemId: created.id,
              quantity: qty,
              expiryDate: expiryDate || undefined,
            },
          ],
        });
        toast.success(`${payload.name} added with ${qty} in stock`);
      } else {
        toast.success(`${payload.name} added — stock in when it arrives`);
      }

      if (addAnother) {
        setStartingQty('');
        setExpiryDate('');
        setShowMore(false);
        reset({
          name: '',
          sku: '',
          barcode: '',
          category: '',
          unit: 'pcs',
          price: undefined,
          minStock: 0,
        });
        window.setTimeout(() => nameRef.current?.focus(), 50);
      } else {
        onOpenChange(false);
        reset();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit item' : 'Add a product'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update product details.'
              : 'Name is enough. Stock and details are optional.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit((v) => saveItem(v, false))}
          className="mt-6 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="name">What are you stocking?</Label>
            <Input
              id="name"
              placeholder="e.g. Coca-Cola 500ml"
              className="h-12 text-base"
              disabled={isViewer}
              {...nameRegister}
              ref={(el) => {
                nameRegisterRef(el);
                nameRef.current = el;
              }}
            />
            {errors.name && (
              <p className="text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-3 rounded-xl border-2 border-dashed border-border-default bg-raised/40 p-4">
              <p className="text-sm font-medium text-foreground-primary">
                Already have stock?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startingQty">Quantity</Label>
                  <Input
                    id="startingQty"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="0"
                    value={startingQty}
                    onChange={(e) => setStartingQty(e.target.value)}
                    disabled={isViewer}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiryDate">Expiry</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={isViewer || !startingQty}
                  />
                </div>
              </div>
              <p className="text-xs text-foreground-muted">
                Skip if you&apos;ll stock in later.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-sm text-foreground-secondary hover:text-foreground-primary"
          >
            <span>More details (SKU, barcode, price…)</span>
            {showMore ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <div
            className={cn(
              'space-y-4 overflow-hidden transition-all',
              showMore ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  className="font-mono"
                  {...register('sku')}
                  disabled={isViewer}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  className="font-mono"
                  {...register('barcode')}
                  disabled={isViewer}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                list="item-categories"
                placeholder="Drinks, Snacks…"
                {...register('category')}
                disabled={isViewer}
              />
              <datalist id="item-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="pcs"
                  {...register('unit')}
                  disabled={isViewer}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price')}
                  disabled={isViewer}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Low-stock alert at</Label>
              <Input
                id="minStock"
                type="number"
                min={0}
                {...register('minStock')}
                disabled={isViewer}
              />
              {errors.minStock && (
                <p className="text-xs text-danger">{errors.minStock.message}</p>
              )}
            </div>
          </div>

          {!isViewer && (
            <SheetFooter className="flex-col gap-2 pt-2 sm:flex-col">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Saving…'
                  : isEdit
                    ? 'Save changes'
                    : 'Add product'}
              </Button>
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={handleSubmit((v) => saveItem(v, true))}
                >
                  Add & create another
                </Button>
              )}
            </SheetFooter>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
