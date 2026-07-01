import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

/**
 * Initializes Socket.io with authentication middleware and event handlers.
 */
export const initializeSocket = (io: Server): void => {
  // Authentication middleware for socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user to their personal room for direct notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Handle joining a project room for project-level events
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.debug(`User ${socket.userId} joined project room: ${projectId}`);
    });

    // Handle leaving a project room
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      logger.debug(`User ${socket.userId} left project room: ${projectId}`);
    });

    // Handle joining a task room for task-level events
    socket.on('join:task', (taskId: string) => {
      socket.join(`task:${taskId}`);
    });

    // Handle user typing indicator in comments
    socket.on('typing:start', ({ taskId, userName }: { taskId: string; userName: string }) => {
      socket.to(`task:${taskId}`).emit('typing:update', { userId: socket.userId, userName, isTyping: true });
    });

    socket.on('typing:stop', ({ taskId }: { taskId: string }) => {
      socket.to(`task:${taskId}`).emit('typing:update', { userId: socket.userId, isTyping: false });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  logger.info('Socket.io initialized');
};

/**
 * Emits a notification to a specific user's room.
 */
export const emitToUser = (io: Server, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emits an event to all members of a project room.
 */
export const emitToProject = (io: Server, projectId: string, event: string, data: any): void => {
  io.to(`project:${projectId}`).emit(event, data);
};

/**
 * Emits an event to all members of a task room.
 */
export const emitToTask = (io: Server, taskId: string, event: string, data: any): void => {
  io.to(`task:${taskId}`).emit(event, data);
};
