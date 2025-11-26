
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export const errorHandler = (err: any, req: any, res: any, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error details
  logger.error(`Request Failed: ${req.method} ${req.originalUrl}`, {
    error: message,
    stack: err.stack,
    body: req.body // Log body to help debug (ensure passwords are sanitized in production logger)
  });

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
