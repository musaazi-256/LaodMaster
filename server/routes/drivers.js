import { Router } from 'express';
import { db, makeId } from '../db.js';
import { serializeUser, serializeDocument } from '../lib/serialize.js';

const router = Router();

router.get('/', async (_req, res) => {
  const rows = await db.prepare(`SELECT * FROM users WHERE role = 'driver' ORDER BY created_at DESC`).all();
  res.json({ drivers: rows.map(serializeUser) });
});

router.get('/:id', async (req, res) => {
  const row = await db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'driver'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Driver not found' });
  const documents = await db.prepare('SELECT * FROM driver_documents WHERE driver_id = ?').all(req.params.id);
  res.json({ driver: serializeUser(row), documents: documents.map(serializeDocument) });
});

// Step 1 of registration: vehicle details.
router.post('/:id/vehicle', async (req, res) => {
  const { vehicleModel, plateNumber, truckTierId } = req.body ?? {};
  if (!vehicleModel || !plateNumber || !truckTierId) return res.status(400).json({ error: 'vehicleModel, plateNumber and truckTierId are required' });
  await db.prepare(`UPDATE users SET vehicle_model = ?, plate_number = ?, truck_tier_id = ? WHERE id = ? AND role = 'driver'`)
    .run(vehicleModel, plateNumber, truckTierId, req.params.id);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ driver: serializeUser(row) });
});

// Step 2: document upload (simulated file, real persisted status per Section on payments/documents).
router.post('/:id/documents', async (req, res) => {
  const { docType, fileName } = req.body ?? {};
  if (!docType) return res.status(400).json({ error: 'docType is required' });
  const id = makeId('doc');
  await db.prepare(
    `INSERT INTO driver_documents (id, driver_id, doc_type, status, file_name)
     VALUES (?, ?, ?, 'uploaded', ?)
     ON CONFLICT(driver_id, doc_type) DO UPDATE SET status = 'uploaded', file_name = excluded.file_name`
  ).run(id, req.params.id, docType, fileName ?? `${docType}.pdf`);
  const documents = await db.prepare('SELECT * FROM driver_documents WHERE driver_id = ?').all(req.params.id);
  res.json({ documents: documents.map(serializeDocument) });
});

// Step 3: submit for review — moves both statuses to 'pending'.
router.post('/:id/submit', async (req, res) => {
  await db.prepare(
    `UPDATE users SET verification_status = 'pending', vehicle_verification_status = 'pending' WHERE id = ? AND role = 'driver'`
  ).run(req.params.id);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ driver: serializeUser(row) });
});

// Admin approves/rejects — this is what makes the approval genuinely "stick".
router.patch('/:id/verify', async (req, res) => {
  const { status } = req.body ?? {};
  if (!['verified', 'pending', 'unverified', 'rejected'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  await db.prepare(
    `UPDATE users SET verification_status = ?, vehicle_verification_status = ? WHERE id = ? AND role = 'driver'`
  ).run(status, status, req.params.id);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ driver: serializeUser(row) });
});

router.patch('/:id/online', async (req, res) => {
  const { isOnline } = req.body ?? {};
  await db.prepare(`UPDATE users SET is_online = ? WHERE id = ? AND role = 'driver'`).run(isOnline ? 1 : 0, req.params.id);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ driver: serializeUser(row) });
});

router.patch('/:id/profile', async (req, res) => {
  const { name, phone } = req.body ?? {};
  await db.prepare(`UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ? AND role = 'driver'`)
    .run(name ?? null, phone ?? null, req.params.id);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ driver: serializeUser(row) });
});

export default router;
