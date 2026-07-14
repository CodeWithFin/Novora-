'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PackagePlus, TrendingUp, Truck, type LucideIcon } from 'lucide-react';

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: '01',
    icon: PackagePlus,
    title: 'Add Your Products',
    description:
      'Import your catalogue once. Add SKUs, barcodes, categories, and minimum stock levels.',
  },
  {
    number: '02',
    icon: TrendingUp,
    title: 'Record Stock In',
    description:
      'Receive goods with expiry dates per batch. Novora tracks everything automatically.',
  },
  {
    number: '03',
    icon: Truck,
    title: 'Dispatch to Shops',
    description:
      'Select shop, scan or search items, confirm. Novora handles FEFO — oldest stock goes first, always.',
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="border-y border-border-subtle bg-surface/30 px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center font-display text-3xl font-bold text-foreground-primary sm:text-4xl"
        >
          How it works
        </motion.h2>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-12 hidden h-px border-t border-dashed border-border-strong md:block" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              <span className="pointer-events-none absolute -top-4 font-display text-7xl font-bold text-foreground-primary/5 sm:text-8xl">
                {step.number}
              </span>

              <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-border-default bg-raised">
                <step.icon className="h-8 w-8 text-primary" />
              </div>

              <h3 className="font-display text-xl font-semibold text-foreground-primary">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground-secondary">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
