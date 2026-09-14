import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'AppMint · Next.js store',
  description: 'A worked example of building a storefront on the AppMint AppEngine API.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">AppMint <span>Next.js store</span></Link>
          <nav>
            <Link href="/">Catalog</Link>
            <Link href="/cart">Cart</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          Prices, shipping and tax are decided by the server. This app renders them, it never computes them.
        </footer>
      </body>
    </html>
  );
}
