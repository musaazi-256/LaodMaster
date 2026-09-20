import { Router } from 'express';
import { db } from '../db.js';
import { serializeUser } from '../lib/serialize.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const row = await db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'customer'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Customer not found' });
  res.json({ customer: serializeUser(row) });
});

router.patch('/:id/profile', async (req, res) => {
  const { name, phone, email } = req.body ?? {};
  await db.prepare(`UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ? AND role = 'customer'`)
    .run(name ?? null, phone ?? null, email ?? null, req.params.id);
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ customer: serializeUser(row) });
});

export default router;
