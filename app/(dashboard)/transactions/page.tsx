'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShops } from '@/lib/hooks/useShops';
import { useDebounce } from '@/lib/hooks/useDebounce';

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [shopId, setShopId] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data: shops } = useShops();

  return (
    <div>
      <PageHeader title="Transaction History" />

      <FilterBar className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search items..."
          className="max-w-sm"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="IN">IN</SelectItem>
            <SelectItem value="OUT">OUT</SelectItem>
          </SelectContent>
        </Select>
        <Select value={shopId} onValueChange={setShopId}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Shop" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Shops</SelectItem>
            {(shops ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <TransactionsTable
        search={debouncedSearch || undefined}
        type={type || undefined}
        shopId={shopId || undefined}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
