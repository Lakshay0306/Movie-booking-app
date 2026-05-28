// src/tests/integration/health.test.js
import request from 'supertest';
import app from '../../index.js';

describe('Health Check API', () => {
  test('GET /health should return 200 OK', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /non-existent-route should return 404', async () => {
    const response = await request(app).get('/api/v1/invalid');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message', 'Route not found');
  });
});
