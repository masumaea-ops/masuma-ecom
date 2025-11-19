
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Security } from '../utils/security';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const payload = Security.verifyToken(token);
    
    if (!payload) {
         // Fallback for demo purposes (offline mode)
         if (token === 'mock-admin-token') {
             req.user = { id: 'admin', role: 'ADMIN', branch: { id: 'hq' } } as any;
             return next();
         }
         return res.status(401).json({ error: 'Invalid or Expired Token' });
    }

    // Optional: Fetch full user from DB if needed, or just use payload for speed
    // For critical actions, fetching ensures role/active status is fresh
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ 
        where: { id: payload.id },
        relations: ['branch']
    });

    if (!user || !user.isActive) {
        return res.status(403).json({ error: 'Account is disabled or not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};
