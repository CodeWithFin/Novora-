'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatTime } from '@/shared/utils/format';

interface DispatchReceiptProps {
  shopName: string;
  items: { name: string; quantity: number; unit: string }[];
  timestamp: Date;
  onDispatchAgain: () => void;
  onBack?: () => void;
}

export function DispatchReceipt({
  shopName,
  items,
  timestamp,
  onDispatchAgain,
  onBack,
}: DispatchReceiptProps) {
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border-default bg-surface p-8 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-success animate-in zoom-in-95" />

        <div>
          <h2 className="font-display text-2xl font-bold">Stock Dispatched</h2>
          <p className="mt-2 text-foreground-secondary">
            {shopName}
          </p>
          <p className="font-mono text-sm text-foreground-muted">
            {formatDate(timestamp)} · {formatTime(timestamp)}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="font-mono">{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="font-mono text-sm text-foreground-secondary">
          Total units dispatched: {totalUnits}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={onDispatchAgain} variant="outline">
            Dispatch Again
          </Button>
          {onBack ? (
            <Button onClick={onBack}>Done</Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
