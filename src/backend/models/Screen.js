// src/models/Screen.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const screenSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  theaterId: {
    type: String,
    ref: 'Theater',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  screenType: {
    type: String,
    enum: ['2D', '3D', '4DX', 'IMAX'],
    default: '2D'
  },
  totalSeats: {
    type: Number,
    required: true
  },
  rows: {
    type: Number,
    required: true
  },
  seatsPerRow: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Virtual populate for Theater
screenSchema.virtual('Theater', {
  ref: 'Theater',
  localField: 'theaterId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for Seats
screenSchema.virtual('Seats', {
  ref: 'Seat',
  localField: '_id',
  foreignField: 'screenId'
});

addSequelizeCompatibility(screenSchema);

const Screen = mongoose.model('Screen', screenSchema);
export default Screen;
