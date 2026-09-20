import pg from 'pg';

const { Pool, types } = pg;

// Postgres returns COUNT()/SUM() over integer columns as the `bigint` (OID 20) type,
// which node-postgres deliberately returns as a *string* by default (to avoid silent
// precision loss above Number.MAX_SAFE_INTEGER). Every route in this app treats those
// results as plain numbers — trip counts, wallet sums, dashboard metrics — well within
// safe-integer range, so parsing them back to numbers here keeps every call site
// working exactly as it did against SQLite, with no per-query changes needed.
types.setTypeParser(20, (value) => parseInt(value, 10));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and point it at your Postgres ' +
      '(Supabase) connection string, or export it in your shell before starting the server.'
  );
}

// Supabase (and most managed Postgres) requires TLS but presents a certificate chain
// `NODE_ENV`-default TLS validation won't resolve in every environment; a local
// Postgres on localhost has no TLS at all. Only force permissive SSL for non-local hosts.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

/**
 * Translates the SQLite dialect this codebase was originally written in to Postgres:
 *  - `?` positional placeholders -> `$1, $2, ...` (Postgres has no `?` placeholder form)
 *  - `datetime('now')` / `datetime('now', '-N days')` -> an equivalent Postgres
 *    expression that still yields a 'YYYY-MM-DD HH:MM:SS' TEXT string, matching what
 *    SQLite produced, so `formatDate()` in lib/serialize.js needs no changes at all.
 *  - `substr(col, 1, 10)` -> `LEFT(col, 10)` (Postgres has no `substr` alias)
 *  - `INSERT OR REPLACE INTO t (a, b, c) VALUES (...)` -> the equivalent
 *    `INSERT ... ON CONFLICT (a) DO UPDATE SET b = EXCLUDED.b, c = EXCLUDED.c`, assuming
 *    (true for every call site here) the first listed column is the conflict target.
 * Centralizing this in one place means every route file keeps its original SQL text
 * unchanged — only `db.prepare(...).get/all/run` calls need `await` added.
 */
function translate(sql) {
  let out = sql;

  // Captures table, column list and the VALUES tuple together so the replacement can
  // emit them back out in valid order (VALUES before ON CONFLICT) in one shot, rather
  // than patching the column-list match and trying to relocate ON CONFLICT afterwards.
  out = out.replace(
    /INSERT OR REPLACE INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*(\([^)]*\))/i,
    (_m, table, colList, valuesTuple) => {
      const cols = colList.split(',').map((c) => c.trim());
      const [conflictCol, ...restCols] = cols;
      const setClause = restCols.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
      return `INSERT INTO ${table} (${colList}) VALUES ${valuesTuple} ON CONFLICT (${conflictCol}) DO UPDATE SET ${setClause}`;
    }
  );

  out = out.replace(/datetime\('now',\s*'-(\d+)\s*days?'\)/gi, (_m, n) => `to_char(now() - interval '${n} days', 'YYYY-MM-DD HH24:MI:SS')`);
  out = out.replace(/datetime\('now'\)/gi, `to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`);
  out = out.replace(/substr\((\w+),\s*1,\s*10\)/gi, 'LEFT($1, 10)');

  let paramIndex = 0;
  out = out.replace(/\?/g, () => `$${++paramIndex}`);

  return out;
}

function buildResult(rows, rowCount) {
  return { rows, rowCount };
}

async function run(sql, params) {
  const result = await pool.query(translate(sql), params);
  return buildResult(result.rows, result.rowCount);
}

/**
 * Drop-in replacement for `node:sqlite`'s `DatabaseSync.prepare(sql)`: the same
 * `.get(...params)` / `.all(...params)` / `.run(...params)` call shape, just async.
 */
function prepare(sql) {
  return {
    async get(...params) {
      const { rows } = await run(sql, params);
      return rows[0];
    },
    async all(...params) {
      const { rows } = await run(sql, params);
      return rows;
    },
    async run(...params) {
      const { rowCount } = await run(sql, params);
      return { changes: rowCount };
    },
  };
}

async function exec(sql) {
  await pool.query(translate(sql));
}

export const db = { prepare, exec };

// Real, persisted schema — this database is the single source of truth for every
// account, approval, trip and transaction. Nothing here resets on refresh or page
// reload; only a live GPS feed and a real payment gateway are out of scope for this
// prototype (see MapCanvas for the simulated map, and transactions below for
// simulated-but-persisted payments).
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('customer','driver')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    wallet_balance INTEGER NOT NULL DEFAULT 0,
    referral_code TEXT,
    vehicle_model TEXT,
    plate_number TEXT,
    truck_tier_id TEXT,
    verification_status TEXT DEFAULT 'unverified',
    vehicle_verification_status TEXT DEFAULT 'unverified',
    is_online INTEGER NOT NULL DEFAULT 0,
    cash_due INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 5.0,
    trip_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_role_phone ON users(role, phone);

  CREATE TABLE IF NOT EXISTS driver_documents (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES users(id),
    doc_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded',
    file_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(driver_id, doc_type)
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    detail TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES users(id),
    driver_id TEXT REFERENCES users(id),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    cargo_category TEXT,
    truck_tier_id TEXT,
    fare INTEGER NOT NULL,
    payment_method_id TEXT,
    tracking_state TEXT NOT NULL DEFAULT 'searching',
    status TEXT NOT NULL DEFAULT 'requested',
    rating INTEGER,
    eta_minutes INTEGER,
    distance_km REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    trip_id TEXT REFERENCES trips(id),
    direction TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'success',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export async function initSchema() {
  await exec(SCHEMA);
}

export function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
