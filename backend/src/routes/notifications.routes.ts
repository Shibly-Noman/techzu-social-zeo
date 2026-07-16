import { Router } from 'express';
import * as notifications from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paginationSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.get('/', validate(paginationSchema, 'query'), notifications.getNotifications);
router.post('/mark-read', notifications.markAllRead);

export default router;
