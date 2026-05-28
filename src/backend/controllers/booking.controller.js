// src/controllers/booking.controller.js
import Booking from '../models/Booking.js';
import ShowTime from '../models/ShowTime.js';
import Payment from '../models/Payment.js';
import Seat from '../models/Seat.js';
import Screen from '../models/Screen.js';
import Theater from '../models/Theater.js';
import PromoCode from '../models/PromoCode.js';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import { generateBookingReference } from '../utils/helpers.js';
import { generateTicketPdf, generateQRCode } from '../services/ticket.service.js';
import { cacheSet } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { Op } from '../utils/sequelizeBridge.js';

export const createBooking = async (req, res) => {
  const { showTimeId, seats, promoCode, specialRequests } = req.body;
  const userId = req.userId;

  try {
    const showTime = await ShowTime.findByPk(showTimeId, {
      include: [
        { model: Screen, include: [Theater] }
      ]
    });

    if (!showTime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (showTime.isCancelled) {
      return res.status(400).json({ message: 'This showtime has been cancelled' });
    }

    if (new Date(showTime.startTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot book for past showtimes' });
    }

    // Verify seat availability
    const bookings = await Booking.findAll({
      where: {
        showTimeId,
        bookingStatus: { [Op.ne]: 'cancelled' },
        paymentStatus: { [Op.ne]: 'failed' }
      }
    });

    const bookedSeats = new Set();
    bookings.forEach(booking => {
      booking.seats?.forEach(seat => bookedSeats.add(seat.id));
    });

    for (const seat of seats) {
      if (bookedSeats.has(seat.id)) {
        return res.status(400).json({ 
          message: `Seat ${seat.seatNumber} is no longer available` 
        });
      }
    }

    // Calculate price
    let totalAmount = 0;
    const seatDetails = [];

    for (const seat of seats) {
      const seatRecord = await Seat.findByPk(seat.id);
      if (!seatRecord) continue;
      
      let price = 0;
      if (seatRecord.seatType === 'premium') {
        price = parseFloat(showTime.pricePremium);
      } else if (seatRecord.seatType === 'recliners') {
        price = parseFloat(showTime.priceRecliners);
      } else {
        price = parseFloat(showTime.priceStandard);
      }

      totalAmount += price;
      seatDetails.push({
        id: seatRecord.id,
        seatNumber: seatRecord.seatNumber,
        seatType: seatRecord.seatType,
        price
      });
    }

    // Apply promo code
    let discountAmount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOne({
        where: {
          code: promoCode.toUpperCase(),
          isActive: true
        }
      });

      const now = new Date();
      const isDateValid = promo &&
        (!promo.validFrom || new Date(promo.validFrom) <= now) &&
        (!promo.validUpto || new Date(promo.validUpto) >= now);

      if (promo && isDateValid) {
        if (totalAmount >= promo.minBookingAmount) {
          if (promo.discountType === 'percentage') {
            discountAmount = (totalAmount * promo.discountValue) / 100;
            if (promo.maxDiscount > 0) {
              discountAmount = Math.min(discountAmount, parseFloat(promo.maxDiscount));
            }
          } else {
            discountAmount = Math.min(parseFloat(promo.discountValue), totalAmount);
          }

          promo.usageCount += 1;
          await promo.save();
        }
      }
    }

    const finalAmount = totalAmount - discountAmount;
    const bookingReference = generateBookingReference();

    const booking = await Booking.create({
      userId,
      showTimeId,
      bookingReference,
      seats: seatDetails,
      totalAmount,
      discountAmount,
      finalAmount,
      promoCode,
      specialRequests,
      paymentStatus: 'pending',
      bookingStatus: 'confirmed'
    });

    // Lock seats
    const lockKey = `seat-lock:${showTimeId}:${booking.id}`;
    const lockedSeats = seats.map(s => s.id);
    await cacheSet(lockKey, lockedSeats, 600);

    res.status(201).json({
      booking,
      message: 'Booking created successfully. Please proceed to payment.'
    });
  } catch (error) {
    logger.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

export const getUserBookings = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.userId;

  try {
    const whereConditions = { userId };

    if (status) {
      whereConditions.bookingStatus = status;
    }

    const { count, rows } = await Booking.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: ShowTime,
          include: [
            { model: Screen, include: [Theater] }
          ]
        },
        {
          model: Payment,
          attributes: ['id', 'status', 'transactionId']
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: ShowTime,
          include: [
            { model: Screen, include: [Theater] }
          ]
        },
        {
          model: Payment
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
};

export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    const showTime = await ShowTime.findByPk(booking.showTimeId);
    if (showTime && new Date(showTime.startTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel booking for past showtime' });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Process refund if payment was completed
    if (booking.paymentStatus === 'completed') {
      const payment = await Payment.findOne({ where: { bookingId: id } });
      if (payment) {
        payment.status = 'refunded';
        payment.refundAmount = booking.finalAmount;
        payment.refundReason = 'User requested cancellation';
        await payment.save();
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

export const downloadTicket = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: ShowTime,
          include: [
            { model: Screen, include: [Theater] },
            { model: Movie }
          ]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    if (!booking.ticketPdfUrl) {
      const qrCode = await generateQRCode(booking.bookingReference);
      await generateTicketPdf(booking, qrCode);

      const filename = `ticket-${booking.bookingReference}.pdf`;
      booking.ticketPdfUrl = `${process.env.API_BASE_URL}/uploads/${filename}`;
      booking.qrCode = qrCode;
      await booking.save();
    }

    res.json({ ticketUrl: booking.ticketPdfUrl });
  } catch (error) {
    logger.error('Download ticket error:', error);
    res.status(500).json({ message: 'Failed to generate ticket' });
  }
};

export const validatePromoCode = async (req, res) => {
  const { promoCode, totalAmount } = req.body;

  try {
    if (!promoCode) {
      return res.status(400).json({ message: 'Promo code is required' });
    }

    const promo = await PromoCode.findOne({
      where: {
        code: promoCode.toUpperCase(),
        isActive: true
      }
    });

    const now = new Date();
    const isDateValid = promo &&
      (!promo.validFrom || new Date(promo.validFrom) <= now) &&
      (!promo.validUpto || new Date(promo.validUpto) >= now);

    if (!promo || !isDateValid) {
      return res.status(404).json({ message: 'Invalid or expired promo code' });
    }

    if (totalAmount < promo.minBookingAmount) {
      return res.status(400).json({ 
        message: `Minimum booking amount of ₹${promo.minBookingAmount} required to use this promo code` 
      });
    }

    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = (totalAmount * promo.discountValue) / 100;
      if (promo.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, parseFloat(promo.maxDiscount));
      }
    } else {
      discountAmount = Math.min(parseFloat(promo.discountValue), totalAmount);
    }

    res.json({
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscount: promo.maxDiscount,
      minBookingAmount: promo.minBookingAmount,
      discountAmount
    });
  } catch (error) {
    logger.error('Validate promo code error:', error);
    res.status(500).json({ message: 'Failed to validate promo code' });
  }
};
