import { Router } from 'express';
import {
  getExpensesByProject,
  addExpense,
  deleteExpense,
} from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', getExpensesByProject);
router.post('/', addExpense);
router.delete('/:id', deleteExpense);

export default router;
