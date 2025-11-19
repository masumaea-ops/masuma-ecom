
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// In a real app, use jsonwebtoken library. 
// For this demo, we'll simulate checking a header 'x-api-key' or a mock token.
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // For development convenience, if no header is present, we might skip or error.
    // Strictly enforcing 401 for enterprise apps.
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  // Mock Token Verification Logic
  // In production: const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const token = authHeader.split(' ')[1];
  
  try {
    // Simulating a DB lookup based on a mock token (e.g., assuming token is user ID for demo)
    // Replace this with actual JWT decoding
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ 
        where: { id: token }, // In real world, decode JWT to get ID
        relations: ['branch']
    });

    if (!user) {
       // Fallback for demo purposes if we haven't seeded users
       if (token === 'demo-admin-token') {
         req.user = { id: 'admin', role: 'ADMIN', branch: { id: 'hq' } } as any;
         return next();
       }
       return res.status(401).json({ error: 'Invalid Token' });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled' });
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
