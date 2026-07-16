import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, signupSchema } from '../schemas';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many attempts, try again later' } },
});

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), auth.signup);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.get('/me', requireAuth, auth.me);

export default router;
