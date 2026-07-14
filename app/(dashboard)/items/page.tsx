'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Rows3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ItemsTable } from '@/components/items/ItemsTable';
import { ItemForm } from '@/components/items/ItemForm';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useItems } from '@/lib/hooks/useItems';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useAuth } from '@/lib/hooks/useAuth';

function ItemsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [defaultBarcode, setDefaultBarcode] = useState('');
  const debouncedSearch = useDebounce(search);
  const { isViewer } = useAuth();

  const categoriesQuery = useItems({ limit: 100 });
  const categories = [
    ...new Set(
      (categoriesQuery.data?.data ?? [])
        .map((i) => i.category)
        .filter((c): c is string => !!c)
    ),
  ];

  useEffect(() => {
    const barcode = searchParams.get('barcode');
    if (!barcode || isViewer) return;
    setDefaultBarcode(barcode);
    setAddOpen(true);
    router.replace('/items', { scroll: false });
  }, [searchParams, isViewer, router]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Add products by name — stock can come with them or later."
      >
        {!isViewer && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/items/new">
                <Rows3 className="mr-2 h-4 w-4" />
                Add many / Upload
              </Link>
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Button>
          </div>
        )}
      </PageHeader>

      <FilterBar className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search items..."
          className="max-w-sm"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <ItemsTable
        search={debouncedSearch || undefined}
        category={category && category !== 'all' ? category : undefined}
        status={status && status !== 'all' ? status : undefined}
        onAdd={!isViewer ? () => setAddOpen(true) : undefined}
      />

      <ItemForm
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setDefaultBarcode('');
        }}
        categories={categories}
        defaultBarcode={defaultBarcode}
      />
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={null}>
      <ItemsPageContent />
    </Suspense>
  );
}
