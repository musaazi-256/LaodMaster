import { Router } from 'express';
import { db, makeId } from '../db.js';
import { serializePaymentMethod } from '../lib/serialize.js';

const router = Router();

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const rows = await db.prepare('SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at ASC').all(userId);
  res.json({ paymentMethods: rows.map(serializePaymentMethod) });
});

router.post('/', async (req, res) => {
  const { userId, type, label, detail } = req.body ?? {};
  if (!userId || !type || !label) return res.status(400).json({ error: 'userId, type and label are required' });

  const existingCount = (await db.prepare('SELECT COUNT(*) AS n FROM payment_methods WHERE user_id = ?').get(userId)).n;
  const id = makeId('pm');
  await db.prepare(
    `INSERT INTO payment_methods (id, user_id, type, label, detail, is_default) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, type, label, detail ?? null, existingCount === 0 ? 1 : 0);

  const rows = await db.prepare('SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at ASC').all(userId);
  res.status(201).json({ paymentMethods: rows.map(serializePaymentMethod) });
});

export default router;
