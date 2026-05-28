// src/models/ShowTime.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const showTimeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  movieId: {
    type: String,
    ref: 'Movie',
    required: true
  },
  screenId: {
    type: String,
    ref: 'Screen',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  priceStandard: {
    type: Number,
    default: 200.00
  },
  pricePremium: {
    type: Number,
    default: 350.00
  },
  priceRecliners: {
    type: Number,
    default: 500.00
  },
  totalSeats: Number,
  bookedSeats: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCancelled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Virtual populate for Movie
showTimeSchema.virtual('Movie', {
  ref: 'Movie',
  localField: 'movieId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for Screen
showTimeSchema.virtual('Screen', {
  ref: 'Screen',
  localField: 'screenId',
  foreignField: '_id',
  justOne: true
});

addSequelizeCompatibility(showTimeSchema);

const ShowTime = mongoose.model('ShowTime', showTimeSchema);
export default ShowTime;
