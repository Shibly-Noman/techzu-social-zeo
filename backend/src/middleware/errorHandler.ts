import type { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

/** Central error handler: maps known errors to consistent JSON responses. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  // Invalid ObjectId in a route param
  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid id format' },
    });
  }

  // Duplicate key (unique index) — e.g. username/email already taken
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    const fields = Object.keys((err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {});
    return res.status(409).json({
      success: false,
      error: { message: `${fields.join(', ') || 'value'} already in use` },
    });
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: { message: 'Malformed JSON body' },
    });
  }

  console.error(`[error] ${req.method} ${req.path}:`, err);
  return res.status(500).json({
    success: false,
    error: {
      message:
        env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err instanceof Error
            ? err.message
            : 'Internal server error',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
}
