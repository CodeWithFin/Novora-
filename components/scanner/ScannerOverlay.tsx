'use client';

import { cn } from '@/lib/utils/cn';

export function ScannerOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-lg',
        className
      )}
    >
      <div className="absolute inset-4 rounded-lg border-2 border-primary/60" />
      <div className="absolute left-4 right-4 h-0.5 animate-scan-line bg-primary shadow-glow" />
      <div className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-primary" />
      <div className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-primary" />
      <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-primary" />
      <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-primary" />
    </div>
  );
}
