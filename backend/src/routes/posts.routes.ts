import { Router } from 'express';
import * as posts from '../controllers/posts.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentSchema, createPostSchema, feedQuerySchema, paginationSchema } from '../schemas';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createPostSchema), posts.createPost);
router.get('/', validate(feedQuerySchema, 'query'), posts.getFeed);
router.get('/:id', posts.getPost);
router.post('/:id/like', posts.toggleLike);
router.post('/:id/comment', validate(createCommentSchema), posts.addComment);
router.get('/:id/comments', validate(paginationSchema, 'query'), posts.getComments);

export default router;
