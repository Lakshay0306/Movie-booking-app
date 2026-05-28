// src/models/Theater.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const theaterSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  area: String,
  address: String,
  latitude: Number,
  longitude: Number,
  phone: String,
  email: String,
  amenities: {
    type: [String],
    default: ['AC', 'Parking', 'F&B']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Virtual populate for Screens
theaterSchema.virtual('Screen', {
  ref: 'Screen',
  localField: '_id',
  foreignField: 'theaterId'
});

addSequelizeCompatibility(theaterSchema);

const Theater = mongoose.model('Theater', theaterSchema);
export default Theater;
