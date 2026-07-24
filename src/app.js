'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const generateRoute = require('./routes/generate');

const app = express();

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '2mb' }));

app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/generate', generateRoute);

app.get('/api/health', (_req, res) => {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  const keyConfigured =
    provider === 'gemini'
      ? !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
      : false;

  res.json({
    status: 'ok',
    provider,
    keyConfigured,
    timestamp: new Date().toISOString(),
  });
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
