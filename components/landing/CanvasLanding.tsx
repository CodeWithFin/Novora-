'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  Barcode,
  Boxes,
  Building2,
  CheckCircle,
  ClipboardList,
  Loader2,
  Menu,
  Package,
  Send,
  ShieldCheck,
  Store,
  Timer,
  Truck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { requestAccess } from '@/lib/api/auth';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  company: z.string().min(2, 'Company name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const features = [
  {
    icon: Warehouse,
    title: 'Multi-shop inventory',
    body: 'One warehouse brain for every shop. Stock levels stay clear across locations.',
    tone: 'bg-sky-100 text-sky-500 border-sky-300',
  },
  {
    icon: Timer,
    title: 'Batch expiry & FEFO',
    body: 'Dispatch oldest-first automatically. Catch near-expiry before it becomes write-off.',
    tone: 'bg-emerald-100 text-emerald-500 border-emerald-300',
  },
  {
    icon: Barcode,
    title: 'Barcode scanning',
    body: 'Receive and pick with barcodes so stock moves stay fast and accurate.',
    tone: 'bg-violet-100 text-violet-600 border-violet-300',
  },
  {
    icon: Truck,
    title: 'Stock in & out',
    body: 'Record receipts, transfers, and dispatches with a full audit trail.',
    tone: 'bg-pink-100 text-rose-500 border-pink-300',
  },
  {
    icon: Store,
    title: 'Shop-ready ops',
    body: 'Give shop teams what they need without exposing the whole warehouse.',
    tone: 'bg-sky-100 text-sky-500 border-sky-300',
  },
  {
    icon: ShieldCheck,
    title: 'Roles & invites',
    body: 'Invite staff, set permissions, and keep every move accountable.',
    tone: 'bg-yellow-100 text-yellow-600 border-yellow-300',
  },
];

const steps = [
  {
    num: '01',
    title: 'Stock your warehouse',
    body: 'Add items, batches, and expiry dates. Scan barcodes as goods arrive.',
    tone: 'border-sky-300 bg-sky-100 text-sky-500',
  },
  {
    num: '02',
    title: 'Dispatch with FEFO',
    body: 'Move stock to shops. Novora picks the right batches so nothing goes stale.',
    tone: 'border-violet-300 bg-violet-100 text-violet-600',
  },
  {
    num: '03',
    title: 'Sell with clarity',
    body: 'Track shop levels, undo mistakes, and present clean numbers to your team.',
    tone: 'border-sky-300 bg-sky-100 text-sky-500',
  },
];

export function CanvasLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', company: '', email: '', phone: '', message: '' },
  });

  async function onSubmit(data: FormData) {
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
    <div className="novora-canvas">
      {/* Hero */}
      <section className="nc-hero">
        <header className="nc-nav">
          <div className="nc-nav-left">
            <Link className="nc-logo-wrap" href="/" aria-label="Novora Home">
              <span className="nc-logo">N</span>
            </Link>
            <nav className="nc-menu" aria-label="Main navigation">
              <a href="#features" className="is-active">
                <Package className="h-5 w-5" />
                Features
              </a>
              <a href="#how-it-works">
                <ClipboardList className="h-5 w-5" />
                How it works
              </a>
              <a href="#request-access">
                <Users className="h-5 w-5" />
                Access
              </a>
              <a href="#pricing">
                <Building2 className="h-5 w-5" />
                Pricing
              </a>
            </nav>
          </div>
          <div className="nc-nav-right">
            <Link className="nc-login" href="/login">
              Log in
            </Link>
            <Link className="nc-top-cta" href="/signup">
              Start for free
            </Link>
          </div>
          <button
            type="button"
            className="nc-mobile-menu"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {menuOpen && (
          <div className="absolute inset-x-0 top-[78px] z-40 border-b border-[#e7e7e7] bg-white p-4 shadow-lg md:hidden">
            <div
              className="flex flex-col gap-2 text-lg font-bold uppercase"
              style={{ fontFamily: "'Patrick Hand', sans-serif" }}
            >
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 hover:bg-sky-50">
                Features
              </a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 hover:bg-sky-50">
                How it works
              </a>
              <a href="#request-access" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 hover:bg-sky-50">
                Request access
              </a>
              <Link href="/login" className="rounded-md px-3 py-2 hover:bg-sky-50" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="mt-2 flex h-12 items-center justify-center rounded bg-[#13a8ff] text-white"
                onClick={() => setMenuOpen(false)}
              >
                Start for free
              </Link>
            </div>
          </div>
        )}

        <div className="nc-stage">
          <div className="nc-note green">
            <span className="nc-tape" />
            <Boxes className="h-9 w-9 shrink-0" strokeWidth={2.2} />
            <span>
              Live stock
              <br />
              across shops
            </span>
          </div>
          <div className="nc-note orange">
            <span className="nc-tape" />
            <Barcode className="h-9 w-9 shrink-0" strokeWidth={2.2} />
            <span>Barcodes</span>
          </div>
          <div className="nc-note yellow">
            <span className="nc-tape" />
            <Timer className="h-9 w-9 shrink-0" strokeWidth={2.2} />
            <span>
              Batch
              <br />
              expiry
            </span>
          </div>
          <div className="nc-note cyan">
            <span className="nc-tape" />
            <Truck className="h-9 w-9 shrink-0" strokeWidth={2.2} />
            <span>
              FEFO
              <br />
              dispatch
            </span>
          </div>
          <div className="nc-note pink">
            <span className="nc-tape" />
            <Store className="h-9 w-9 shrink-0" strokeWidth={2.2} />
            <span>
              Built for
              <br />
              Kenyan SMEs
            </span>
          </div>

          <aside className="nc-toolbar" aria-label="Inventory tools">
            <div className="nc-tool active" data-tooltip="Receive">
              <Package className="h-5 w-5" />
            </div>
            <div className="nc-tool" data-tooltip="Dispatch">
              <Truck className="h-5 w-5" />
            </div>
            <div className="nc-tool" data-tooltip="Scan">
              <Barcode className="h-5 w-5" />
            </div>
            <div className="nc-tool" data-tooltip="Shops">
              <Store className="h-5 w-5" />
            </div>
            <div className="nc-tool" data-tooltip="Batches">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="nc-tool" data-tooltip="More">
              ···
            </div>
          </aside>

          <section className="nc-center">
            <div className="nc-eyebrow">Inventory for growing teams</div>

            <div className="nc-select-box">
              <div className="nc-border top" />
              <div className="nc-border right" />
              <div className="nc-border bottom" />
              <div className="nc-border left" />
              {(['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'] as const).map((pos) => (
                <span key={pos} className={`nc-handle ${pos}`} />
              ))}
              <h1 className="nc-title">Novora</h1>
              <div className="nc-cursor">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="#050505" strokeWidth="1.2" className="h-7 w-7">
                  <path d="M4.1 4.3c-.3-.1-.6.2-.5.5l6.8 15.8c.2.4.8.4.9-.1l1.7-6.5c.1-.5.5-.8 1-1l6.5-1.6c.5-.1.6-.8.1-1L4.1 4.3Z" />
                </svg>
              </div>
            </div>

            <p className="nc-subtitle">
              Track stock, manage expiry, and dispatch
              <br />
              to shops in one <span className="nc-underline">flexible</span> workspace.
            </p>

            <div className="nc-actions">
              <Link className="nc-primary-btn" href="/signup">
                Start for free
                <ArrowRight className="h-6 w-6" strokeWidth={2.1} />
              </Link>
              <a className="nc-secondary-btn" href="#request-access">
                Request access
              </a>
            </div>
          </section>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="nc-dark">
        <div className="nc-section-inner">
          <div className="nc-kicker">
            <span />
            Features
            <span />
          </div>
          <h2 className="nc-h2">
            Everything you need to
            <br className="hidden sm:block" />
            keep inventory honest.
          </h2>
          <p className="nc-lead">
            Receive stock, chase expiry, collaborate across shops, and present
            clear numbers — without the spreadsheet chaos.
          </p>

          <div className="nc-feature-grid">
            {features.map(({ icon: Icon, title, body, tone }) => (
              <article key={title} className="nc-card">
                <div className="flex gap-4">
                  <div className={`nc-icon-box ${tone}`}>
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="nc-dark" style={{ paddingTop: '6rem' }}>
        <div className="nc-section-inner">
          <div className="nc-kicker">
            <span />
            How it works
            <span />
          </div>
          <h2 className="nc-h2">
            From messy shelves
            <br className="hidden sm:block" />
            to clear action.
          </h2>
          <p className="nc-lead">
            Capture stock, move it with FEFO, and keep every shop aligned in a
            few simple steps.
          </p>

          <div className="nc-steps">
            {steps.map((step, i) => (
              <Fragment key={step.num}>
                <article className="nc-step-card">
                  <div className="flex gap-4">
                    <div className={`nc-step-num border ${step.tone}`}>{step.num}</div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
                      <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">
                        {step.body}
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-5 min-h-36 overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:1.5rem_1.5rem]">
                    {i === 0 && (
                      <>
                        <div className="absolute left-5 top-6 -rotate-3 bg-emerald-200 px-4 py-3 text-sm font-bold">
                          Rice 25kg
                        </div>
                        <div className="absolute right-6 top-10 rotate-2 bg-yellow-200 px-4 py-3 text-sm font-bold">
                          Exp 2026-11
                        </div>
                        <div className="absolute bottom-5 left-10 bg-sky-200 px-4 py-3 text-sm font-bold">
                          +48 units
                        </div>
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <div className="absolute left-6 top-5 rounded bg-emerald-300 px-3 py-1 text-xs font-bold">
                          Warehouse
                        </div>
                        <div className="absolute right-6 bottom-6 rounded bg-violet-300 px-3 py-1 text-xs font-bold text-white">
                          Shop A
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-500 bg-sky-50 px-6 py-4 text-center text-lg font-bold">
                          FEFO
                          <br />
                          pick
                        </div>
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                          <span className="rounded bg-emerald-100 py-2">On hand</span>
                          <span className="rounded bg-sky-100 py-2">In transit</span>
                          <span className="rounded bg-yellow-100 py-2">Sold</span>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-2 rounded bg-neutral-200" />
                          <div className="h-2 w-4/5 rounded bg-neutral-200" />
                          <div className="h-2 w-3/5 rounded bg-sky-300" />
                        </div>
                      </>
                    )}
                  </div>
                </article>
                {i < steps.length - 1 && (
                  <div className="nc-arrow">
                    <ArrowRight className="h-9 w-9" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Request access */}
      <section id="request-access" className="nc-light">
        <div className="nc-section-inner">
          <div className="nc-kicker" style={{ color: '#078fff' }}>
            <span style={{ borderColor: '#078fff' }} />
            Get started
            <span style={{ borderColor: '#078fff' }} />
          </div>
          <h2 className="nc-h2">
            Ready to bring order
            <br />
            to your warehouse?
          </h2>
          <p className="nc-lead">
            Tell us about your business and we&apos;ll get you set up — or jump
            straight in with a free account.
          </p>

          {submitted ? (
            <div className="nc-form text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
              <h3 className="text-xl font-bold">Request received</h3>
              <p className="mt-2 font-semibold text-slate-600">
                We&apos;ll be in touch within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm font-bold text-[#13a8ff] underline"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="nc-form">
              <div>
                <input {...register('name')} placeholder="Full name" aria-label="Full name" />
                {errors.name && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div>
                <input {...register('company')} placeholder="Company name" aria-label="Company" />
                {errors.company && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.company.message}</p>
                )}
              </div>
              <div>
                <input {...register('email')} type="email" placeholder="Email" aria-label="Email" />
                {errors.email && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.email.message}</p>
                )}
              </div>
              <input {...register('phone')} type="tel" placeholder="Phone (optional)" aria-label="Phone" />
              <textarea
                {...register('message')}
                rows={3}
                placeholder="Tell us about your warehouse..."
                aria-label="Message"
              />
              {submitError && (
                <p className="text-sm font-semibold text-red-600">{submitError}</p>
              )}
              <button type="submit" disabled={isSubmitting} className="nc-primary-btn w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Request access
                  </>
                )}
              </button>
              <p className="text-center text-sm font-semibold text-slate-500">
                Or{' '}
                <Link href="/signup" className="text-[#13a8ff] underline">
                  create an account
                </Link>{' '}
                now
              </p>
            </form>
          )}
        </div>
      </section>

      {/* CTA / Footer */}
      <footer id="pricing" className="nc-footer">
        <div className="nc-footer-inner">
          <h2 className="nc-footer-title">
            Ready to bring
            <br />
            your stock together?
          </h2>
          <p
            className="mx-auto mt-4 max-w-md text-base font-bold leading-snug"
            style={{ fontFamily: 'var(--font-hand)' }}
          >
            Brainstorm less in spreadsheets. Track more in Novora — free to start.
          </p>
          <div className="nc-actions" style={{ marginTop: 28 }}>
            <Link className="nc-primary-btn" href="/signup">
              Start for free
            </Link>
            <Link className="nc-secondary-btn" href="/login">
              Log in
            </Link>
          </div>

          <div className="nc-footer-bottom">
            <div className="flex items-center gap-3">
              <span className="nc-logo" style={{ width: 42, height: 42, fontSize: 28 }}>
                N
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Novora</span>
            </div>
            <p suppressHydrationWarning>
              © {new Date().getFullYear()} Novora. Built for Kenyan SMEs.
            </p>
            <div className="flex gap-4 font-bold">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#request-access">Access</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
