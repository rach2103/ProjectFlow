import { Request, Response } from 'express';
import { Comment } from '../models/Comment.model';
import { Task } from '../models/Task.model';
import { Notification } from '../models/Notification.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { emitToTask, emitToUser } from '../sockets/socket.server';
import mongoose from 'mongoose';

/**
 * GET /api/comments/task/:taskId
 * Retrieves all comments for a specific task.
 */
export const getCommentsByTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;

  const comments = await Comment.find({ task: taskId })
    .populate('author', 'firstName lastName email avatar role')
    .sort({ createdAt: 1 });

  sendSuccess(res, 'Comments retrieved successfully', comments);
};

/**
 * POST /api/comments
 * Adds a new comment to a task and sends notifications to mentions/assignee.
 */
export const addComment = async (req: Request, res: Response): Promise<void> => {
  const { content, taskId, mentions } = req.body;

  if (!content || !taskId) {
    sendError(res, 'Comment content and task ID are required', 400);
    return;
  }

  const task = await Task.findById(taskId).populate('project');
  if (!task) {
    sendError(res, 'Task not found', 404);
    return;
  }

  const comment = new Comment({
    content,
    task: taskId,
    project: task.project._id,
    author: req.user!.userId,
    mentions: mentions || [],
  });

  await comment.save();

  // Populate author details
  const populatedComment = await Comment.findById(comment._id)
    .populate('author', 'firstName lastName email avatar role');

  // Notify socket room
  const io = req.app.get('io');
  if (io) {
    emitToTask(io, taskId, 'comment:created', populatedComment);
  }

  // Create Notifications
  const notifyUserIds = new Set<string>();

  // 1. Mentions
  if (mentions && Array.isArray(mentions)) {
    mentions.forEach((mId) => {
      if (mId !== req.user!.userId) {
        notifyUserIds.add(mId.toString());
      }
    });
  }

  // 2. Task Assignees
  task.assignees.forEach((aId) => {
    if (aId.toString() !== req.user!.userId) {
      notifyUserIds.add(aId.toString());
    }
  });

  // Save in-app notifications
  if (notifyUserIds.size > 0) {
    const notifyArray = Array.from(notifyUserIds);
    const notifications = notifyArray.map((recipientId) => {
      const type = (mentions && mentions.includes(recipientId)) ? 'mention' : 'comment_added';
      const title = type === 'mention' ? 'Mentioned in Comment' : 'New Comment on Task';
      const message = type === 'mention'
        ? `You were mentioned in a comment on task "${task.title}".`
        : `A comment was added to your task "${task.title}".`;

      return new Notification({
        recipient: recipientId,
        sender: req.user!.userId,
        type,
        title,
        message,
        link: `/tasks/${task._id}`,
      });
    });

    await Notification.insertMany(notifications);

    // Send via socket
    if (io) {
      notifications.forEach((notif) => {
        emitToUser(io, notif.recipient.toString(), 'notification', notif);
      });
    }
  }

  sendSuccess(res, 'Comment added successfully', populatedComment, 201);
};

/**
 * DELETE /api/comments/:id
 * Deletes a comment.
 */
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const comment = await Comment.findById(id);
  if (!comment) {
    sendError(res, 'Comment not found', 404);
    return;
  }

  // Permission Check
  if (req.user!.role !== 'admin' && comment.author.toString() !== req.user!.userId) {
    sendError(res, 'Access denied. You can only delete your own comments.', 403);
    return;
  }

  await Comment.findByIdAndDelete(id);

  const io = req.app.get('io');
  if (io && comment.task) {
    emitToTask(io, comment.task.toString(), 'comment:deleted', { id });
  }

  sendSuccess(res, 'Comment deleted successfully');
};
