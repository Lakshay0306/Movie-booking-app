// src/middleware/errorHandler.js
import { logger } from '../utils/logger.js';

export default (err, req, res, next) => {
  logger.error(err);

  if (err.name === 'ValidationError' || err.isJoi) {
    return res.status(400).json({
      message: err.message || 'Validation error',
      errors: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
};
