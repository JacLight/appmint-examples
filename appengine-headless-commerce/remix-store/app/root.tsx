import { Links, Meta, Outlet, Scripts, ScrollRestoration, Link } from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';
import styles from './globals.css?url';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header className="site-header">
          <Link to="/" className="brand">AppMint <span>Remix store</span></Link>
          <nav>
            <Link to="/">Catalog</Link>
            <Link to="/book">Book</Link>
            <Link to="/bookings">My bookings</Link>
            <Link to="/cart">Cart</Link>
          </nav>
        </header>
        <main><Outlet /></main>
        <footer className="site-footer">
          Prices, shipping and tax are decided by the server. This app renders them, it never computes them.
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
