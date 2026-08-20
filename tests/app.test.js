import request from 'supertest';
import app from '../src/app';

describe('Acqusition API Test', () => {
  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/health').expect(200);

      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const res = await request(app).get('/api').expect(200);

      expect(res.body).toHaveProperty(
        'message',
        'Acquisitions API is running!'
      );
    });
  });
});

describe('GET /non-existent', () => {
  it('should return 404', async () => {
    const res = await request(app).get('/non-existent').expect(404);

    expect(res.body).toHaveProperty('error', 'Route not found');
  });
});
