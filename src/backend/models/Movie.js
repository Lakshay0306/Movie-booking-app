// src/models/Movie.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import { addSequelizeCompatibility } from '../utils/sequelizeBridge.js';

const movieSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => crypto.randomUUID()
  },
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  genre: {
    type: [String],
    default: []
  },
  language: {
    type: [String],
    default: ['English']
  },
  releaseDate: Date,
  duration: Number,
  rating: {
    type: String,
    enum: ['U', 'UA', 'A', 'R'],
    default: 'UA'
  },
  imdbRating: {
    type: Number,
    min: 0,
    max: 10
  },
  posterImage: String,
  bannerImage: String,
  trailerUrl: String,
  cast: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  director: String,
  isActive: {
    type: Boolean,
    default: true
  },
  releaseStatus: {
    type: String,
    enum: ['upcoming', 'now_showing', 'ended'],
    default: 'upcoming'
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

addSequelizeCompatibility(movieSchema);

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
