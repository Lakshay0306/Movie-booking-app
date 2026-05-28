// src/config/redis.js
import redis from 'redis';
import { logger } from '../utils/logger.js';

let client;

export const initializeRedis = async () => {
  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 5) return new Error('Redis max retries reached');
          return Math.min(retries * 100, 3000);
        }
      },
      password: process.env.REDIS_PASSWORD || undefined
    });

    client.on('error', (err) => {
      if (err.code === 'ECONNREFUSED' || err.syscall === 'connect') {
        return; // Suppress local connection refused spam
      }
      logger.error('Redis error:', err);
    });
    client.on('connect', () => logger.info('Redis connected'));

    await client.connect();
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.warn('Redis is offline or unavailable. Caching is disabled. (Reason: ' + (error.message || error) + ')');
    // Don't throw to allow server to start without Redis if not fully active
  }
};

export const getRedisClient = () => client;

export const cacheSet = async (key, value, expirySeconds = 3600) => {
  if (!client?.isReady) return;
  try {
    await client.setEx(key, expirySeconds, JSON.stringify(value));
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
  }
};

export const cacheGet = async (key) => {
  if (!client?.isReady) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

export const cacheDelete = async (key) => {
  if (!client?.isReady) return;
  try {
    await client.del(key);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
  }
};

export const cacheClear = async (pattern) => {
  if (!client?.isReady) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.error(`Cache clear error for pattern ${pattern}:`, error);
  }
};
