// src/middleware/auth.js
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
};

export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient privileges' });
      }
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization verification failed' });
    }
  };
};
