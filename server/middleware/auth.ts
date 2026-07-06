import { Request, Response, NextFunction } from 'express';
import { db, User } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const userId = authHeader.split(' ')[1];
  const user = db.users.findById(userId);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User not found' });
    return;
  }

  req.user = user;
  next();
}
