import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { User } from '../models/User.model';
import { AppError, sendError } from '../utils/apiResponse';
import { UserRole } from '../models/User.model';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { _id: string };
    }
  }
}

/**
 * Middleware to verify JWT access token from Authorization header or cookies.
 * Attaches decoded user payload to req.user.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      sendError(res, 'Authentication required. Please login.', 401);
      return;
    }

    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      sendError(res, 'User not found. The account may have been deleted.', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Your account has been deactivated. Contact support.', 403);
      return;
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      _id: decoded.userId,
    };

    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      sendError(res, 'Authentication failed', 401);
    }
  }
};

/**
 * Middleware factory that restricts access to specified roles.
 * Must be used after `authenticate` middleware.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      sendError(
        res,
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
        403
      );
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware — attaches user if token is present, but doesn't block.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
        _id: decoded.userId,
      };
    }
  } catch {
    // Silent fail — user stays unauthenticated
  }

  next();
};
