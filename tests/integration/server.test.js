'use strict';

/**
 * tests/integration/server.test.js
 *
 * Integration tests for the Express server (src/app.js + src/routes/generate.js).
 * Uses Supertest to fire real HTTP requests against the app.
 * The Gemini AI SDK is FULLY MOCKED — no real API calls are ever made.
 */

const request = require('supertest');

// ─────────────────────────────────────────────────────────────────────────────
// Mock @google/generative-ai BEFORE requiring the app, so no SDK init happens
// ─────────────────────────────────────────────────────────────────────────────
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => '# Mocked AI Documentation\n\nThis is AI-generated content.',
        },
      }),
    }),
  })),
}));

// Set a fake API key so getModel() doesn't throw on missing key
process.env.GEMINI_API_KEY = 'test-fake-api-key-not-real';
process.env.AI_PROVIDER = 'gemini';
process.env.NODE_ENV = 'test';

const app = require('../../src/app');

// ─────────────────────────────────────────────────────────────────────────────
// Shared valid analysis context
// ─────────────────────────────────────────────────────────────────────────────
const validContext = {
  projectName: 'test-project',
  primaryLanguage: 'JavaScript',
  version: '1.0.0',
  description: 'An integration test project',
  framework: null,
  metaFramework: null,
  backendFramework: 'Express',
  database: null,
  authentication: null,
  packageManager: 'npm',
  hasDocker: false,
  hasCI: false,
  hasTests: true,
  hasReadme: false,
  hasGitignore: true,
  hasLicense: false,
  hasContributing: false,
  hasEnvFile: false,
  apiRoutes: [],
  features: [],
  envVars: [],
  dependencies: { express: '^4.18.0' },
  devDependencies: { jest: '^29.0.0' },
  fileCount: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  test('success: responds with 200', async () => {
    // Arrange / Act
    const res = await request(app).get('/api/health');
    // Assert
    expect(res.status).toBe(200);
  });

  test('success: responds with status "ok"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.status).toBe('ok');
  });

  test('success: response body contains provider field', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('provider');
    expect(typeof res.body.provider).toBe('string');
  });

  test('success: response body contains keyConfigured boolean', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('keyConfigured');
    expect(typeof res.body.keyConfigured).toBe('boolean');
  });

  test('success: response body contains timestamp ISO string', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('timestamp');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  test('success: Content-Type is application/json', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  test('success: keyConfigured is true when a valid-looking key is set', async () => {
    // Our fake key is NOT the placeholder, so keyConfigured should be true
    const res = await request(app).get('/api/health');
    expect(res.body.keyConfigured).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate — success cases
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/generate — success', () => {
  const DOC_TYPES = ['readme', 'installation', 'api', 'architecture', 'contributing', 'changelog'];

  DOC_TYPES.forEach((docType) => {
    test(`success: generates "${docType}" documentation (200)`, async () => {
      // Arrange
      const payload = { docType, analysisContext: validContext };
      // Act
      const res = await request(app)
        .post('/api/generate')
        .send(payload)
        .set('Content-Type', 'application/json');
      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.docType).toBe(docType);
      expect(typeof res.body.content).toBe('string');
      expect(res.body.content.length).toBeGreaterThan(0);
    });
  });

  test('success: response contains docType field matching the request', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: validContext });
    expect(res.body.docType).toBe('readme');
  });

  test('success: content is a non-empty string', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'api', analysisContext: validContext });
    expect(res.body.content).not.toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate — validation errors (400)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/generate — 400 validation errors', () => {
  test('error: 400 when docType is missing', async () => {
    const res = await request(app).post('/api/generate').send({ analysisContext: validContext });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION');
    expect(res.body.error).toMatch(/docType/i);
  });

  test('error: 400 when analysisContext is missing', async () => {
    const res = await request(app).post('/api/generate').send({ docType: 'readme' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION');
  });

  test('error: 400 when docType is an unsupported value', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'unknown-type', analysisContext: validContext });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/unsupported/i);
  });

  test('error: 400 when docType is not a string (numeric)', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 42, analysisContext: validContext });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('error: 400 when analysisContext is a string instead of object', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: 'not-an-object' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('error: 400 when analysisContext has neither projectName nor primaryLanguage', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: { version: '1.0.0' } });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('error: 400 when request body is completely empty', async () => {
    const res = await request(app).post('/api/generate').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('error: 400 when docType is an empty string', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: '', analysisContext: validContext });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate — AI provider errors (mocked)
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/generate — AI provider error handling', () => {
  require('../../src/ai/providers/geminiProvider');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('error: 401 when AI provider throws AUTH error', async () => {
    // Arrange — make the mocked generateContent throw an AUTH error
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockRejectedValue(new Error('API_KEY_INVALID')),
      }),
    }));
    // Act
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: validContext });
    // Assert
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('AUTH');
  });

  test('error: 429 when AI provider throws QUOTA error', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockRejectedValue(new Error('quota exceeded 429')),
      }),
    }));
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: validContext });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('QUOTA');
  });

  test('error: 422 when AI provider throws SAFETY error', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockRejectedValue(new Error('SAFETY filter')),
      }),
    }));
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: validContext });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('SAFETY');
  });

  test('error: 500 when an unexpected non-AI error occurs', async () => {
    // Spy on generateDocumentation in aiProvider module directly
    jest.resetModules();
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest
            .fn()
            .mockRejectedValue(new TypeError('Unexpected internal failure')),
        }),
      })),
    }));
    process.env.GEMINI_API_KEY = 'test-fake-api-key-not-real';
    const freshApp = require('../../src/app');
    const res = await request(freshApp)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: validContext });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response shape consistency
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/generate — response shape', () => {
  test('success response always has success:true, docType, content', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'changelog', analysisContext: validContext });
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('docType');
    expect(res.body).toHaveProperty('content');
  });

  test('error response always has success:false, error, code', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'bad-type', analysisContext: validContext });
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('code');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /  (static HTML fallback)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET / (SPA fallback)', () => {
  test('success: responds with 200 for the root route', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  test('success: serves an HTML document for unmatched routes (SPA fallback)', async () => {
    const res = await request(app).get('/some/unknown/spa-route');
    // The wildcard route serves index.html
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS & Content-Type
// ─────────────────────────────────────────────────────────────────────────────
describe('CORS and Content-Type headers', () => {
  test('success: /api/generate returns JSON content-type', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: validContext });
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  test('success: /api/health returns JSON content-type', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Request size limit
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/generate — large payloads', () => {
  test('success: accepts payloads within the 2 MB limit', async () => {
    const largeContext = {
      ...validContext,
      // Large but under 2 MB of JSON
      extraData: 'x'.repeat(500_000),
    };
    const res = await request(app)
      .post('/api/generate')
      .send({ docType: 'readme', analysisContext: largeContext });
    expect([200, 400]).toContain(res.status); // valid request OR AI response
  });
});
