// src/routes/theater.routes.js
import express from 'express';
import * as theaterController from '../controllers/theater.controller.js';

const router = express.Router();

router.get('/', theaterController.getAllTheaters);
router.get('/:id', theaterController.getTheaterById);

export default router;
