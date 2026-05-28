// src/routes/payment.routes.js
import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
router.post('/razorpay/webhook', paymentController.razorpayWebhook);

router.use(authenticate);

router.post('/stripe/create-intent', paymentController.createStripePaymentIntent);
router.post('/stripe/confirm', paymentController.confirmStripePayment);
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);
router.get('/:bookingId', paymentController.getPaymentDetails);

export default router;
