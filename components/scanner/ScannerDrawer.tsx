'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { useUiStore } from '@/lib/store/uiStore';
import { getItems } from '@/lib/api/items';

interface ScannerDrawerProps {
  onItemFound?: (item: {
    id: string;
    name: string;
    barcode: string | null;
  }) => void;
}

export function ScannerDrawer({ onItemFound }: ScannerDrawerProps) {
  const router = useRouter();
  const open = useUiStore((s) => s.scannerOpen);
  const closeScanner = useUiStore((s) => s.closeScanner);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);

  const handleScan = async (code: string) => {
    try {
      const { data } = await getItems({ barcode: code, limit: 1 });
      const item = data[0];

      if (item) {
        toast.success(`Item found: ${item.name}`);
        onItemFound?.({
          id: item.id,
          name: item.name,
          barcode: item.barcode,
        });
        closeScanner();
        setNotFoundBarcode(null);
      } else {
        setNotFoundBarcode(code);
        toast.error(`Barcode ${code} not found`);
      }
    } catch {
      toast.error('Failed to lookup barcode');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closeScanner()}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>Scan Barcode</SheetTitle>
          <SheetDescription>
            Point your camera at a barcode or enter it manually.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <BarcodeScanner onScan={handleScan} enabled={open} />
        </div>

        {notFoundBarcode && (
          <div className="mt-4 rounded-lg border border-border-default bg-raised p-4">
            <p className="text-sm text-foreground-secondary">
              Barcode <span className="font-mono">{notFoundBarcode}</span> not
              found.
            </p>
            <Button
              className="mt-2"
              variant="outline"
              onClick={() => {
                closeScanner();
                router.push(
                  `/items?barcode=${encodeURIComponent(notFoundBarcode)}`
                );
              }}
            >
              Create item with this barcode?
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
