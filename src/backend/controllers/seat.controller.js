// src/controllers/seat.controller.js
import Seat from '../models/Seat.js';
import Screen from '../models/Screen.js';
import ShowTime from '../models/ShowTime.js';
import Booking from '../models/Booking.js';
import SeatLock from '../models/SeatLock.js';
import { getRedisClient } from '../config/redis.js';
import { Op } from '../utils/sequelizeBridge.js';

export const getShowtimeSeats = async (req, res) => {
  const { showTimeId } = req.params;

  try {
    const showTime = await ShowTime.findByPk(showTimeId, {
      include: [Screen]
    });

    if (!showTime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    let seats = await Seat.findAll({
      where: { screenId: showTime.screenId }
    });

    // Auto-generate seats if none exist for this screen
    if (seats.length === 0 && showTime.Screen) {
      const screen = showTime.Screen;
      const numRows = screen.rows || 10;
      const numSeatsPerRow = screen.seatsPerRow || 15;
      const seatsToInsert = [];
      for (let r = 0; r < numRows; r++) {
        const rowLabel = String.fromCharCode(65 + r);
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
        // Re-fetch after creation
        seats = await Seat.findAll({
          where: { screenId: showTime.screenId }
        });
      }
    }

    // Get booked seats
    const bookings = await Booking.findAll({
      where: {
        showTimeId,
        bookingStatus: { [Op.ne]: 'cancelled' },
        paymentStatus: { [Op.ne]: 'failed' }
      }
    });

    const bookedSeatIds = new Set();
    bookings.forEach(booking => {
      booking.seats?.forEach(seat => bookedSeatIds.add(seat.id));
    });

    // Get locked seats from Redis
    const redis = getRedisClient();
    const lockedKey = `seat-lock:${showTimeId}`;
    let lockedSeatIds = [];
    
    if (redis?.isReady) {
      const lockedSeats = await redis.get(lockedKey);
      lockedSeatIds = lockedSeats ? Object.keys(JSON.parse(lockedSeats)) : [];
    }

    // Format seat data
    const formattedSeats = seats.map(seat => ({
      id: seat.id,
      seatNumber: seat.seatNumber,
      row: seat.row,
      column: seat.column,
      seatType: seat.seatType,
      status: bookedSeatIds.has(seat.id) ? 'booked' : lockedSeatIds.includes(seat.id) ? 'locked' : 'available'
    }));

    res.json({
      showTime: {
        id: showTime.id,
        totalSeats: showTime.totalSeats,
        bookedSeats: showTime.bookedSeats
      },
      screen: showTime.Screen,
      seats: formattedSeats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch seats' });
  }
};

export const lockSeats = async (req, res) => {
  const { showTimeId } = req.params;
  const { seatIds } = req.body;
  const userId = req.userId;

  try {
    const redis = getRedisClient();
    const lockKey = `seat-lock:${showTimeId}`;
    const sessionId = req.headers['x-session-id'] || `session-${Date.now()}`;

    let currentLocks = {};
    if (redis?.isReady) {
      const lockedSeats = await redis.get(lockKey);
      currentLocks = lockedSeats ? JSON.parse(lockedSeats) : {};
    }

    for (const seatId of seatIds) {
      if (currentLocks[seatId] && currentLocks[seatId] !== userId) {
        return res.status(409).json({ 
          message: 'One or more seats are locked by another user' 
        });
      }
    }

    const newLocks = { ...currentLocks };
    seatIds.forEach(seatId => {
      newLocks[seatId] = userId;
    });

    if (redis?.isReady) {
      await redis.setEx(lockKey, 600, JSON.stringify(newLocks));
    }

    const seatLock = await SeatLock.create({
      showTimeId,
      userId,
      seatIds,
      sessionId,
      expiresAt: new Date(Date.now() + 600000)
    });

    res.json({
      message: 'Seats locked successfully',
      seatLock,
      expiresAt: new Date(Date.now() + 600000)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to lock seats' });
  }
};

export const unlockSeats = async (req, res) => {
  const { showTimeId } = req.params;
  const { seatIds } = req.body;
  const userId = req.userId;

  try {
    const redis = getRedisClient();
    const lockKey = `seat-lock:${showTimeId}`;

    let currentLocks = {};
    if (redis?.isReady) {
      const lockedSeats = await redis.get(lockKey);
      currentLocks = lockedSeats ? JSON.parse(lockedSeats) : {};
    }

    seatIds.forEach(seatId => {
      if (currentLocks[seatId] === userId) {
        delete currentLocks[seatId];
      }
    });

    if (redis?.isReady) {
      if (Object.keys(currentLocks).length === 0) {
        await redis.del(lockKey);
      } else {
        await redis.setEx(lockKey, 600, JSON.stringify(currentLocks));
      }
    }

    await SeatLock.destroy({
      where: {
        showTimeId,
        userId
      }
    });

    res.json({ message: 'Seats unlocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unlock seats' });
  }
};

export const getLockedSeats = async (req, res) => {
  const { showTimeId } = req.params;

  try {
    const redis = getRedisClient();
    const lockKey = `seat-lock:${showTimeId}`;
    let lockedSeats = null;
    if (redis?.isReady) {
      lockedSeats = await redis.get(lockKey);
    }

    res.json({
      lockedSeats: lockedSeats ? JSON.parse(lockedSeats) : {}
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locked seats' });
  }
};
