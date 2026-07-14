import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow = 'Workspace',
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div>
        <p className="mb-2 inline-block font-hand text-xl font-bold uppercase tracking-wide text-black">
          <span className="sketch-underline">{eyebrow}</span>
        </p>
        <h2 className="hand-title text-4xl text-black sm:text-5xl">{title}</h2>
        {subtitle && (
          <p className="mt-2 max-w-xl font-hand text-xl leading-snug text-foreground-secondary">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
