import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const tones = {
  green: 'sticky-green rotate-n3',
  yellow: 'sticky-yellow rotate-2',
  orange: 'sticky-orange rotate-n2',
  cyan: 'sticky-cyan rotate-3',
  pink: 'sticky-pink rotate-n2',
} as const;

export type StickyTone = keyof typeof tones;

export function StickyNote({
  tone = 'yellow',
  title,
  children,
  icon: Icon,
  className,
  as: Comp = 'div',
  href,
  onClick,
}: {
  tone?: StickyTone;
  title?: string;
  children?: ReactNode;
  icon?: LucideIcon;
  className?: string;
  as?: 'div' | 'button' | 'a';
  href?: string;
  onClick?: () => void;
}) {
  const classes = cn('sticky-note', tones[tone], className);

  const body = (
    <>
      <span className="sticky-tape" aria-hidden />
      {(Icon || title) && (
        <div className="flex items-start gap-2">
          {Icon && <Icon className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={2.3} />}
          {title && <span className="text-xl leading-tight">{title}</span>}
        </div>
      )}
      {children}
    </>
  );

  if (Comp === 'a' || href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {body}
      </a>
    );
  }

  if (Comp === 'button' || onClick) {
    return (
      <button type="button" className={cn(classes, 'text-left w-full')} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <div className={classes}>{body}</div>;
}
