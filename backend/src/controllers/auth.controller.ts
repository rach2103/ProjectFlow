import { Request, Response } from 'express';
import { User } from '../models/User.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} from '../utils/jwt';
import {
  sendSuccess,
  sendError,
  AppError,
} from '../utils/apiResponse';
import {
  sendEmail,
  emailVerificationTemplate,
  passwordResetTemplate,
} from '../services/email.service';
import { logger } from '../utils/logger';

// Cookie configuration helper
const setCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge,
});

/**
 * POST /api/auth/register
 * Registers a new user and sends email verification.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    sendError(res, 'An account with this email already exists', 409);
    return;
  }

  // Generate email verification token
  const verificationToken = generateRandomToken();
  const hashedToken = hashToken(verificationToken);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'developer',
    emailVerificationToken: hashedToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email (non-blocking)
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  sendEmail({
    to: user.email,
    subject: 'Verify your PMS account',
    html: emailVerificationTemplate(user.getFullName(), verificationUrl),
  }).catch((err) => logger.error(`Verification email failed: ${err.message}`));

  sendSuccess(
    res,
    'Registration successful! Please check your email to verify your account.',
    { userId: user._id, email: user.email },
    201
  );
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns JWT tokens.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Fetch user with password field (excluded by default)
  const user = await User.findOne({ email }).select(
    '+password +loginAttempts +lockUntil +refreshToken'
  );

  if (!user) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  // Check account lock
  if (user.isLocked()) {
    const lockExpiry = user.lockUntil!;
    const minutesRemaining = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
    sendError(
      res,
      `Account temporarily locked due to too many failed attempts. Try again in ${minutesRemaining} minutes.`,
      423
    );
    return;
  }

  // Validate password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    const attemptsLeft = Math.max(0, 5 - user.loginAttempts);
    sendError(
      res,
      attemptsLeft > 0
        ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
        : 'Account locked due to too many failed attempts.',
      401
    );
    return;
  }

  // Check if account is active
  if (!user.isActive) {
    sendError(res, 'Your account has been deactivated. Contact support.', 403);
    return;
  }

  // Reset login attempts on success
  await user.resetLoginAttempts();

  // Generate tokens
  const tokenPayload = {
    userId: (user._id as any).toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store hashed refresh token and update last login
  user.refreshToken = hashToken(refreshToken);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Set tokens as HTTP-only cookies
  res.cookie('accessToken', accessToken, setCookieOptions(15 * 60 * 1000)); // 15 min
  res.cookie('refreshToken', refreshToken, setCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

  sendSuccess(res, 'Login successful', {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

/**
 * POST /api/auth/refresh
 * Issues a new access token using a valid refresh token.
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    sendError(res, 'Refresh token not provided', 401);
    return;
  }

  const decoded = verifyRefreshToken(token);
  const hashedToken = hashToken(token);

  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user || user.refreshToken !== hashedToken) {
    sendError(res, 'Invalid or expired refresh token. Please login again.', 401);
    return;
  }

  if (!user.isActive) {
    sendError(res, 'Account deactivated', 403);
    return;
  }

  const tokenPayload = {
    userId: (user._id as any).toString(),
    role: user.role,
    email: user.email,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Rotate refresh token (security best practice)
  user.refreshToken = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', newAccessToken, setCookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', newRefreshToken, setCookieOptions(7 * 24 * 60 * 60 * 1000));

  sendSuccess(res, 'Token refreshed successfully', {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

/**
 * POST /api/auth/logout
 * Invalidates the refresh token and clears cookies.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token) {
    const hashedToken = hashToken(token);
    await User.findOneAndUpdate(
      { refreshToken: hashedToken },
      { $unset: { refreshToken: 1 } }
    );
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  sendSuccess(res, 'Logged out successfully');
};

/**
 * GET /api/auth/verify-email/:token
 * Verifies user email address using token from email.
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    sendError(res, 'Email verification link is invalid or has expired', 400);
    return;
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, 'Email verified successfully! You can now login.');
};

/**
 * POST /api/auth/forgot-password
 * Sends a password reset link to the user's email.
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration attacks
  if (!user) {
    sendSuccess(
      res,
      'If an account with that email exists, a password reset link has been sent.'
    );
    return;
  }

  const resetToken = generateRandomToken();
  const hashedToken = hashToken(resetToken);

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  sendEmail({
    to: user.email,
    subject: 'Password Reset Request - PMS',
    html: passwordResetTemplate(user.getFullName(), resetUrl),
  }).catch((err) => {
    logger.error(`Password reset email failed: ${err.message}`);
    // Rollback token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false }).catch(() => {});
  });

  sendSuccess(res, 'If an account with that email exists, a password reset link has been sent.');
};

/**
 * PATCH /api/auth/reset-password/:token
 * Resets the password using a valid reset token.
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const { password } = req.body;

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    sendError(res, 'Password reset link is invalid or has expired', 400);
    return;
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined; // Invalidate all sessions
  await user.save();

  // Clear cookies on all devices
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  sendSuccess(res, 'Password reset successful! Please login with your new password.');
};

/**
 * PATCH /api/auth/change-password
 * Changes password for an authenticated user.
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!.userId).select('+password');
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    sendError(res, 'Current password is incorrect', 401);
    return;
  }

  user.password = newPassword;
  user.refreshToken = undefined; // Invalidate other sessions
  await user.save();

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  sendSuccess(res, 'Password changed successfully! Please login again.');
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, 'Profile retrieved successfully', user);
};

/**
 * PATCH /api/auth/resend-verification
 * Resends the email verification link.
 */
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId).select(
    '+emailVerificationToken +emailVerificationExpires'
  );

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  if (user.isEmailVerified) {
    sendError(res, 'Your email is already verified', 400);
    return;
  }

  const verificationToken = generateRandomToken();
  const hashedToken = hashToken(verificationToken);

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your PMS account',
    html: emailVerificationTemplate(user.getFullName(), verificationUrl),
  });

  sendSuccess(res, 'Verification email sent! Please check your inbox.');
};
