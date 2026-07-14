import type { Metadata } from 'next';
import { Inter, Chewy, Patrick_Hand, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const chewy = Chewy({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-chewy',
});

const patrick = Patrick_Hand({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-patrick',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Novora — Inventory Management',
  description:
    'Track stock, manage expiry dates, and dispatch to shops — built for Kenyan businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${chewy.variable} ${patrick.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
