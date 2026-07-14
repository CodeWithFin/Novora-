'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import { requestAccess } from '@/lib/api/auth';
import { cn } from '@/lib/utils/cn';

const requestAccessSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  company: z.string().min(2, 'Company name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  message: z.string().optional(),
});

type RequestAccessForm = z.infer<typeof requestAccessSchema>;

export function RequestAccess() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestAccessForm>({
    resolver: zodResolver(requestAccessSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  async function onSubmit(data: RequestAccessForm) {
    setSubmitError(null);
    try {
      await requestAccess({
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone || undefined,
        message: data.message || undefined,
      });
      setSubmitted(true);
      reset();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  }

  return (
    <section id="request-access" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-foreground-primary sm:text-4xl">
            Ready to bring order
            <br />
            to your warehouse?
          </h2>
          <p className="mt-4 text-foreground-secondary">
            Tell us about your business and we&apos;ll get you set up.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass flex flex-col items-center rounded-xl border border-border-default p-10 text-center"
          >
            <CheckCircle className="mb-4 h-12 w-12 text-success" />
            <h3 className="font-display text-xl font-semibold text-foreground-primary">
              Request received
            </h3>
            <p className="mt-2 text-foreground-secondary">
              We&apos;ll be in touch within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-6 text-sm text-primary hover:underline"
            >
              Submit another request
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmit(onSubmit)}
            className="glass space-y-5 rounded-xl border border-border-default p-6 sm:p-8"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-foreground-secondary"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={cn(
                  'w-full rounded-lg border bg-raised px-4 py-2.5 text-sm text-foreground-primary',
                  'placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  errors.name ? 'border-danger' : 'border-border-default'
                )}
                placeholder="Jane Wanjiku"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="company"
                className="mb-1.5 block text-sm font-medium text-foreground-secondary"
              >
                Company Name
              </label>
              <input
                id="company"
                type="text"
                {...register('company')}
                className={cn(
                  'w-full rounded-lg border bg-raised px-4 py-2.5 text-sm text-foreground-primary',
                  'placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  errors.company ? 'border-danger' : 'border-border-default'
                )}
                placeholder="Nairobi Wholesale Ltd"
              />
              {errors.company && (
                <p className="mt-1 text-xs text-danger">
                  {errors.company.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground-secondary"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={cn(
                  'w-full rounded-lg border bg-raised px-4 py-2.5 text-sm text-foreground-primary',
                  'placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  errors.email ? 'border-danger' : 'border-border-default'
                )}
                placeholder="jane@company.co.ke"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-foreground-secondary"
              >
                Phone <span className="text-foreground-muted">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="w-full rounded-lg border border-border-default bg-raised px-4 py-2.5 text-sm text-foreground-primary placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+254 712 345 678"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-1.5 block text-sm font-medium text-foreground-secondary"
              >
                Message <span className="text-foreground-muted">(optional)</span>
              </label>
              <textarea
                id="message"
                rows={4}
                {...register('message')}
                className="w-full resize-none rounded-lg border border-border-default bg-raised px-4 py-2.5 text-sm text-foreground-primary placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Tell us about your warehouse operations..."
              />
            </div>

            {submitError && (
              <p className="text-sm text-danger">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-all hover:bg-primary/90 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Request Access
                </>
              )}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
