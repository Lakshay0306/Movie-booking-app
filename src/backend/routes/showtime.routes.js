// src/routes/showtime.routes.js
import express from 'express';
import * as showtimeController from '../controllers/showtime.controller.js';

const router = express.Router();

router.get('/:id', showtimeController.getShowtimeById);

export default router;
