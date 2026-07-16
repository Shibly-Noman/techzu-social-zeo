import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { fcmTokenSchema } from '../schemas';

const router = Router();

router.put('/me/fcm-token', requireAuth, validate(fcmTokenSchema), users.registerFcmToken);
router.delete('/me/fcm-token', requireAuth, validate(fcmTokenSchema), users.removeFcmToken);

export default router;
