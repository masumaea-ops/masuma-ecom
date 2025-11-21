import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema<any>) => 
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const request = req as any;
    const response = res as any;
    try {
      await schema.parseAsync({
        body: request.body,
        query: request.query,
        params: request.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return response.status(400).json({
          error: 'Validation Error',
          details: error.issues.map((e: any) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return response.status(400).json({ error: 'Invalid input data' });
    }
  };