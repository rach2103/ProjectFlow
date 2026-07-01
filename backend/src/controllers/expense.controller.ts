import { Request, Response } from 'express';
import { Expense } from '../models/Expense.model';
import { Project } from '../models/Project.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import mongoose from 'mongoose';

/**
 * GET /api/expenses/project/:projectId
 * Retrieves all expenses for a project.
 */
export const getExpensesByProject = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;

  const expenses = await Expense.find({ project: projectId })
    .populate('recordedBy', 'firstName lastName email')
    .sort({ date: -1 });

  sendSuccess(res, 'Expenses retrieved successfully', expenses);
};

/**
 * POST /api/expenses
 * Logs an expense for a project and updates project spent amount.
 */
export const addExpense = async (req: Request, res: Response): Promise<void> => {
  const { projectId, amount, category, description, date } = req.body;

  if (!projectId || amount === undefined || !category || !description) {
    sendError(res, 'Project ID, amount, category, and description are required', 400);
    return;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    sendError(res, 'Project not found', 404);
    return;
  }

  // Permission check
  const isMember = project.members.some((m) => m.user.toString() === req.user!.userId);
  if (req.user!.role !== 'admin' && !isMember) {
    sendError(res, 'Access denied. You are not a member of this project.', 403);
    return;
  }

  const expense = new Expense({
    project: projectId,
    amount,
    category,
    description,
    date: date ? new Date(date) : new Date(),
    recordedBy: req.user!.userId,
  });

  await expense.save();

  // Increment project spent
  project.spent = (project.spent || 0) + Number(amount);
  await project.save();

  const populatedExpense = await Expense.findById(expense._id)
    .populate('recordedBy', 'firstName lastName email');

  sendSuccess(res, 'Expense added successfully', populatedExpense, 201);
};

/**
 * DELETE /api/expenses/:id
 * Deletes an expense and subtracts amount from project spent budget.
 */
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const expense = await Expense.findById(id);
  if (!expense) {
    sendError(res, 'Expense not found', 404);
    return;
  }

  const project = await Project.findById(expense.project);
  if (project) {
    // Permission check
    const isPM = project.projectManager.toString() === req.user!.userId ||
                 project.members.some((m) => m.user.toString() === req.user!.userId && m.role === 'project_manager');
    if (req.user!.role !== 'admin' && !isPM) {
      sendError(res, 'Access denied. Only project managers can delete expenses.', 403);
      return;
    }

    // Decrement project spent
    project.spent = Math.max(0, (project.spent || 0) - expense.amount);
    await project.save();
  }

  await Expense.findByIdAndDelete(id);

  sendSuccess(res, 'Expense deleted successfully');
};
