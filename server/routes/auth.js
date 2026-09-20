import { Router } from 'express';
import { db, makeId } from '../db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { serializeUser } from '../lib/serialize.js';

const router = Router();

router.post('/signup', async (req, res) => {
  const { role, name, phone, password, email, referralCode } = req.body ?? {};
  if (!['customer', 'driver'].includes(role)) return res.status(400).json({ error: 'role must be customer or driver' });
  if (!name || !phone || !password) return res.status(400).json({ error: 'name, phone and password are required' });

  const existing = await db.prepare('SELECT id FROM users WHERE role = ? AND phone = ?').get(role, phone);
  if (existing) return res.status(409).json({ error: 'An account with this phone number already exists' });

  const { hash, salt } = hashPassword(password);
  const id = makeId(role === 'driver' ? 'drv' : 'cus');

  await db.prepare(
    `INSERT INTO users (id, role, name, phone, email, password_hash, password_salt, referral_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, role, name, phone, email ?? null, hash, salt, referralCode ?? null);

  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.status(201).json({ user: serializeUser(row) });
});

router.post('/login', async (req, res) => {
  const { role, phone, password } = req.body ?? {};
  if (!['customer', 'driver'].includes(role)) return res.status(400).json({ error: 'role must be customer or driver' });

  // Handle demo credential overrides for 712345001 (Driver) & 712345002 (Customer)
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
  if (cleanPhone.endsWith('712345001') && (password === 'pass123' || !password)) {
    const { hash, salt } = hashPassword('pass123');
    const id = 'drv_demo_712345001';
    await db.prepare(
      `INSERT OR REPLACE INTO users (id, role, name, phone, email, password_hash, password_salt, vehicle_model, plate_number, truck_tier_id, verification_status, vehicle_verification_status, is_online, rating, trip_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, 'driver', 'Ahmed Hassan', phone, 'ahmed@loadmaster.ug', hash, salt, 'Isuzu NPR', 'UAW 123X', 'medium', 'verified', 'verified', 1, 4.8, 12);
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return res.json({ user: serializeUser(row) });
  }

  if (cleanPhone.endsWith('712345002') && (password === 'pass123' || !password)) {
    const { hash, salt } = hashPassword('pass123');
    const id = 'cus_demo_712345002';
    await db.prepare(
      `INSERT OR REPLACE INTO users (id, role, name, phone, email, password_hash, password_salt, wallet_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, 'customer', 'John Doe', phone, 'john@loadmaster.ug', hash, salt, 500000);
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return res.json({ user: serializeUser(row) });
  }

  let row = await db.prepare('SELECT * FROM users WHERE role = ? AND phone = ?').get(role, phone);

  if (!row) {
    const otherRole = role === 'customer' ? 'driver' : 'customer';
    const otherRow = await db.prepare('SELECT * FROM users WHERE role = ? AND phone = ?').get(otherRole, phone);
    if (otherRow) {
      return res.status(401).json({
        error: `This account is registered as a ${otherRole === 'driver' ? 'Driver' : 'Customer'}. Please switch to the ${otherRole === 'driver' ? 'Driver' : 'Customer'} tab.`,
      });
    }
    return res.status(401).json({ error: 'Incorrect phone number or password' });
  }

  if (!verifyPassword(password ?? '', row.password_hash, row.password_salt)) {
    return res.status(401).json({ error: 'Incorrect phone number or password' });
  }
  res.json({ user: serializeUser(row) });
});

router.delete('/account', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  await db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.status(204).end();
});

router.get('/me', (req, res) => {
  // req.user is attached by the auth middleware in index.js from the x-user-id header
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user: serializeUser(req.user) });
});

export default router;
