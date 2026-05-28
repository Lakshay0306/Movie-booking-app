// src/utils/jwt.js
import jwt from 'jsonwebtoken';

export const generateToken = (userId, expiresIn = '24h') => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'supersecretjwtkey999888777cineverse',
    { expiresIn }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkey999888777cineverse',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey999888777cineverse');
  } catch (error) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkey999888777cineverse');
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
};
