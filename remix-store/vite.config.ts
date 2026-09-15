import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dotenv from 'dotenv';

// Next.js loads `.env.local` into process.env for you. Vite does not — it
// reads .env files for client-side `import.meta.env`, but server code here
// reads process.env, so load it explicitly or every credential is undefined.
dotenv.config({ path: '.env.local' });

export default defineConfig({
  plugins: [remix({ future: { v3_singleFetch: true } }), tsconfigPaths()],
});
