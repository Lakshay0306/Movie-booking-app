// src/routes/seat.routes.js
import express from 'express';
import * as seatController from '../controllers/seat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/showtime/:showTimeId', seatController.getShowtimeSeats);
router.get('/showtime/:showTimeId/locked', seatController.getLockedSeats);

router.use(authenticate);

router.post('/showtime/:showTimeId/lock', seatController.lockSeats);
router.post('/showtime/:showTimeId/unlock', seatController.unlockSeats);

export default router;
