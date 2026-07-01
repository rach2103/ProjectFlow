import { Router } from 'express';
import {
  getCommentsByTask,
  addComment,
  deleteComment,
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', getCommentsByTask);
router.post('/', addComment);
router.delete('/:id', deleteComment);

export default router;
