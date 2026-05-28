// src/models/Booking.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const bookingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  showTimeId: {
    type: String,
    ref: 'ShowTime',
    required: true
  },
  bookingReference: {
    type: String,
    unique: true
  },
  seats: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  promoCode: String,
  specialRequests: String,
  ticketPdfUrl: String,
  qrCode: String,
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Virtual populate for User
bookingSchema.virtual('User', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for ShowTime
bookingSchema.virtual('ShowTime', {
  ref: 'ShowTime',
  localField: 'showTimeId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for Payment
bookingSchema.virtual('Payment', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'bookingId',
  justOne: true
});

addSequelizeCompatibility(bookingSchema);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
