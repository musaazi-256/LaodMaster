import { Router } from 'express';
import { db, makeId } from '../db.js';
import { serializeTrip, serializeTripSummary } from '../lib/serialize.js';

const router = Router();

async function loadTripWithDriver(id) {
  const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) return null;
  const driverRow = trip.driver_id ? await db.prepare(`SELECT * FROM users WHERE id = ?`).get(trip.driver_id) : null;
  const customer = await db.prepare('SELECT name FROM users WHERE id = ?').get(trip.customer_id);
  return serializeTrip(trip, { driverRow, customerName: customer?.name });
}

router.post('/', async (req, res) => {
  const { customerId, origin, destination, cargoCategory, truckTierId, fare, paymentMethodId } = req.body ?? {};
  if (!customerId || !origin || !destination || !fare) return res.status(400).json({ error: 'customerId, origin, destination and fare are required' });

  const id = makeId('trip');
  await db.prepare(
    `INSERT INTO trips (id, customer_id, origin, destination, cargo_category, truck_tier_id, fare, payment_method_id, tracking_state, status, eta_minutes, distance_km)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'searching', 'requested', 8, 3.4)`
  ).run(id, customerId, origin, destination, cargoCategory ?? null, truckTierId ?? null, fare, paymentMethodId ?? null);

  res.status(201).json({ trip: await loadTripWithDriver(id) });
});

// The single pending request a driver would see next (first-come, first-served).
router.get('/next-request', async (_req, res) => {
  const trip = await db.prepare(`SELECT * FROM trips WHERE status = 'requested' AND driver_id IS NULL ORDER BY created_at ASC LIMIT 1`).get();
  res.json({ trip: trip ? await loadTripWithDriver(trip.id) : null });
});

router.get('/active', async (req, res) => {
  const { role, userId } = req.query;
  if (!role || !userId) return res.status(400).json({ error: 'role and userId are required' });

  const trip =
    role === 'driver'
      ? await db.prepare(`SELECT * FROM trips WHERE driver_id = ? AND status = 'accepted' ORDER BY created_at DESC LIMIT 1`).get(userId)
      : await db.prepare(`SELECT * FROM trips WHERE customer_id = ? AND status IN ('requested','accepted') ORDER BY created_at DESC LIMIT 1`).get(userId);

  res.json({ trip: trip ? await loadTripWithDriver(trip.id) : null });
});

router.get('/', async (req, res) => {
  const { role, userId } = req.query;
  if (!role || !userId) return res.status(400).json({ error: 'role and userId are required' });

  const rows =
    role === 'driver'
      ? await db.prepare(`SELECT * FROM trips WHERE driver_id = ? AND status IN ('completed','cancelled') ORDER BY created_at DESC`).all(userId)
      : await db.prepare(`SELECT * FROM trips WHERE customer_id = ? AND status IN ('completed','cancelled') ORDER BY created_at DESC`).all(userId);

  const trips = await Promise.all(rows.map(async (row) => {
    const driver = row.driver_id ? await db.prepare('SELECT name FROM users WHERE id = ?').get(row.driver_id) : null;
    const customer = await db.prepare('SELECT name FROM users WHERE id = ?').get(row.customer_id);
    return serializeTripSummary(row, { driverName: driver?.name, customerName: customer?.name });
  }));
  res.json({ trips });
});

router.get('/:id', async (req, res) => {
  const trip = await loadTripWithDriver(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json({ trip });
});

router.post('/:id/accept', async (req, res) => {
  const { driverId } = req.body ?? {};
  if (!driverId) return res.status(400).json({ error: 'driverId is required' });

  const result = await db.prepare(
    `UPDATE trips SET driver_id = ?, status = 'accepted', tracking_state = 'driver_approaching', eta_minutes = 6, distance_km = 2.1, updated_at = datetime('now')
     WHERE id = ? AND driver_id IS NULL AND status = 'requested'`
  ).run(driverId, req.params.id);

  if (result.changes === 0) return res.status(409).json({ error: 'This request was already taken or is no longer available' });
  res.json({ trip: await loadTripWithDriver(req.params.id) });
});

router.patch('/:id/tracking', async (req, res) => {
  const { trackingState } = req.body ?? {};
  if (!trackingState) return res.status(400).json({ error: 'trackingState is required' });
  await db.prepare(`UPDATE trips SET tracking_state = ?, updated_at = datetime('now') WHERE id = ?`).run(trackingState, req.params.id);
  res.json({ trip: await loadTripWithDriver(req.params.id) });
});

router.post('/:id/cancel', async (req, res) => {
  await db.prepare(`UPDATE trips SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ trip: await loadTripWithDriver(req.params.id) });
});

// The one authoritative completion event: sets the trip completed, and creates the
// real (simulated-payment, really-persisted) debit/credit transactions on both sides.
router.post('/:id/complete', async (req, res) => {
  const { rating } = req.body ?? {};
  const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!trip.driver_id) return res.status(400).json({ error: 'Trip has no driver assigned' });
  if (trip.status === 'completed') return res.json({ trip: await loadTripWithDriver(req.params.id) });

  await db.prepare(
    `UPDATE trips SET status = 'completed', tracking_state = 'completed', rating = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(rating ?? null, req.params.id);

  const driver = await db.prepare('SELECT * FROM users WHERE id = ?').get(trip.driver_id);
  const earnings = Math.round(trip.fare * 0.85);
  await db.prepare(`UPDATE users SET wallet_balance = wallet_balance + ?, trip_count = trip_count + 1 WHERE id = ?`).run(earnings, trip.driver_id);
  await db.prepare(
    `INSERT INTO transactions (id, user_id, trip_id, direction, title, subtitle, amount, status)
     VALUES (?, ?, ?, 'credit', ?, ?, ?, 'success')`
  ).run(makeId('txn'), trip.driver_id, trip.id, `Trip earnings — ${trip.destination}`, `Rated ${rating ?? 5}★`, earnings);

  let paymentMethod = null;
  if (trip.payment_method_id) {
    paymentMethod = await db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(trip.payment_method_id);
  }
  const paidByWallet = paymentMethod?.type === 'wallet';
  if (paidByWallet) {
    await db.prepare(`UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?`).run(trip.fare, trip.customer_id);
  }
  await db.prepare(
    `INSERT INTO transactions (id, user_id, trip_id, direction, title, subtitle, amount, status)
     VALUES (?, ?, ?, 'debit', ?, ?, ?, 'success')`
  ).run(makeId('txn'), trip.customer_id, trip.id, `Trip to ${trip.destination}`, paymentMethod?.label ?? 'Cash', trip.fare);

  res.json({ trip: await loadTripWithDriver(req.params.id) });
});

export default router;
