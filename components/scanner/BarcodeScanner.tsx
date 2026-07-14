'use client';

import { useState } from 'react';
import { Flashlight, FlashlightOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScannerOverlay } from '@/components/scanner/ScannerOverlay';
import { useBarcodeScanner } from '@/components/scanner/useBarcodeScanner';
import { cn } from '@/lib/utils/cn';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  className?: string;
  enabled?: boolean;
}

export function BarcodeScanner({
  onScan,
  className,
  enabled = true,
}: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState('');

  const {
    videoRef,
    error,
    hasCamera,
    torchSupported,
    torchOn,
    toggleTorch,
  } = useBarcodeScanner({ onScan, enabled });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (code) {
      onScan(code);
      setManualCode('');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
        {hasCamera && (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        )}
        {hasCamera && <ScannerOverlay />}
        {!hasCamera && (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-foreground-secondary">
            {error ?? 'Camera unavailable'}
          </div>
        )}
        {torchSupported && hasCamera && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute bottom-3 right-3 bg-black/50"
            onClick={toggleTorch}
          >
            {torchOn ? (
              <FlashlightOff className="h-4 w-4" />
            ) : (
              <Flashlight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {error && hasCamera && (
        <p className="text-xs text-warning">{error}</p>
      )}

      <form onSubmit={handleManualSubmit} className="space-y-2">
        <Label htmlFor="manual-barcode">Enter barcode manually</Label>
        <div className="flex gap-2">
          <Input
            id="manual-barcode"
            className="font-mono"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Scan or type barcode"
          />
          <Button type="submit" variant="outline">
            Enter
          </Button>
        </div>
      </form>
    </div>
  );
}
