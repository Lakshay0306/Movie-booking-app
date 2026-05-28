// src/models/Seat.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const seatSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  screenId: {
    type: String,
    ref: 'Screen',
    required: true
  },
  seatNumber: {
    type: String,
    required: true
  },
  row: {
    type: String,
    required: true
  },
  column: {
    type: Number,
    required: true
  },
  seatType: {
    type: String,
    enum: ['standard', 'premium', 'recliners'],
    default: 'standard'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Virtual populate for Screen
seatSchema.virtual('Screen', {
  ref: 'Screen',
  localField: 'screenId',
  foreignField: '_id',
  justOne: true
});

addSequelizeCompatibility(seatSchema);

const Seat = mongoose.model('Seat', seatSchema);
export default Seat;
