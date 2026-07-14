'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const stats = [
  { label: 'Total Items', value: '248', icon: Package, color: 'text-primary' },
  {
    label: 'Low Stock',
    value: '12',
    icon: AlertTriangle,
    color: 'text-warning',
  },
  { label: 'Out of Stock', value: '3', icon: XCircle, color: 'text-danger' },
  {
    label: 'Expiring (30d)',
    value: '8',
    icon: Clock,
    color: 'text-warning',
  },
];

const mockRows = [
  { name: 'Sunflower Oil 1L', sku: 'OIL-001', stock: 142, status: 'ok' },
  { name: 'Maize Flour 2kg', sku: 'FLR-024', stock: 8, status: 'low' },
  { name: 'Detergent 500ml', sku: 'DET-012', stock: 0, status: 'out' },
  { name: 'Rice 5kg', sku: 'RCE-008', stock: 56, status: 'ok' },
];

function DashboardMockup() {
  return (
    <div className="glass overflow-hidden rounded-xl border border-border-default shadow-glow">
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-2 font-display text-xs text-foreground-muted">
            Novora Dashboard
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border-subtle bg-raised/50 p-3"
            >
              <stat.icon className={cn('mb-2 h-4 w-4', stat.color)} />
              <p className="font-display text-xl font-semibold text-foreground-primary">
                {stat.value}
              </p>
              <p className="text-xs text-foreground-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border-subtle bg-raised/30">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
            <span className="font-display text-sm text-foreground-primary">
              Inventory Overview
            </span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="divide-y divide-border-subtle">
            {mockRows.map((row) => (
              <div
                key={row.sku}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="text-foreground-primary">{row.name}</p>
                  <p className="font-mono text-xs text-foreground-muted">
                    {row.sku}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-foreground-secondary">
                    {row.stock}
                  </span>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      row.status === 'ok' &&
                        'bg-success/10 text-success',
                      row.status === 'low' &&
                        'bg-warning/10 text-warning',
                      row.status === 'out' &&
                        'bg-danger/10 text-danger'
                    )}
                  >
                    {row.status === 'ok'
                      ? 'OK'
                      : row.status === 'low'
                        ? 'Low'
                        : 'Out'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground-primary sm:text-5xl lg:text-7xl"
        >
          Your warehouse.
          <br />
          <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            Always in order.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="mx-auto mt-6 max-w-2xl text-lg text-foreground-secondary"
        >
          Novora helps Kenyan businesses track stock, manage expiry dates, and
          dispatch to shops — all from one fast, beautiful dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:shadow-glow"
          >
            Get Started
          </Link>
          <a
            href="#how-it-works"
            className="glass inline-flex h-12 items-center justify-center rounded-lg border border-border-default px-8 text-sm font-medium text-foreground-primary transition-colors hover:border-primary/40 hover:bg-raised/50"
          >
            See How It Works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
          className="mx-auto mt-16 max-w-4xl animate-float"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
