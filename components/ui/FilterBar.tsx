import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function FilterBar({ className, children, ...props }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-surface p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { FilterBar };
