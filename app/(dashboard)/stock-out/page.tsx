'use client';

import { StockOutForm } from '@/components/stock/StockOutForm';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/hooks/useAuth';

export default function StockOutPage() {
  const { isViewer } = useAuth();

  return (
    <div>
      <PageHeader
        title="Stock Out"
        subtitle="Dispatch stock to shops with FEFO"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {!isViewer && <StockOutForm />}
          {isViewer && (
            <p className="text-foreground-muted">View-only access</p>
          )}
        </div>
        <div>
          <h3 className="font-display text-lg mb-4">Recent Dispatches</h3>
          <TransactionsTable type="OUT" />
        </div>
      </div>
    </div>
  );
}
