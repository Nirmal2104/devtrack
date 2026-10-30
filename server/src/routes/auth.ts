import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db';

const router = Router();
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(255), password: z.string().min(8).max(100) });
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(100) });
function tokenFor(userId: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  return jwt.sign({ userId }, secret, { expiresIn: '1d' });
}
router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Enter a name, valid email, and password of at least 8 characters.' });
    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [name, email.toLowerCase(), passwordHash]);
    const user = result.rows[0];
    return res.status(201).json({ token: tokenFor(user.id), user });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' });
    next(err);
  }
});
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });
    const { email, password } = parsed.data;
    const result = await pool.query('SELECT id,name,email,password_hash FROM users WHERE email=$1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    return res.json({ token: tokenFor(user.id), user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});
export default router;
