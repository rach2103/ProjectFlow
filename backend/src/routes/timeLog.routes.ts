import { Router } from 'express';
import {
  getTimeLogs,
  getActiveTimer,
  startTimer,
  stopTimer,
  logTimeManually,
  deleteTimeLog,
} from '../controllers/timeLog.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTimeLogs);
router.get('/active', getActiveTimer);
router.post('/start', startTimer);
router.post('/stop', stopTimer);
router.post('/manual', logTimeManually);
router.delete('/:id', deleteTimeLog);

export default router;
