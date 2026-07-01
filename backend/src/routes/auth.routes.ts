import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  resendVerification,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/auth.validators';

const router = Router();

// Public routes
router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordValidator), forgotPassword);
router.patch('/reset-password/:token', validate(resetPasswordValidator), resetPassword);

// Protected routes (require authentication)
router.use(authenticate);
router.get('/me', getMe);
router.patch('/change-password', validate(changePasswordValidator), changePassword);
router.post('/resend-verification', resendVerification);

export default router;
