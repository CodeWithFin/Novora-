'use client';

import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUndoTransaction } from '@/lib/hooks/useTransactions';
import type { Transaction } from '@/shared/types/transaction';

interface UndoTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UndoTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: UndoTransactionDialogProps) {
  const undo = useUndoTransaction();

  const handleConfirm = async () => {
    if (!transaction) return;

    try {
      await undo.mutateAsync(transaction.id);
      toast.success('Transaction undone');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to undo');
    }
  };

  if (!transaction) return null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Undo transaction"
      description={`This will reverse the stock change for ${transaction.itemName} (${transaction.quantity} ${transaction.itemUnit}). This cannot be undone.`}
      confirmLabel="Undo Transaction"
      variant="destructive"
      loading={undo.isPending}
      onConfirm={handleConfirm}
    />
  );
}
