'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useItems } from '@/lib/hooks/useItems';
import { daysUntil } from '@/shared/utils/format';
import type { Item } from '@/shared/types/item';
import { cn } from '@/lib/utils/cn';

interface ItemSearchSelectProps {
  value?: string;
  onSelect: (item: Item) => void;
  placeholder?: string;
  excludeIds?: string[];
  showRecent?: boolean;
  disabled?: boolean;
}

const RECENT_KEY = 'novora_recent_items';

export function getRecentItemIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addRecentItem(id: string) {
  if (typeof window === 'undefined') return;
  const recent = getRecentItemIds().filter((r) => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

export function ItemSearchSelect({
  value,
  onSelect,
  placeholder = 'Search by name, SKU, or barcode…',
  excludeIds = [],
  showRecent = true,
  disabled = false,
}: ItemSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const debounced = useDebounce(query, 300);

  const { data } = useItems(
    debounced ? { search: debounced, limit: 20 } : { limit: 50 }
  );

  useEffect(() => {
    if (showRecent) setRecentIds(getRecentItemIds());
  }, [showRecent]);

  const items = useMemo(() => {
    const all = (data?.data ?? []).filter(
      (i) => !excludeIds.includes(i.id) && i.totalStock > 0
    );
    if (!debounced && showRecent && recentIds.length > 0) {
      const recent = recentIds
        .map((id) => all.find((i) => i.id === id))
        .filter((i): i is Item => !!i);
      const rest = all.filter((i) => !recentIds.includes(i.id));
      return [...recent, ...rest];
    }
    return all;
  }, [data?.data, debounced, excludeIds, recentIds, showRecent]);

  const selected = items.find((i) => i.id === value);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <Input
          className="pl-9"
          placeholder={selected ? selected.name : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
        />
      </div>

      {open && items.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border-default bg-overlay shadow-lg">
            {items.slice(0, 10).map((item) => {
              const expiryWarning =
                item.earliestExpiry &&
                daysUntil(item.earliestExpiry) <= 30;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-raised',
                      value === item.id && 'bg-raised'
                    )}
                    onClick={() => {
                      onSelect(item);
                      addRecentItem(item.id);
                      setQuery('');
                      setOpen(false);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="font-mono text-xs text-foreground-muted">
                        {item.sku ?? 'No SKU'} · {item.totalStock}{' '}
                        {item.unit}
                      </p>
                    </div>
                    {expiryWarning && (
                      <AlertTriangle className="ml-2 h-4 w-4 shrink-0 text-warning" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
