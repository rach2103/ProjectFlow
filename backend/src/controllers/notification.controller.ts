import { Request, Response } from 'express';
import { Notification } from '../models/Notification.model';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * GET /api/notifications
 * Retrieves all notifications for the authenticated user.
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const notifications = await Notification.find({ recipient: req.user!.userId })
    .populate('sender', 'firstName lastName avatar role')
    .sort({ createdAt: -1 })
    .limit(50); // Get latest 50 notifications

  sendSuccess(res, 'Notifications retrieved successfully', notifications);
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read.
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user!.userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    sendError(res, 'Notification not found or access denied', 404);
    return;
  }

  sendSuccess(res, 'Notification marked as read successfully', notification);
};

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications of the user as read.
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  await Notification.updateMany(
    { recipient: req.user!.userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  sendSuccess(res, 'All notifications marked as read successfully');
};

/**
 * DELETE /api/notifications/:id
 * Deletes a notification.
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await Notification.findOneAndDelete({
    _id: id,
    recipient: req.user!.userId,
  });

  if (!result) {
    sendError(res, 'Notification not found or access denied', 404);
    return;
  }

  sendSuccess(res, 'Notification deleted successfully');
};

/**
 * DELETE /api/notifications
 * Deletes all notifications for the user.
 */
export const clearAllNotifications = async (req: Request, res: Response): Promise<void> => {
  await Notification.deleteMany({ recipient: req.user!.userId });
  sendSuccess(res, 'All notifications cleared successfully');
};
