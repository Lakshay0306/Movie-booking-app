// src/controllers/user.controller.js
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'refreshTokens'] }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();
    res.json({ message: 'Profile updated successfully', user: user.toJSON() });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};
