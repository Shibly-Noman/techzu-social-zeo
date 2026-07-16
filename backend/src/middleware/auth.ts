import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface JwtPayload {
  sub: string;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
      username: string;
    }
  }
}

/** Verifies the `Authorization: Bearer <token>` header and attaches the user to the request. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing Bearer token');
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as JwtPayload;
    req.userId = payload.sub;
    req.username = payload.username;
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}
