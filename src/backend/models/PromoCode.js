// src/models/PromoCode.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const promoCodeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true
  },
  maxDiscount: {
    type: Number,
    default: 0
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  usageLimit: {
    type: Number,
    default: 0
  },
  usageCount: {
    type: Number,
    default: 0
  },
  validFrom: Date,
  validUpto: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

addSequelizeCompatibility(promoCodeSchema);

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;
