'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border-default bg-surface"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-[80px]" />

        <div className="relative px-8 py-16 text-center sm:px-12">
          <h2 className="font-display text-3xl font-bold text-foreground-primary sm:text-4xl">
            Start managing stock smarter today
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-foreground-secondary">
            Join Kenyan businesses using Novora to reduce waste, dispatch faster,
            and keep every batch accounted for.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:shadow-glow"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#request-access"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border-default px-8 text-sm font-medium text-foreground-primary transition-colors hover:border-primary/40 hover:bg-raised/50"
            >
              Request a Demo
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
