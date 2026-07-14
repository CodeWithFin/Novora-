import Link from 'next/link';
import { Package } from 'lucide-react';

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Request Access', href: '#request-access' },
  { label: 'Login', href: '/login' },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <span className="font-display text-lg font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Novora
              </span>
            </Link>
            <p className="mt-3 text-sm text-foreground-secondary">
              Built for East African business
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-foreground-secondary transition-colors hover:text-foreground-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-sm text-foreground-secondary">
            <a
              href="mailto:hello@novora.app"
              className="transition-colors hover:text-foreground-primary"
            >
              hello@novora.app
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-border-subtle pt-6 text-center text-xs text-foreground-muted sm:text-left">
          <span suppressHydrationWarning>
            © {new Date().getFullYear()} Novora. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
