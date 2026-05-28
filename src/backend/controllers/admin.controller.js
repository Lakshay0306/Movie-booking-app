// src/controllers/admin.controller.js
import Movie from '../models/Movie.js';
import Theater from '../models/Theater.js';
import Screen from '../models/Screen.js';
import ShowTime from '../models/ShowTime.js';
import Booking from '../models/Booking.js';
import PromoCode from '../models/PromoCode.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Seat from '../models/Seat.js';
import { logger } from '../utils/logger.js';
import { cacheSet, cacheClear } from '../config/redis.js';
import { Op } from '../utils/sequelizeBridge.js';

// Movie Management
export const createMovie = async (req, res) => {
  try {
    logger.info('Creating movie with data:', req.body);
    const movie = await Movie.create(req.body);
    
    // Clear cache if redis is active
    try {
      await cacheClear('movies:*');
    } catch (e) {
      // Ignore cache clear errors
    }

    res.status(201).json({ 
      success: true,
      message: 'Movie created successfully', 
      movie 
    });
  } catch (error) {
    logger.error('Admin createMovie error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create movie',
      error: error.message 
    });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    await movie.update(req.body);
    await cacheClear('movies:*');
    await cacheClear(`movie:${movie.id}`);
    res.json({ message: 'Movie updated successfully', movie });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update movie' });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    await movie.destroy();
    await cacheClear('movies:*');
    await cacheClear(`movie:${movie.id}`);
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete movie' });
  }
};

// Theater Management
export const createTheater = async (req, res) => {
  try {
    const theater = await Theater.create(req.body);
    await cacheClear('theaters:*');
    res.status(201).json({ message: 'Theater created successfully', theater });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create theater' });
  }
};

export const updateTheater = async (req, res) => {
  try {
    const theater = await Theater.findByPk(req.params.id);
    if (!theater) return res.status(404).json({ message: 'Theater not found' });

    await theater.update(req.body);
    await cacheClear('theaters:*');
    res.json({ message: 'Theater updated successfully', theater });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update theater' });
  }
};

export const deleteTheater = async (req, res) => {
  try {
    const theater = await Theater.findByPk(req.params.id);
    if (!theater) return res.status(404).json({ message: 'Theater not found' });

    await theater.destroy();
    await cacheClear('theaters:*');
    res.json({ message: 'Theater deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete theater' });
  }
};

// Screen Management
export const createScreen = async (req, res) => {
  try {
    const screenData = { ...req.body };
    // Auto-calculate total seats if rows and seatsPerRow are provided
    if (screenData.rows && screenData.seatsPerRow) {
      screenData.totalSeats = screenData.rows * screenData.seatsPerRow;
    }
    
    logger.info('Creating screen with data:', screenData);
    const screen = await Screen.create(screenData);
    
    // Auto-generate Seat documents for this screen
    const numRows = screenData.rows || 10;
    const numSeatsPerRow = screenData.seatsPerRow || 15;
    const seatsToInsert = [];
    for (let r = 0; r < numRows; r++) {
      const rowLabel = String.fromCharCode(65 + r); // A, B, C, D...
      // Last row = recliners, second-to-last = premium, rest = standard
      let seatType = 'standard';
      if (r === numRows - 1) seatType = 'recliners';
      else if (r === numRows - 2) seatType = 'premium';
      
      for (let col = 1; col <= numSeatsPerRow; col++) {
        seatsToInsert.push({
          screenId: screen.id,
          seatNumber: `${rowLabel}${col}`,
          row: rowLabel,
          column: col,
          seatType
        });
      }
    }
    
    if (seatsToInsert.length > 0) {
      await Seat.bulkCreate(seatsToInsert);
      logger.info(`Auto-generated ${seatsToInsert.length} seats for screen ${screen.name}`);
    }

    await cacheClear('theaters:*');
    res.status(201).json({ 
      success: true,
      message: 'Screen created successfully', 
      screen 
    });
  } catch (error) {
    logger.error('Create screen error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create screen',
      error: error.message
    });
  }
};

export const updateScreen = async (req, res) => {
  try {
    const screen = await Screen.findByPk(req.params.id);
    if (!screen) return res.status(404).json({ message: 'Screen not found' });

    await screen.update(req.body);
    res.json({ message: 'Screen updated successfully', screen });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update screen' });
  }
};

export const deleteScreen = async (req, res) => {
  try {
    const screen = await Screen.findByPk(req.params.id);
    if (!screen) return res.status(404).json({ message: 'Screen not found' });

    await screen.destroy();
    res.json({ message: 'Screen deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete screen' });
  }
};

// ShowTime Management
export const getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await ShowTime.findAll({
      include: [
        { model: Movie, attributes: ['title', 'posterImage'] },
        { model: Screen, attributes: ['name', 'screenType', 'theaterId'], include: [{ model: Theater, attributes: ['name', 'city'] }] }
      ],
      order: [['startTime', 'ASC']]
    });
    res.json(showtimes);
  } catch (error) {
    logger.error('Get all showtimes error:', error);
    res.status(500).json({ message: 'Failed to fetch showtimes' });
  }
};

export const createShowtime = async (req, res) => {
  try {
    const showtimeData = { ...req.body };
    const movieId = req.params.id || req.body.movieId;
    
    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID is required' });
    }

    // Fetch movie to get duration for endTime calculation
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    showtimeData.movieId = movieId;
    
    // Auto-calculate endTime: startTime + duration
    if (showtimeData.startTime) {
      const start = new Date(showtimeData.startTime);
      const end = new Date(start.getTime() + movie.duration * 60000); // duration in minutes
      showtimeData.endTime = end;
    }

    // Auto-set totalSeats from the screen
    if (showtimeData.screenId && !showtimeData.totalSeats) {
      const screen = await Screen.findByPk(showtimeData.screenId);
      if (screen) {
        showtimeData.totalSeats = screen.totalSeats;
      }
    }

    logger.info('Creating showtime with auto-calculated endTime:', showtimeData);
    const showtime = await ShowTime.create(showtimeData);
    
    // Clear movie-related cache
    try { await cacheClear(`movies:${movieId}:*`); } catch (e) {}

    res.status(201).json({ 
      success: true,
      message: 'Showtime created successfully', 
      showtime 
    });
  } catch (error) {
    logger.error('Create showtime error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create showtime',
      error: error.message
    });
  }
};

export const updateShowtime = async (req, res) => {
  try {
    const showtime = await ShowTime.findByPk(req.params.id);
    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

    await showtime.update(req.body);
    res.json({ message: 'Showtime updated successfully', showtime });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update showtime' });
  }
};

export const cancelShowtime = async (req, res) => {
  try {
    const showtime = await ShowTime.findByPk(req.params.id);
    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

    showtime.isCancelled = true;
    await showtime.save();
    res.json({ message: 'Showtime cancelled successfully', showtime });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel showtime' });
  }
};

// PromoCode Management
export const createPromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json({ message: 'Promo code created successfully', promo });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create promo code' });
  }
};

export const updatePromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo code not found' });

    await promo.update(req.body);
    res.json({ message: 'Promo code updated successfully', promo });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update promo code' });
  }
};

export const deletePromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo code not found' });

    await promo.destroy();
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete promo code' });
  }
};

export const getAllPromoCodes = async (req, res) => {
  try {
    const promos = await PromoCode.findAll({ order: [['createdAt', 'DESC']] });
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch promo codes' });
  }
};

// Analytics & Listings
export const getAllBookings = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Booking.findAndCountAll({
      include: [User, ShowTime, Payment],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    res.json({ data: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

export const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    res.json({ data: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalBookings = await Booking.count();
    const totalUsers = await User.count();
    const totalMovies = await Movie.count();
    const totalRevenue = await Booking.sum('finalAmount', { where: { paymentStatus: 'completed' } });

    res.json({
      totalBookings,
      totalUsers,
      totalMovies,
      totalRevenue: totalRevenue || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};
