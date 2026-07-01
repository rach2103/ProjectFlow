import { Request, Response } from 'express';
import { TimeLog } from '../models/TimeLog.model';
import { Task } from '../models/Task.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import mongoose from 'mongoose';

/**
 * GET /api/time-logs
 * Retrieves time logs, optionally filtered by project, task, or user.
 */
export const getTimeLogs = async (req: Request, res: Response): Promise<void> => {
  const { projectId, taskId, userId, dateFrom, dateTo } = req.query;

  const query: Record<string, any> = { endTime: { $ne: null } }; // Only completed entries

  if (projectId) {
    query.project = projectId;
  }
  if (taskId) {
    query.task = taskId;
  }
  if (userId) {
    query.user = userId;
  } else if (req.user!.role !== 'admin') {
    // Regular users see their own logs by default unless filtering by project
    if (!projectId) {
      query.user = req.user!.userId;
    }
  }

  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = new Date(dateFrom as string);
    if (dateTo) query.date.$lte = new Date(dateTo as string);
  }

  const logs = await TimeLog.find(query)
    .populate('task', 'title key')
    .populate('project', 'name key')
    .populate('user', 'firstName lastName email avatar role')
    .sort({ date: -1, createdAt: -1 });

  sendSuccess(res, 'Time logs retrieved successfully', logs);
};

/**
 * GET /api/time-logs/active
 * Finds the currently running timer for the authenticated user.
 */
export const getActiveTimer = async (req: Request, res: Response): Promise<void> => {
  const activeLog = await TimeLog.findOne({
    user: req.user!.userId,
    endTime: null,
  })
    .populate('task', 'title key')
    .populate('project', 'name key');

  if (!activeLog) {
    sendSuccess(res, 'No active timer found', null);
    return;
  }

  sendSuccess(res, 'Active timer retrieved successfully', activeLog);
};

/**
 * POST /api/time-logs/start
 * Starts a live timer. Stops any running timers first.
 */
export const startTimer = async (req: Request, res: Response): Promise<void> => {
  const { taskId, description } = req.body;

  if (!taskId) {
    sendError(res, 'Task ID is required to start timer', 400);
    return;
  }

  const task = await Task.findById(taskId);
  if (!task) {
    sendError(res, 'Task not found', 404);
    return;
  }

  // Stop any active timer first
  const activeTimer = await TimeLog.findOne({
    user: req.user!.userId,
    endTime: null,
  });

  if (activeTimer) {
    activeTimer.endTime = new Date();
    const msDiff = activeTimer.endTime.getTime() - activeTimer.startTime.getTime();
    activeTimer.duration = Math.round(msDiff / 1000 / 60); // minutes
    await activeTimer.save();

    // Increment task actual hours
    const hours = activeTimer.duration / 60;
    await Task.findByIdAndUpdate(activeTimer.task, {
      $inc: { actualHours: hours },
    });
  }

  // Start new timer
  const newTimer = new TimeLog({
    task: taskId,
    project: task.project,
    user: req.user!.userId,
    description,
    startTime: new Date(),
    isManual: false,
    date: new Date(),
  });

  await newTimer.save();

  sendSuccess(res, 'Timer started successfully', newTimer, 201);
};

/**
 * POST /api/time-logs/stop
 * Stops the running timer and aggregates task actual hours.
 */
export const stopTimer = async (req: Request, res: Response): Promise<void> => {
  const activeTimer = await TimeLog.findOne({
    user: req.user!.userId,
    endTime: null,
  });

  if (!activeTimer) {
    sendError(res, 'No active timer running', 400);
    return;
  }

  activeTimer.endTime = new Date();
  const msDiff = activeTimer.endTime.getTime() - activeTimer.startTime.getTime();
  activeTimer.duration = Math.max(1, Math.round(msDiff / 1000 / 60)); // minimum 1 minute
  await activeTimer.save();

  // Increment task actual hours
  const hours = Number((activeTimer.duration / 60).toFixed(2));
  await Task.findByIdAndUpdate(activeTimer.task, {
    $inc: { actualHours: hours },
  });

  sendSuccess(res, 'Timer stopped successfully', activeTimer);
};

/**
 * POST /api/time-logs/manual
 * Logs time manually.
 */
export const logTimeManually = async (req: Request, res: Response): Promise<void> => {
  const { taskId, description, date, hours } = req.body;

  if (!taskId || !hours || hours <= 0) {
    sendError(res, 'Task ID and positive hours are required', 400);
    return;
  }

  const task = await Task.findById(taskId);
  if (!task) {
    sendError(res, 'Task not found', 404);
    return;
  }

  const durationMinutes = Math.round(hours * 60);
  const logDate = date ? new Date(date) : new Date();

  // startTime / endTime mock estimation
  const startTime = new Date(logDate);
  const endTime = new Date(logDate.getTime() + durationMinutes * 60 * 1000);

  const timeLog = new TimeLog({
    task: taskId,
    project: task.project,
    user: req.user!.userId,
    description,
    startTime,
    endTime,
    duration: durationMinutes,
    isManual: true,
    date: logDate,
  });

  await timeLog.save();

  // Update task hours
  task.actualHours = (task.actualHours || 0) + Number(hours);
  await task.save();

  sendSuccess(res, 'Time logged successfully', timeLog, 201);
};

/**
 * DELETE /api/time-logs/:id
 * Deletes a time log and subtracts hours from the task.
 */
export const deleteTimeLog = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const log = await TimeLog.findById(id);
  if (!log) {
    sendError(res, 'Time log not found', 404);
    return;
  }

  // Permission Check
  if (req.user!.role !== 'admin' && log.user.toString() !== req.user!.userId) {
    sendError(res, 'Access denied. You can only delete your own time logs.', 403);
    return;
  }

  await TimeLog.findByIdAndDelete(id);

  // Decrement task actual hours
  if (log.duration) {
    const hours = log.duration / 60;
    await Task.findByIdAndUpdate(log.task, {
      $inc: { actualHours: -hours },
    });
  }

  sendSuccess(res, 'Time log deleted successfully');
};
