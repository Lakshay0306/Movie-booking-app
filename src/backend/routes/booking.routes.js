// src/routes/booking.routes.js
import express from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { bookingSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(authenticate);

router.post('/validate-promo', bookingController.validatePromoCode);
router.post('/', validateRequest(bookingSchema), bookingController.createBooking);
router.get('/', bookingController.getUserBookings);
router.get('/:id', bookingController.getBookingById);
router.post('/:id/cancel', bookingController.cancelBooking);
router.get('/:id/ticket', bookingController.downloadTicket);

export default router;
