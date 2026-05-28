// src/models/SeatLock.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const seatLockSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  showTimeId: {
    type: String,
    ref: 'ShowTime',
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  seatIds: {
    type: [String],
    required: true
  },
  expiresAt: Date,
  sessionId: String
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Virtual populate for ShowTime
seatLockSchema.virtual('ShowTime', {
  ref: 'ShowTime',
  localField: 'showTimeId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for User
seatLockSchema.virtual('User', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

addSequelizeCompatibility(seatLockSchema);

const SeatLock = mongoose.model('SeatLock', seatLockSchema);
export default SeatLock;
