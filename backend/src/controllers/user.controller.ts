import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { cloudinary } from '../config/cloudinary';
import { logger } from '../utils/logger';

/**
 * GET /api/users/profile
 * Returns the authenticated user's full profile.
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, 'Profile retrieved successfully', user);
};

/**
 * PATCH /api/users/profile
 * Updates the authenticated user's profile fields.
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const allowedFields = [
    'firstName',
    'lastName',
    'bio',
    'phone',
    'department',
    'jobTitle',
    'timezone',
    'notifications',
  ];

  const updates: Record<string, any> = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user!.userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, 'Profile updated successfully', user);
};

/**
 * POST /api/users/avatar
 * Uploads and updates the user's profile picture via Cloudinary.
 */
export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    sendError(res, 'No image file provided', 400);
    return;
  }

  const user = await User.findById(req.user!.userId);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  // Delete old avatar from Cloudinary if it exists
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId).catch((err) => {
      logger.warn(`Failed to delete old avatar: ${err.message}`);
    });
  }

  // Upload new avatar to Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'pms/avatars',
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  user.avatar = result.secure_url;
  user.avatarPublicId = result.public_id;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 'Avatar uploaded successfully', {
    avatar: user.avatar,
  });
};

/**
 * DELETE /api/users/avatar
 * Removes the user's profile picture.
 */
export const deleteAvatar = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId).catch((err) => {
      logger.warn(`Failed to delete avatar from Cloudinary: ${err.message}`);
    });
  }

  user.avatar = undefined;
  user.avatarPublicId = undefined;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 'Avatar removed successfully');
};

/**
 * GET /api/users
 * Returns a paginated list of all users (Admin only).
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  sendSuccess(
    res,
    'Users retrieved successfully',
    users,
    200,
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

/**
 * GET /api/users/:id
 * Returns a specific user by ID (Admin or self).
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  // Non-admin users can only view their own profile
  if (req.user!.role !== 'admin' && req.user!.userId !== req.params.id) {
    sendError(res, 'Access denied', 403);
    return;
  }

  sendSuccess(res, 'User retrieved successfully', user);
};

/**
 * PATCH /api/users/:id/role
 * Updates a user's role (Admin only).
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  const { role } = req.body;

  if (!role) {
    sendError(res, 'Role is required', 400);
    return;
  }

  const validRoles = ['admin', 'project_manager', 'team_lead', 'developer', 'client'];
  if (!validRoles.includes(role)) {
    sendError(res, 'Invalid role', 400);
    return;
  }

  // Prevent self-role modification
  if (req.params.id === req.user!.userId) {
    sendError(res, 'You cannot change your own role', 400);
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, `User role updated to ${role}`, user);
};

/**
 * PATCH /api/users/:id/status
 * Activates or deactivates a user account (Admin only).
 */
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  if (req.params.id === req.user!.userId) {
    sendError(res, 'You cannot deactivate your own account', 400);
    return;
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  sendSuccess(
    res,
    `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    { isActive: user.isActive }
  );
};
