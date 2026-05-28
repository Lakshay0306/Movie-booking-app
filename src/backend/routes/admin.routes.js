// src/routes/admin.routes.js
import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Movies
router.post('/movies', adminController.createMovie);
router.put('/movies/:id', adminController.updateMovie);
router.delete('/movies/:id', adminController.deleteMovie);

// Theaters
router.post('/theaters', adminController.createTheater);
router.put('/theaters/:id', adminController.updateTheater);
router.delete('/theaters/:id', adminController.deleteTheater);

// Screens
router.post('/screens', adminController.createScreen);
router.put('/screens/:id', adminController.updateScreen);
router.delete('/screens/:id', adminController.deleteScreen);

// Showtimes
router.get('/showtimes', adminController.getAllShowtimes);
router.post('/movies/:id/showtimes', adminController.createShowtime);
router.post('/showtimes', adminController.createShowtime);
router.put('/showtimes/:id', adminController.updateShowtime);
router.post('/showtimes/:id/cancel', adminController.cancelShowtime);

// PromoCodes
router.get('/promocodes', adminController.getAllPromoCodes);
router.post('/promocodes', adminController.createPromoCode);
router.put('/promocodes/:id', adminController.updatePromoCode);
router.delete('/promocodes/:id', adminController.deletePromoCode);

// Listings
router.get('/bookings', adminController.getAllBookings);
router.get('/users', adminController.getAllUsers);

export default router;
