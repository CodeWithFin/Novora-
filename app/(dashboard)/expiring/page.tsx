'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterBar } from '@/components/ui/FilterBar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageLoader } from '@/components/ui/PageLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckCircle } from 'lucide-react';
import { useExpiringBatches } from '@/lib/hooks/useStock';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatDate } from '@/shared/utils/format';
import { getExpiryUrgency } from '@/shared/utils/stock';
import { cn } from '@/lib/utils/cn';

const dayOptions = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: '365', label: '365d' },
];

export default function ExpiringPage() {
  const searchParams = useSearchParams();
  const [days, setDays] = useState(searchParams.get('days') ?? '365');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, error, refetch } = useExpiringBatches(
    Number(days),
    debouncedSearch || undefined
  );

  const urgencyClass = (daysRemaining: number) => {
    const u = getExpiryUrgency(daysRemaining);
    if (u === 'critical') return 'bg-danger/10';
    if (u === 'warning') return 'bg-warning/10';
    if (u === 'soon') return 'bg-yellow-500/10';
    return '';
  };

  const daysClass = (daysRemaining: number) => {
    const u = getExpiryUrgency(daysRemaining);
    if (u === 'critical') return 'text-danger';
    if (u === 'warning') return 'text-warning';
    if (u === 'soon') return 'text-yellow-400';
    return 'text-foreground-secondary';
  };

  return (
    <div>
      <PageHeader
        title="Expiring Products"
        subtitle="Batches expiring within selected range"
      />

      <FilterBar className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or SKU..."
          className="max-w-sm"
        />
        <Tabs value={days} onValueChange={setDays}>
          <TabsList>
            {dayOptions.map((d) => (
              <TabsTrigger key={d.value} value={d.value}>
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </FilterBar>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-danger mb-4">Failed to load data</p>
          <button onClick={() => refetch()} className="text-primary">
            Retry
          </button>
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={CheckCircle}
          title={`No products expiring in the next ${days} days`}
          description="All batches are within safe expiry windows."
        />
      ) : (
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Batch Qty</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((batch) => (
                <TableRow
                  key={batch.id}
                  className={cn(urgencyClass(batch.daysRemaining))}
                >
                  <TableCell>{batch.itemName}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {batch.itemSku ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {batch.quantity} {batch.itemUnit}
                  </TableCell>
                  <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                  <TableCell
                    className={cn('font-mono', daysClass(batch.daysRemaining))}
                  >
                    {batch.daysRemaining} days
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
