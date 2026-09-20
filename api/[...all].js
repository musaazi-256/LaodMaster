// Vercel's filesystem router sends every request under /api/** here because of the
// `[...all]` catch-all filename — the Express app inside server/index.js then does its
// own normal internal routing (/api/auth, /api/trips, etc.) exactly as it does locally.
//
// `server/index.js` skips `app.listen()`/`initSchema()` at import time when running on
// Vercel (see the `process.env.VERCEL` check there), since a serverless function must
// never bind a port itself — Vercel's runtime invokes the exported handler directly per
// request. Schema creation happens lazily below instead: once per cold start, memoized
// so warm invocations of the same instance don't repeat it. `CREATE TABLE IF NOT EXISTS`
// makes this safe even if two cold starts race each other.
import { app } from '../server/index.js';
import { initSchema } from '../server/db.js';

let schemaReady;

export default async function handler(req, res) {
  if (!schemaReady) {
    schemaReady = initSchema();
  }
  await schemaReady;
  return app(req, res);
}
