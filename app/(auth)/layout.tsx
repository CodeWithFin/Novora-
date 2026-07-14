import Link from 'next/link';
import '../(public)/novora-canvas.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="novora-canvas flex min-h-screen flex-col"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(15,23,42,0.075) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.075) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        backgroundColor: '#fff',
      }}
    >
      <header className="flex items-center justify-between border-b border-[#e7e7e7] bg-white/90 px-6 py-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="nc-logo" style={{ width: 44, height: 44, fontSize: 28 }}>
            N
          </span>
          <span
            style={{
              fontFamily: "'Chewy', cursive",
              fontSize: 28,
              letterSpacing: '-0.02em',
            }}
          >
            Novora
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-wide text-neutral-600 hover:text-black"
          style={{ fontFamily: "'Patrick Hand', sans-serif", fontSize: 18 }}
        >
          Back home
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center p-4">{children}</div>
    </div>
  );
}
