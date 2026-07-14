import * as React from 'react';

import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import type { StockStatus } from '@/shared/utils/stock';

const statusConfig: Record<
  StockStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  ok: { label: 'In Stock', variant: 'success' },
  low: { label: 'Low Stock', variant: 'warning' },
  out: { label: 'Out of Stock', variant: 'danger' },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StockStatus;
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(className)} {...props}>
      {config.label}
    </Badge>
  );
}

export { StatusBadge, statusConfig };
