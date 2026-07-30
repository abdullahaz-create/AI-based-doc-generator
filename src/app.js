'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const client = require('prom-client');

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestCount = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
});

const generateRoute = require('./routes/generate');

const app = express();

// Collect default Node.js metrics
client.collectDefaultMetrics();

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '5mb' }));

// HTTP request logging middleware
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// HTTP Prometheus metrics middleware
app.use((req, res, next) => {
  const start = Date.now();

  activeRequests.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestCount.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    activeRequests.dec();
  });

  next();
});


// Routes
app.use('/api/generate', generateRoute);

app.get('/api/health', (_req, res) => {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  const keyConfigured =
    provider === 'gemini'
      ? !!(
          process.env.GEMINI_API_KEY &&
          process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
        )
      : false;

  res.json({
    status: 'ok',
    provider,
    keyConfigured,
    timestamp: new Date().toISOString(),
  });
});


// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});


app.use(express.static(path.join(__dirname, '..')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});


app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL',
  });
});


module.exports = app;