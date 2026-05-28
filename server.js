// server.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import next from 'next';

// Backend Services
import { initializeDatabase } from './src/backend/config/database.js';
import { initializeRedis } from './src/backend/config/redis.js';
import { initializeSocket } from './src/backend/config/socket.js';
import errorHandler from './src/backend/middleware/errorHandler.js';
import { logger } from './src/backend/utils/logger.js';
import { setupAssociations } from './src/backend/models/index.js';

// Backend Routes
import authRoutes from './src/backend/routes/auth.routes.js';
import movieRoutes from './src/backend/routes/movie.routes.js';
import theaterRoutes from './src/backend/routes/theater.routes.js';
import showTimeRoutes from './src/backend/routes/showtime.routes.js';
import bookingRoutes from './src/backend/routes/booking.routes.js';
import paymentRoutes from './src/backend/routes/payment.routes.js';
import seatRoutes from './src/backend/routes/seat.routes.js';
import userRoutes from './src/backend/routes/user.routes.js';
import adminRoutes from './src/backend/routes/admin.routes.js';
import notificationRoutes from './src/backend/routes/notification.routes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  const app = express();
  const server = http.createServer(app);

  // Helmet Middleware (configured to allow inline scripts/styles for Next.js in dev)
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Static uploads directory serving
  app.use('/uploads', express.static(path.join(__dirname, './uploads')));

  // Request logging
  app.use((req, res, next) => {
    if (!req.path.startsWith('/_next') && !req.path.startsWith('/static')) {
      logger.info(`${req.method} ${req.path}`);
    }
    next();
  });

  // Backend API Routes
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

  // Health check API
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Next.js client-side pages catch-all handler
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Global Express Error Handler
  app.use(errorHandler);

  // Initialize DB, Redis, and WebSockets
  try {
    logger.info('Setting up model associations...');
    setupAssociations();

    logger.info('Initializing database...');
    await initializeDatabase();

    logger.info('Initializing Redis...');
    await initializeRedis();

    logger.info('Initializing Socket.io...');
    initializeSocket(server);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`Unified Server running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server services:', error);
  }
}).catch((err) => {
  console.error('Next.js startup failed:', err);
  process.exit(1);
});
