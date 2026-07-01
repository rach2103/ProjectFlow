import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from './apiResponse';

export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

/**
 * Generates a JWT access token (short-lived, 15 minutes by default).
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError('JWT access secret not configured', 500);

  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as any) || '15m',
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Generates a JWT refresh token (long-lived, 7 days by default).
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new AppError('JWT refresh secret not configured', 500);

  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '7d',
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Verifies a JWT access token and returns the decoded payload.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError('JWT access secret not configured', 500);

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access token has expired', 401);
    }
    throw new AppError('Invalid access token', 401);
  }
};

/**
 * Verifies a JWT refresh token and returns the decoded payload.
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new AppError('JWT refresh secret not configured', 500);

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token has expired. Please login again.', 401);
    }
    throw new AppError('Invalid refresh token', 401);
  }
};

/**
 * Generates a random token for password reset or email verification.
 */
export const generateRandomToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hashes a token for secure storage in the database.
 */
export const hashToken = (token: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};
