// src/models/Payment.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const paymentSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  bookingId: {
    type: String,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'wallet', 'upi'],
    required: true
  },
  transactionId: String,
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Virtual populate for Booking
paymentSchema.virtual('Booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for User
paymentSchema.virtual('User', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

addSequelizeCompatibility(paymentSchema);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
