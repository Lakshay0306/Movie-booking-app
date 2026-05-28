// src/controllers/payment.controller.js
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import ShowTime from '../models/ShowTime.js';
import Stripe from 'stripe';
import { sendEmail } from '../services/email.service.js';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

// Safe Stripe initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export const createStripePaymentIntent = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Mock response for local testing if no real key provided
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      logger.info('Using MOCK payment intent for local testing');
      return res.json({
        clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
        paymentIntentId: 'pi_mock_' + Date.now(),
        isMock: true
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.finalAmount * 100),
      currency: 'inr',
      metadata: {
        bookingId,
        bookingReference: booking.bookingReference
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
};

export const confirmStripePayment = async (req, res) => {
  const { bookingId, paymentIntentId } = req.body;

  try {
    const booking = await Booking.findByPk(bookingId, { include: [User] });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // In local testing/mock without live keys, verify ID directly
    let paymentIntent = { id: paymentIntentId, status: 'succeeded' };
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Create payment record
    let payment = await Payment.findOne({ where: { bookingId } });

    if (!payment) {
      payment = await Payment.create({
        bookingId,
        userId: req.userId,
        amount: booking.finalAmount,
        paymentMethod: 'stripe',
        transactionId: paymentIntent.id,
        paymentGatewayResponse: paymentIntent,
        status: 'completed'
      });
    } else {
      payment.transactionId = paymentIntent.id;
      payment.paymentGatewayResponse = paymentIntent;
      payment.status = 'completed';
      await payment.save();
    }

    // Update booking
    booking.paymentStatus = 'completed';
    await booking.save();

    // Send confirmation email if user available
    if (booking.User?.email) {
      await sendEmail({
        to: booking.User.email,
        subject: 'Booking Confirmed',
        template: 'booking-confirmation',
        data: {
          bookingReference: booking.bookingReference,
          firstName: booking.User.firstName,
          totalAmount: booking.finalAmount
        }
      });
    }

    res.json({
      message: 'Payment successful',
      booking,
      payment
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Payment confirmation failed' });
  }
};

import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

export const createRazorpayOrder = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Mock response for local testing if no real key provided
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder')) {
      logger.info('Using MOCK Razorpay order for local testing');
      return res.json({
        orderId: 'order_mock_' + Math.random().toString(36).substring(7),
        amount: Math.round(booking.finalAmount * 100),
        currency: 'INR',
        isMock: true
      });
    }

    const options = {
      amount: Math.round(booking.finalAmount * 100),
      currency: 'INR',
      receipt: `receipt_${booking.bookingReference}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    logger.error('Create Razorpay order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

  try {
    // Verify signature (bypass if using mock keys/order)
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('placeholder') || (razorpayOrderId && razorpayOrderId.startsWith('order_mock_'))) {
      logger.info('Bypassing signature check for MOCK Razorpay order');
    } else {
      const text = razorpayOrderId + '|' + razorpayPaymentId;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generated_signature !== razorpaySignature) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }
    }

    const booking = await Booking.findByPk(bookingId, { include: [User] });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let payment = await Payment.findOne({ where: { bookingId } });
    if (!payment) {
      payment = await Payment.create({
        bookingId,
        userId: req.userId,
        amount: booking.finalAmount,
        paymentMethod: 'razorpay',
        transactionId: razorpayPaymentId,
        paymentGatewayResponse: { orderId: razorpayOrderId, paymentId: razorpayPaymentId },
        status: 'completed'
      });
    }

    booking.paymentStatus = 'completed';
    await booking.save();

    if (booking.User?.email) {
      await sendEmail({
        to: booking.User.email,
        subject: 'Booking Confirmed - CineVerse',
        template: 'booking-confirmation',
        data: {
          bookingReference: booking.bookingReference,
          firstName: booking.User.firstName,
          totalAmount: booking.finalAmount
        }
      });
    }

    res.json({ message: 'Payment verified successfully', booking, payment });
  } catch (error) {
    logger.error('Verify Razorpay payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

export const stripeWebhook = async (req, res) => {
  res.json({ received: true });
};

export const razorpayWebhook = async (req, res) => {
  res.json({ received: true });
};

export const getPaymentDetails = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const payment = await Payment.findOne({
      where: { bookingId },
      include: [Booking]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment details' });
  }
};
