# AppMint Next.js store

A Next.js 15 storefront on AppEngine: catalog, product pages and a server-priced
cart, with the application credentials kept off the browser by a thin proxy.

Full walkthrough: **https://docs.appmint.io/docs/examples/nextjs-storefront**

## Run it

```bash
cp .env.example .env.local     # your org and app credentials
npm install
npm run dev                    # http://localhost:4100
```

## How it is put together

| File | What it does |
|---|---|
| `lib/appmint.ts` | The client. Browser → `/api/*`; server → AppEngine with the app token |
| `app/api/[...slug]/route.ts` | The proxy, with an allow-list of permitted prefixes |
| `app/page.tsx` | Catalog, rendered on the server |
| `app/product/[sku]/page.tsx` | Product detail |
| `components/CartView.tsx` | The cart — renders the server's totals field by field |
| `lib/cart-storage.ts` | Cart lines in `localStorage` — skus and quantities, no money |

## Configuration

```bash
APPENGINE_ENDPOINT=https://appengine.appmint.io
ORG_ID=your-org-id
APP_ID=your-app-id
APP_KEY=your-app-key
APP_SECRET=your-app-secret
```

Do **not** prefix these `NEXT_PUBLIC_` — that would ship them to the browser.
`.env.local` is git-ignored; keep it that way.
