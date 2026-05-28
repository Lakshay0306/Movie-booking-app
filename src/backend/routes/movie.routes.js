// src/routes/movie.routes.js
import express from 'express';
import * as movieController from '../controllers/movie.controller.js';

const router = express.Router();

router.get('/', movieController.getAllMovies);
router.get('/search', movieController.searchMovies);
router.get('/:id', movieController.getMovieById);
router.get('/:id/showtimes', movieController.getMovieShowtimes);

export default router;
