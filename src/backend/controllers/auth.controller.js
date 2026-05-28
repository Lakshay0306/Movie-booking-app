// src/controllers/auth.controller.js
import User from '../models/User.js';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { sendEmail } from '../services/email.service.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import { cacheSet, cacheGet, cacheDelete } from '../config/redis.js';

export const register = async (req, res) => {
  const { email, phone, firstName, lastName, password } = req.body;

  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    const user = await User.create({
      email,
      phone,
      firstName,
      lastName,
      password
    });

    // Send verification email
    const verificationToken = generateToken(user.id, '24h');
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      template: 'verify-email',
      data: {
        verificationUrl: `${process.env.FRONTEND_URL}/verify/${verificationToken}`,
        firstName: user.firstName
      }
    });

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshTokens = [refreshToken];
    await user.save();

    res.status(201).json({
      message: emailSent 
        ? 'Registration successful. Please verify your email.' 
        : 'Registration successful, but verification email failed. You can login now.',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError' || error.code === 11000) {
      let field = 'Field';
      if (error.keyPattern) {
        field = Object.keys(error.keyPattern)[0];
      } else if (error.errors && error.errors[0]?.path) {
        field = error.errors[0].path;
      }
      return res.status(400).json({ 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    }

    res.status(500).json({ 
      message: 'Registration failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    user.refreshTokens = [...(user.refreshTokens || []), refreshToken];
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = verifyToken(refreshToken);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.refreshTokens?.includes(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    user.refreshTokens = [...user.refreshTokens.filter(t => t !== refreshToken), newRefreshToken];
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Token refresh failed' });
  }
};

export const logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired verification token' });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const verificationToken = generateToken(user.id, '24h');
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      template: 'verify-email',
      data: {
        verificationUrl: `${process.env.FRONTEND_URL}/verify/${verificationToken}`,
        firstName: user.firstName
      }
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ message: 'If this email exists, you will receive a reset link' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await cacheSet(`password-reset:${hashedToken}`, user.id, 3600);

    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      template: 'reset-password',
      data: {
        resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
        firstName: user.firstName
      }
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const userId = await cacheGet(`password-reset:${hashedToken}`);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findByPk(userId);
    user.password = password;
    await user.save();

    await cacheDelete(`password-reset:${hashedToken}`);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed' });
  }
};
