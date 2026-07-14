'use client';

import Link from 'next/link';
import { Package, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StickyNote, type StickyTone } from '@/components/ui/StickyNote';
import { useDashboard } from '@/lib/hooks/useDashboard';

const cards: {
  key: 'totalItems' | 'lowStockCount' | 'outOfStockCount' | 'expiringIn30Days';
  label: string;
  icon: typeof Package;
  href: string;
  tone: StickyTone;
}[] = [
  {
    key: 'totalItems',
    label: 'Total items',
    icon: Package,
    href: '/items',
    tone: 'cyan',
  },
  {
    key: 'lowStockCount',
    label: 'Running low',
    icon: AlertTriangle,
    href: '/items?status=low',
    tone: 'yellow',
  },
  {
    key: 'outOfStockCount',
    label: 'Out of stock',
    icon: XCircle,
    href: '/items?status=out',
    tone: 'orange',
  },
  {
    key: 'expiringIn30Days',
    label: 'Expiring soon',
    icon: Clock,
    href: '/expiring?days=30',
    tone: 'pink',
  },
];

export function SummaryCards() {
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="sticky-note sticky-orange rotate-n2 max-w-md">
        <span className="sticky-tape" />
        Stats didn’t load.{' '}
        <button type="button" onClick={() => refetch()} className="underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, href, tone }) => (
        <Link key={key} href={href} className="block">
          <StickyNote tone={tone} icon={Icon} className="h-full min-h-[8.5rem]">
            <p className="hand-title text-5xl text-black">{data[key]}</p>
            <p className="text-lg leading-none">{label}</p>
          </StickyNote>
        </Link>
      ))}
    </div>
  );
}
