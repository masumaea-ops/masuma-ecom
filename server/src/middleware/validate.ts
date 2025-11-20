import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema<any>) => 
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.issues.map((e: any) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return res.status(400).json({ error: 'Invalid input data' });
    }
  };