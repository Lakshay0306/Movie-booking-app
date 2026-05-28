// src/config/database.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

export const initializeDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/profitex';
    logger.info('Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connection successful');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

export default mongoose;
