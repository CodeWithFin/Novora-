'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Rows3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { ItemsTable } from '@/components/items/ItemsTable';
import { ItemForm } from '@/components/items/ItemForm';
import { FilterBar } from '@/components/ui/FilterBar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeleteAllItems, useItems } from '@/lib/hooks/useItems';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useAuth } from '@/lib/hooks/useAuth';

function ItemsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [defaultBarcode, setDefaultBarcode] = useState('');
  const debouncedSearch = useDebounce(search);
  const { isViewer, isAdmin } = useAuth();
  const deleteAll = useDeleteAllItems();

  const categoriesQuery = useItems({ limit: 100 });
  const totalItems = categoriesQuery.data?.meta?.total ?? 0;
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
          <div className="flex flex-wrap gap-2">
            {isAdmin && totalItems > 0 && (
              <Button
                variant="outline"
                onClick={() => setDeleteAllOpen(true)}
                className="text-danger border-danger/40 hover:bg-danger/5"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete all
              </Button>
            )}
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

      <ConfirmDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        title="Delete all products?"
        description="This permanently removes every product, their stock batches, and related stock history for this organization. This cannot be undone."
        confirmLabel="Delete all products"
        variant="destructive"
        loading={deleteAll.isPending}
        onConfirm={async () => {
          try {
            const result = await deleteAll.mutateAsync();
            toast.success(
              result.deleted === 0
                ? 'No products to delete'
                : `Deleted ${result.deleted} product${result.deleted === 1 ? '' : 's'}`
            );
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : 'Failed to delete products'
            );
            throw err;
          }
        }}
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
