import * as React from 'react';
import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative mx-auto flex max-w-md flex-col items-center justify-center px-6 py-12 text-center',
        className
      )}
      {...props}
    >
      <div className="sticky-note sticky-yellow rotate-2 w-full max-w-sm items-center text-center">
        <span className="sticky-tape" />
        {Icon && <Icon className="mx-auto mb-2 h-8 w-8" strokeWidth={2.2} />}
        <h3 className="hand-title text-3xl text-black">{title}</h3>
        {description && (
          <p className="mt-2 text-lg leading-snug text-black/80">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export { EmptyState };
