import { Router } from 'express';
import { db, makeId } from '../db.js';
import { hashPassword } from '../lib/password.js';
import { serializeTripSummary, serializeTransaction, serializeUser } from '../lib/serialize.js';

const router = Router();

router.get('/dashboard', async (_req, res) => {
  const totalTrips = (await db.prepare(`SELECT COUNT(*) AS n FROM trips WHERE status = 'completed'`).get()).n;
  const revenue = (await db.prepare(`SELECT COALESCE(SUM(fare), 0) AS total FROM trips WHERE status = 'completed'`).get()).total;
  const activeDrivers = (await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'driver' AND is_online = 1`).get()).n;
  const customers = (await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'customer'`).get()).n;

  const totalDrivers = (await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'driver'`).get()).n;
  const verifiedDrivers = (await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'driver' AND verification_status = 'verified'`).get()).n;
  const pendingVerification = (await db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'driver' AND verification_status = 'pending'`).get()).n;

  const tripStatusRows = await db.prepare(`SELECT status, COUNT(*) AS n FROM trips GROUP BY status`).all();
  const tripStatusCounts = { requested: 0, accepted: 0, completed: 0, cancelled: 0 };
  tripStatusRows.forEach((r) => { if (r.status in tripStatusCounts) tripStatusCounts[r.status] = r.n; });
  const totalRequested = (await db.prepare(`SELECT COUNT(*) AS n FROM trips`).get()).n;

  const recentDriverRows = await db
    .prepare(
      `SELECT id, name, vehicle_model, truck_tier_id, trip_count, is_online, rating
       FROM users WHERE role = 'driver' ORDER BY is_online DESC, trip_count DESC LIMIT 5`
    )
    .all();
  const recentDrivers = await Promise.all(recentDriverRows.map(async (r) => {
    const earned = (await db
      .prepare(`SELECT COALESCE(SUM(fare), 0) AS total FROM trips WHERE driver_id = ? AND status = 'completed'`)
      .get(r.id)).total;
    return {
      id: r.id,
      name: r.name,
      vehicleModel: r.vehicle_model,
      truckTierId: r.truck_tier_id,
      tripCount: r.trip_count,
      isOnline: !!r.is_online,
      rating: r.rating,
      totalEarned: earned,
    };
  }));

  const tripRows = await db.prepare(`SELECT * FROM trips ORDER BY created_at DESC LIMIT 8`).all();
  const recentTrips = await Promise.all(tripRows.map(async (row) => {
    const driver = row.driver_id ? await db.prepare('SELECT name FROM users WHERE id = ?').get(row.driver_id) : null;
    const customer = await db.prepare('SELECT name FROM users WHERE id = ?').get(row.customer_id);
    return serializeTripSummary(row, { driverName: driver?.name, customerName: customer?.name });
  }));

  const txnRows = await db.prepare(`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 8`).all();

  const dailyRows = await db.prepare(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS trips, COALESCE(SUM(CASE WHEN status = 'completed' THEN fare ELSE 0 END), 0) AS revenue
     FROM trips WHERE created_at >= datetime('now', '-6 days') GROUP BY day`
  ).all();
  const byDay = new Map(dailyRows.map((r) => [r.day, r]));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const row = byDay.get(key);
    days.push({ label, trips: row?.trips ?? 0, revenue: row?.revenue ?? 0 });
  }

  const tierRows = await db.prepare(
    `SELECT truck_tier_id, COUNT(*) AS n FROM trips WHERE truck_tier_id IS NOT NULL GROUP BY truck_tier_id`
  ).all();

  res.json({
    metrics: { totalTrips, revenue, activeDrivers, customers, totalDrivers, verifiedDrivers, pendingVerification },
    tripStatusCounts: { ...tripStatusCounts, totalRequested },
    recentDrivers,
    recentTrips,
    recentTransactions: txnRows.map(serializeTransaction),
    dailyTrips: days.map((d) => ({ label: d.label, value: d.trips })),
    dailyRevenue: days.map((d) => ({ label: d.label, value: d.revenue })),
    tripsByTier: tierRows.map((r) => ({ truckTierId: r.truck_tier_id, count: r.n })),
  });
});

router.get('/trips', async (_req, res) => {
  const rows = await db.prepare(`SELECT * FROM trips ORDER BY created_at DESC`).all();
  const trips = await Promise.all(rows.map(async (row) => {
    const driver = row.driver_id ? await db.prepare('SELECT name FROM users WHERE id = ?').get(row.driver_id) : null;
    const customer = await db.prepare('SELECT name FROM users WHERE id = ?').get(row.customer_id);
    return serializeTripSummary(row, { driverName: driver?.name, customerName: customer?.name });
  }));
  res.json({ trips });
});

router.get('/trips/:id', async (req, res) => {
  const row = await db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Trip not found' });
  const driver = row.driver_id ? await db.prepare('SELECT name FROM users WHERE id = ?').get(row.driver_id) : null;
  const customer = await db.prepare('SELECT name FROM users WHERE id = ?').get(row.customer_id);
  res.json({ trip: serializeTripSummary(row, { driverName: driver?.name, customerName: customer?.name }) });
});

router.get('/reports', async (_req, res) => {
  const tierRows = await db.prepare(
    `SELECT truck_tier_id, COUNT(*) AS n FROM trips WHERE truck_tier_id IS NOT NULL GROUP BY truck_tier_id`
  ).all();
  const statusRows = await db.prepare(
    `SELECT verification_status, COUNT(*) AS n FROM users WHERE role = 'driver' GROUP BY verification_status`
  ).all();
  res.json({
    tripsByTier: tierRows.map((r) => ({ truckTierId: r.truck_tier_id, count: r.n })),
    driversByStatus: statusRows.map((r) => ({ status: r.verification_status, count: r.n })),
  });
});

router.get('/transactions', async (_req, res) => {
  const rows = await db.prepare(`SELECT * FROM transactions ORDER BY created_at DESC`).all();
  res.json({ transactions: rows.map(serializeTransaction) });
});

function formatPhone(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('256')) return `+${digits}`;
  if (digits.length === 9) return `+256${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

// ---- CUSTOMERS ADMIN API ----

router.get('/customers', async (_req, res) => {
  const rows = await db.prepare(`SELECT * FROM users WHERE role = 'customer' ORDER BY created_at DESC`).all();
  const customers = await Promise.all(rows.map(async (row) => {
    const tripStats = await db.prepare(`SELECT COUNT(*) AS tripCount, COALESCE(SUM(fare), 0) AS totalSpent FROM trips WHERE customer_id = ? AND status = 'completed'`).get(row.id);
    const serialized = serializeUser(row);
    return {
      ...serialized,
      tripCount: tripStats?.tripCount ?? 0,
      totalSpent: tripStats?.totalSpent ?? 0,
    };
  }));
  res.json({ customers });
});

router.post('/customers', async (req, res) => {
  const { name, phone, email, password = 'pass123', walletBalance = 0, referralCode } = req.body ?? {};
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone number are required' });

  const formattedPhone = formatPhone(phone);
  const existing = await db.prepare("SELECT id FROM users WHERE role = 'customer' AND phone = ?").get(formattedPhone);
  if (existing) return res.status(409).json({ error: 'A customer account with this phone number already exists' });

  const { hash, salt } = hashPassword(password);
  const id = makeId('cus');

  await db.prepare(
    `INSERT INTO users (id, role, name, phone, email, password_hash, password_salt, wallet_balance, referral_code)
     VALUES (?, 'customer', ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, formattedPhone, email ?? null, hash, salt, Number(walletBalance) || 0, referralCode ?? null);

  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.status(201).json({ customer: serializeUser(row) });
});

router.get('/customers/:id', async (req, res) => {
  const row = await db.prepare("SELECT * FROM users WHERE id = ? AND role = 'customer'").get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });

  const tripRows = await db.prepare('SELECT * FROM trips WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  const trips = await Promise.all(tripRows.map(async (r) => {
    const driver = r.driver_id ? await db.prepare('SELECT name FROM users WHERE id = ?').get(r.driver_id) : null;
    return serializeTripSummary(r, { driverName: driver?.name });
  }));

  const txnRows = await db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
  const transactions = txnRows.map(serializeTransaction);

  const stats = await db.prepare(`SELECT COUNT(*) AS tripCount, COALESCE(SUM(fare), 0) AS totalSpent FROM trips WHERE customer_id = ? AND status = 'completed'`).get(req.params.id);

  res.json({
    customer: {
      ...serializeUser(row),
      tripCount: stats?.tripCount ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
    },
    trips,
    transactions,
  });
});

router.patch('/customers/:id', async (req, res) => {
  const { name, phone, email, topUpAmount } = req.body ?? {};
  const row = await db.prepare("SELECT * FROM users WHERE id = ? AND role = 'customer'").get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });

  if (topUpAmount && Number(topUpAmount) > 0) {
    const amount = Number(topUpAmount);
    await db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, req.params.id);
    const txnId = makeId('txn');
    await db.prepare(
      `INSERT INTO transactions (id, user_id, direction, title, subtitle, amount, status)
       VALUES (?, ?, 'credit', 'Admin Top-Up', 'Added by Administrator', ?, 'success')`
    ).run(txnId, req.params.id, amount);
  }

  if (name || phone || email !== undefined) {
    const formattedPhone = phone ? formatPhone(phone) : null;
    await db.prepare(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?`
    ).run(name ?? null, formattedPhone, email ?? null, req.params.id);
  }

  const updated = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ customer: serializeUser(updated) });
});

// ---- DRIVERS ADMIN CREATION API ----

router.post('/drivers', async (req, res) => {
  const {
    name,
    phone,
    email,
    password = 'pass123',
    vehicleModel,
    plateNumber,
    truckTierId,
    verificationStatus = 'verified',
  } = req.body ?? {};

  if (!name || !phone) return res.status(400).json({ error: 'Name and phone number are required' });

  const formattedPhone = formatPhone(phone);
  const existing = await db.prepare("SELECT id FROM users WHERE role = 'driver' AND phone = ?").get(formattedPhone);
  if (existing) return res.status(409).json({ error: 'A driver account with this phone number already exists' });

  const { hash, salt } = hashPassword(password);
  const id = makeId('drv');
  const vStatus = verificationStatus || 'verified';

  await db.prepare(
    `INSERT INTO users (
      id, role, name, phone, email, password_hash, password_salt,
      vehicle_model, plate_number, truck_tier_id, verification_status, vehicle_verification_status
    ) VALUES (?, 'driver', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    formattedPhone,
    email ?? null,
    hash,
    salt,
    vehicleModel ?? null,
    plateNumber ?? null,
    truckTierId ?? null,
    vStatus,
    vStatus
  );

  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.status(201).json({ driver: serializeUser(row) });
});

export default router;
