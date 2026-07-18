import { Router } from 'express';
import * as comments from '../controllers/comments.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paginationSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.post('/:commentId/like', comments.toggleCommentLike);
router.get('/:commentId/replies', validate(paginationSchema, 'query'), comments.getReplies);

export default router;
