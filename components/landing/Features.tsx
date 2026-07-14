'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Package,
  ArrowUpDown,
  Store,
  Clock,
  ScanLine,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Package,
    title: 'Batch Tracking',
    description:
      'Track multiple expiry dates per product. Never lose stock to hidden expiry.',
  },
  {
    icon: ArrowUpDown,
    title: 'FEFO Dispatch',
    description:
      'Oldest stock goes out first, automatically. No manual checking.',
  },
  {
    icon: Store,
    title: 'Multi-Shop',
    description:
      'Dispatch to different locations. See exactly where stock went.',
  },
  {
    icon: Clock,
    title: 'Expiry Alerts',
    description:
      "Know what's expiring in 7, 30, or 90 days before it becomes a loss.",
  },
  {
    icon: ScanLine,
    title: 'Barcode Scanning',
    description:
      'Scan products in and out with your phone camera. No extra hardware needed.',
  },
  {
    icon: Users,
    title: 'Team Access',
    description:
      'Invite staff with role-based permissions. Admins control, staff execute.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function Features() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" ref={ref} className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-foreground-primary sm:text-4xl">
            Everything you need.
            <br />
            Nothing you don&apos;t.
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className={cn(
                'group rounded-xl border border-border-subtle bg-surface p-6',
                'transition-all duration-300 hover:border-primary/30 hover:shadow-glow'
              )}
            >
              <feature.icon className="mb-4 h-6 w-6 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
