// src/config/socket.js
import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { verifyToken } from '../utils/jwt.js';
import { getRedisClient } from './redis.js';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Seat updates namespace
  const seatNamespace = io.of('/seats');
  seatNamespace.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected to seats namespace`);

    socket.on('join-showtime', (showTimeId) => {
      socket.join(`showtime:${showTimeId}`);
      socket.emit('joined', { showTimeId });
    });

    socket.on('lock-seats', async (data) => {
      const { showTimeId, seats } = data;
      const redis = getRedisClient();
      const lockKey = `seat-lock:${showTimeId}`;

      try {
        let currentLocks = {};
        if (redis?.isReady) {
          const lockedSeats = await redis.get(lockKey);
          currentLocks = lockedSeats ? JSON.parse(lockedSeats) : {};
        }

        const newLocks = { ...currentLocks };
        seats.forEach(seat => {
          newLocks[seat] = socket.userId;
        });

        if (redis?.isReady) {
          await redis.setEx(lockKey, 600, JSON.stringify(newLocks));
        }
        
        seatNamespace.to(`showtime:${showTimeId}`).emit('seats-locked', {
          seats,
          userId: socket.userId
        });
      } catch (error) {
        logger.error('Seat lock error:', error);
        socket.emit('lock-error', { message: 'Failed to lock seats' });
      }
    });

    socket.on('unlock-seats', async (data) => {
      const { showTimeId, seats } = data;
      const redis = getRedisClient();
      const lockKey = `seat-lock:${showTimeId}`;

      try {
        let currentLocks = {};
        if (redis?.isReady) {
          const lockedSeats = await redis.get(lockKey);
          currentLocks = lockedSeats ? JSON.parse(lockedSeats) : {};
        }

        seats.forEach(seat => {
          delete currentLocks[seat];
        });

        if (redis?.isReady) {
          if (Object.keys(currentLocks).length === 0) {
            await redis.del(lockKey);
          } else {
            await redis.setEx(lockKey, 600, JSON.stringify(currentLocks));
          }
        }

        seatNamespace.to(`showtime:${showTimeId}`).emit('seats-unlocked', {
          seats,
          userId: socket.userId
        });
      } catch (error) {
        logger.error('Seat unlock error:', error);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected from seats namespace`);
    });
  });

  // Notifications namespace
  const notificationsNamespace = io.of('/notifications');
  notificationsNamespace.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected to notifications`);
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected from notifications`);
    });
  });

  return io;
};

export const emitToUser = (io, userId, event, data) => {
  io?.of('/notifications').to(`user:${userId}`).emit(event, data);
};

export const emitToShowtime = (io, showTimeId, event, data) => {
  io?.of('/seats').to(`showtime:${showTimeId}`).emit(event, data);
};
