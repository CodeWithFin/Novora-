import { Badge } from '@/components/ui/badge';
import type { ItemStatus } from '@/shared/types/item';

const config: Record<
  ItemStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  ok: { label: 'OK', variant: 'success' },
  low: { label: 'Low', variant: 'warning' },
  out: { label: 'Out', variant: 'danger' },
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const { label, variant } = config[status] ?? config.ok;
  return <Badge variant={variant}>{label}</Badge>;
}
