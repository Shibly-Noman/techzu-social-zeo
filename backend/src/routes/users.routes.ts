import { Router } from 'express';
import * as users from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { fcmTokenSchema, userSearchSchema, usernameParamSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/search', validate(userSearchSchema, 'query'), users.searchUsers);
router.put('/me/fcm-token', validate(fcmTokenSchema), users.registerFcmToken);
router.delete('/me/fcm-token', validate(fcmTokenSchema), users.removeFcmToken);
// Must come after the more specific routes above — this is a catch-all single segment.
router.get('/:username', validate(usernameParamSchema, 'params'), users.getUserProfile);

export default router;
