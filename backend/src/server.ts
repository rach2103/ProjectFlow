import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import app from './app';
import { connectDB } from './config/database';
import { configureCloudinary } from './config/cloudinary';
import { initializeSocket } from './sockets/socket.server';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

/**
 * Bootstraps and starts the application server.
 */
const startServer = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDB();

  // Configure Cloudinary for file uploads
  configureCloudinary();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.io with CORS
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Attach io to app for use in controllers
  app.set('io', io);

  // Initialize Socket.io event handlers
  initializeSocket(io);

  // Start the server
  httpServer.listen(PORT, () => {
    logger.info(`
╔══════════════════════════════════════════════╗
║       Project Management System API          ║
╠══════════════════════════════════════════════╣
║  Status:      Running                        ║
║  Port:        ${PORT}                           ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(29)}║
║  API:         http://localhost:${PORT}/api      ║
╚══════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    httpServer.close(async () => {
      logger.info('HTTP server closed');
      const { disconnectDB } = await import('./config/database');
      await disconnectDB();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
    gracefulShutdown('unhandledRejection');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    gracefulShutdown('uncaughtException');
  });
};

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
