import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare global { namespace Express { interface Request { userId?: number } } }
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Please log in to continue.' });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is missing');
    const payload = jwt.verify(header.slice(7), secret) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch { return res.status(401).json({ message: 'Session expired or token is invalid.' }); }
}
