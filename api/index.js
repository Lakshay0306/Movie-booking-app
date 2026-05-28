// api/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Backend Services
import errorHandler from '../src/backend/middleware/errorHandler.js';
import { logger } from '../src/backend/utils/logger.js';
import { setupAssociations } from '../src/backend/models/index.js';

// Backend Routes
import authRoutes from '../src/backend/routes/auth.routes.js';
import movieRoutes from '../src/backend/routes/movie.routes.js';
import theaterRoutes from '../src/backend/routes/theater.routes.js';
import showTimeRoutes from '../src/backend/routes/showtime.routes.js';
import bookingRoutes from '../src/backend/routes/booking.routes.js';
import paymentRoutes from '../src/backend/routes/payment.routes.js';
import seatRoutes from '../src/backend/routes/seat.routes.js';
import userRoutes from '../src/backend/routes/user.routes.js';
import adminRoutes from '../src/backend/routes/admin.routes.js';
import notificationRoutes from '../src/backend/routes/notification.routes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Helmet Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection helper for serverless
let isConnected = false;
const connectDb = async () => {
  if (isConnected) return;
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI is not defined in environment variables');
    setupAssociations();
    await mongoose.connect(mongoUri);
    isConnected = true;
    logger.info('Database connected successfully in serverless environment');
  } catch (error) {
    logger.error('Database connection failed in serverless:', error);
    throw error;
  }
};

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  await connectDb();
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global Express Error Handler
app.use(errorHandler);

export default app;
