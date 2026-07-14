'use client';

import { Suspense } from 'react';
import { StockInForm } from '@/components/stock/StockInForm';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/lib/hooks/useAuth';

export default function StockInPage() {
  const { isViewer } = useAuth();

  return (
    <div>
      <PageHeader title="Stock In" subtitle="Record incoming inventory" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {!isViewer && (
            <Suspense fallback={null}>
              <StockInForm />
            </Suspense>
          )}
          {isViewer && (
            <p className="text-foreground-muted">View-only access</p>
          )}
        </div>
        <div>
          <h3 className="font-display text-lg mb-4">Recent Stock In</h3>
          <TransactionsTable type="IN" />
        </div>
      </div>
    </div>
  );
}
