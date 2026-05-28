// src/routes/notification.routes.js
import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getUserNotifications);
router.put('/read', notificationController.markAsRead);

export default router;
