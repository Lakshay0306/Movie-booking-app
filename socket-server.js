// socket-server.js
import http from 'http';
import dotenv from 'dotenv';
import { initializeSocket } from './src/backend/config/socket.js';
import { initializeRedis } from './src/backend/config/redis.js';

dotenv.config();

const server = http.createServer((req, res) => {
  // Simple health check endpoint for Render/Railway
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CineVerse Socket.io server is running\n');
});

const startSocketServer = async () => {
  try {
    console.log('Initializing Redis...');
    await initializeRedis();
  } catch (err) {
    console.warn('Redis failed to initialize. Continuing without Redis cache.', err.message);
  }

  console.log('Initializing Socket.io...');
  initializeSocket(server);

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`Socket.io server successfully running on port ${PORT}`);
  });
};

startSocketServer();
