import express from 'express';
import cors from 'cors';
import { db, initSchema } from './db.js';

import authRoutes from './routes/auth.js';
import driverRoutes from './routes/drivers.js';
import customerRoutes from './routes/customers.js';
import tripRoutes from './routes/trips.js';
import transactionRoutes from './routes/transactions.js';
import paymentMethodRoutes from './routes/paymentMethods.js';
import adminRoutes from './routes/admin.js';

export const app = express();
app.use(cors());
app.use(express.json());

// Simplified session: the frontend sends the logged-in user's id as x-user-id after a
// real signup/login. No JWT/session-table layer — appropriate for a local prototype
// where the point is persisted, real data, not production auth hardening.
app.use(async (req, _res, next) => {
  const userId = req.header('x-user-id');
  if (userId) {
    req.user = (await db.prepare('SELECT * FROM users WHERE id = ?').get(userId)) ?? null;
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Vercel imports `app` directly (see api/index.js) and runs it as a serverless
// function per request — it must never call `app.listen()` itself. Running the plain
// `node server/index.js` local dev server is the only path that does.
if (!process.env.VERCEL) {
  const PORT = process.env.API_PORT || 4000;
  initSchema()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`LoadMastr API listening on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database schema:', err);
      process.exit(1);
    });
}
