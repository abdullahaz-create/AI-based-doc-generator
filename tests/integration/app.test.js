const request = require('supertest');
const app = require('../../src/app');

describe('Health API', () => {
  test('returns status 200', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
  });

  test('returns JSON', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('contains status field', async () => {
    const res = await request(app).get('/api/health');

    expect(res.body.status).toBe('ok');
  });
});
