// src/routes/auth.routes.js
import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/verify/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

export default router;
