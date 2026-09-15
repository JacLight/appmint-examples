# AppMint Remix store

A Remix 2 storefront on AppEngine: catalog, product pages, a server-priced cart,
and a complete appointment-booking flow.

Full walkthrough: **https://docs.appmint.io/docs/examples/remix-storefront**

## Run it

```bash
cp .env.example .env.local     # your org and app credentials
npm install
npm run dev                    # http://localhost:4200
```

| Route | What it is |
|---|---|
| `/` | Catalog, rendered by a loader |
| `/product/:sku` | Product detail; an unknown sku is a real 404 |
| `/cart` | Cart; every figure comes from `storefront/pricing/calculate-cart` |
| `/book` | Bookable services (`crm/reservations/definitions`) |
| `/book/:id?date=YYYY-MM-DD` | Availability and booking |
| `/bookings?email=…` | Find and cancel a booking |

## How it is put together

| File | What it does |
|---|---|
| `app/appmint.server.ts` | The AppEngine client. `.server.ts` means it can never reach the browser |
| `app/routes/api.price.tsx` | A resource route that prices a cart — and does nothing else |
| `app/routes/book.$id.tsx` | Slots from the server, booking as a plain `<Form>` |
| `app/routes/bookings.tsx` | Guest lookup and cancellation by email |
| `app/cart-storage.ts` | Cart lines in `localStorage` — skus and quantities, no money |

## Two things to know

**Vite does not load `.env.local` into `process.env`.** `vite.config.ts` calls
`dotenv.config()` for that reason. Remove it and every credential is `undefined`.

**No money is computed here.** `total` from the pricing endpoint already includes
tax and shipping; adding the parts back up drops the tax and still looks right on
tax-free destinations.

## Configuration

```bash
APPENGINE_ENDPOINT=https://appengine.appmint.io
ORG_ID=your-org-id
APP_ID=your-app-id
APP_KEY=your-app-key
APP_SECRET=your-app-secret
```

These stay on the server. `.env.local` is git-ignored; keep it that way.
