// src/index.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { initializeSocket } from './config/socket.js';
import errorHandler from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { setupAssociations } from './models/index.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movie.routes.js';
import theaterRoutes from './routes/theater.routes.js';
import showTimeRoutes from './routes/showtime.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import seatRoutes from './routes/seat.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/showtimes', showTimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    logger.info('Setting up model associations...');
    setupAssociations();

    logger.info('Initializing database...');
    await initializeDatabase();

    logger.info('Initializing Redis...');
    await initializeRedis();

    logger.info('Initializing Socket.io...');
    initializeSocket(server);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    // Don't kill process immediately during early startup debug
  }
};

if (process.env.NODE_ENV !== 'test') {
  initializeServices();
}

export default app;
