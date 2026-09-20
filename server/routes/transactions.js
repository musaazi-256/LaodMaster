import { Router } from 'express';
import { db, makeId } from '../db.js';
import { serializeTransaction } from '../lib/serialize.js';

const router = Router();

router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const rows = await db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  res.json({ transactions: rows.map(serializeTransaction) });
});

router.get('/:id', async (req, res) => {
  const row = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ transaction: serializeTransaction(row) });
});

// Wallet top-up — the money movement is simulated (no real mobile-money gateway),
// but the resulting transaction row and wallet balance are real and persisted.
router.post('/topup', async (req, res) => {
  const { userId, amount, method } = req.body ?? {};
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount are required' });

  const id = makeId('txn');
  await db.prepare(
    `INSERT INTO transactions (id, user_id, direction, title, subtitle, amount, status) VALUES (?, ?, 'credit', 'Wallet top-up', ?, ?, 'success')`
  ).run(id, userId, method ?? 'Mobile Money', amount);
  await db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(amount, userId);

  res.status(201).json({ transaction: serializeTransaction(await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)) });
});

// Driver withdrawal — simulated payout rail, but a real debit against a real balance.
router.post('/withdraw', async (req, res) => {
  const { userId, amount, method } = req.body ?? {};
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount are required' });

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.wallet_balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  const id = makeId('txn');
  await db.prepare(
    `INSERT INTO transactions (id, user_id, direction, title, subtitle, amount, status) VALUES (?, ?, 'debit', 'Withdrawal', ?, ?, 'success')`
  ).run(id, userId, method ?? 'Mobile Money', amount);
  await db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(amount, userId);

  res.status(201).json({ transaction: serializeTransaction(await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)) });
});

// Admin-issued refund: marks the original transaction refunded and credits the user back.
router.post('/:id/refund', async (req, res) => {
  const original = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!original) return res.status(404).json({ error: 'Transaction not found' });
  if (original.status === 'refunded') return res.json({ transaction: serializeTransaction(original) });

  await db.prepare(`UPDATE transactions SET status = 'refunded' WHERE id = ?`).run(req.params.id);
  const refundId = makeId('txn');
  await db.prepare(
    `INSERT INTO transactions (id, user_id, trip_id, direction, title, subtitle, amount, status)
     VALUES (?, ?, ?, 'credit', ?, 'Refund issued by admin', ?, 'success')`
  ).run(refundId, original.user_id, original.trip_id, `Refund — ${original.title}`, original.amount);
  await db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(original.amount, original.user_id);

  res.json({ transaction: serializeTransaction(await db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id)) });
});

export default router;
