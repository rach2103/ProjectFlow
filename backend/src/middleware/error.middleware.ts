import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * Handles Mongoose CastError (invalid ObjectId format).
 */
const handleCastError = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handles Mongoose duplicate key error (unique constraint violation).
 */
const handleDuplicateKeyError = (err: any): AppError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists.`;
  return new AppError(message, 409);
};

/**
 * Handles Mongoose validation errors.
 */
const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors).map((val: any) => val.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handles JWT errors.
 */
const handleJWTError = (): AppError => new AppError('Invalid token. Please login again.', 401);
const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired. Please login again.', 401);

/**
 * Sends detailed error response in development mode.
 */
const sendDevError = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

/**
 * Sends safe, production-friendly error response.
 */
const sendProdError = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    // Log unexpected errors but don't leak details to client
    logger.error('UNEXPECTED ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

/**
 * Global error handling middleware.
 * Must be registered last in the Express middleware chain.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational || false;

  logger.error(`[${err.statusCode}] ${err.message}`);

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
    return;
  }

  // Transform known error types into AppErrors
  let error = { ...err, message: err.message };

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  sendProdError(error, res);
};

/**
 * Handles requests to undefined routes.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
