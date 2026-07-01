import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Establishes connection to MongoDB using Mongoose.
 * Exits the process if connection fails in production.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
  } catch (error: any) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully disconnects from MongoDB.
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error: any) {
    logger.error(`Error disconnecting MongoDB: ${error.message}`);
  }
};
