import { Router } from 'express';
import { getDocuments } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getDocuments);

export default router;
