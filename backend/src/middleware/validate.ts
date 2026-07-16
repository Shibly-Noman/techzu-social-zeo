import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError';

type Target = 'body' | 'query' | 'params';

/** Validates and normalizes a request segment against a Zod schema. */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      throw ApiError.badRequest('Validation failed', details);
    }
    // Express 5 exposes `query` via a getter, so assign parsed values onto a
    // dedicated property instead of overwriting req.query.
    if (target === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[target] = result.data;
    }
    next();
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validatedQuery?: unknown;
    }
  }
}
