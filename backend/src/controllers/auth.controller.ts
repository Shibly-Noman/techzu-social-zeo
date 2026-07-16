import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type IUser } from '../models/user.model';
import { ApiError } from '../utils/apiError';

function issueToken(user: IUser): string {
  return jwt.sign({ sub: user._id.toString(), username: user.username }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export async function signup(req: Request, res: Response) {
  const { username, email, password } = req.body as {
    username: string;
    email: string;
    password: string;
  };

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    throw ApiError.conflict(
      existing.username === username ? 'Username already taken' : 'Email already registered'
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, passwordHash });

  res.status(201).json({ success: true, data: { token: issueToken(user), user } });
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body as { identifier: string; password: string };

  const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  res.json({ success: true, data: { token: issueToken(user), user } });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  res.json({ success: true, data: { user } });
}
