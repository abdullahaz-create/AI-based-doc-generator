/**
 * server.js — AI Doc Generator Backend
 *
 * Responsibilities:
 *   - Serves the static frontend (index.html + assets)
 *   - Exposes POST /api/generate — proxies to Gemini AI (key stays server-side)
 *   - Never exposes GEMINI_API_KEY to the browser
 *
 * Usage:
 *   cp .env.example .env   # add your GEMINI_API_KEY
 *   npm install
 *   npm run dev            # starts on http://localhost:3001
 */

'use strict';

// Load environment variables FIRST — before any other imports that might
// read process.env (e.g. the AI provider modules).
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const generateRoute = require('./src/routes/generate');

/* ─────────────────────────────────────────────────────────────────────
   App Setup
───────────────────────────────────────────────────────────────────── */
const app  = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

/* ── Middleware ──────────────────────────────────────────────────────*/
// Allow the browser to call /api/* from any origin during local dev.
// In production, lock this down to your actual domain.
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false                   // same-origin only in production
    : true,                   // open for local development
  methods: ['GET', 'POST'],
}));

// Parse JSON bodies (limit 2 MB — analysis objects can be moderately large)
app.use(express.json({ limit: '2mb' }));

/* ── Request logging (lightweight) ──────────────────────────────────*/
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

/* ─────────────────────────────────────────────────────────────────────
   API Routes — mounted BEFORE static files so /api/* is never caught
   by the static middleware.
───────────────────────────────────────────────────────────────────── */
app.use('/api/generate', generateRoute);

/* ── Health check ────────────────────────────────────────────────────*/
app.get('/api/health', (_req, res) => {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const keyConfigured =
    provider === 'gemini'
      ? !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
      : false;

  res.json({
    status:      'ok',
    provider,
    keyConfigured,
    timestamp:   new Date().toISOString(),
  });
});

/* ─────────────────────────────────────────────────────────────────────
   Static Frontend
   Serves index.html and all assets (css/, js/) from the project root.
───────────────────────────────────────────────────────────────────── */
app.use(express.static(path.join(__dirname)));

// SPA fallback — any unmatched GET goes to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ─────────────────────────────────────────────────────────────────────
   Global error handler
───────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error:   'Internal server error',
    code:    'INTERNAL',
  });
});

/* ─────────────────────────────────────────────────────────────────────
   Start
───────────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  const provider = (process.env.AI_PROVIDER || 'gemini').toUpperCase();
  const keyOk    = process.env.GEMINI_API_KEY &&
                   process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │       AI Doc Generator — Backend Ready      │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log(`  │  URL:       http://localhost:${PORT}             │`);
  console.log(`  │  Provider:  ${provider.padEnd(32)}│`);
  console.log(`  │  API Key:   ${(keyOk ? '✅ Configured' : '❌ Missing — add to .env').padEnd(32)}│`);
  console.log('  └─────────────────────────────────────────────┘');
  console.log('');

  if (!keyOk) {
    console.warn('  ⚠️  GEMINI_API_KEY is not set.');
    console.warn('     Copy .env.example → .env and add your key.');
    console.warn('     Get a free key at https://aistudio.google.com/app/apikey');
    console.warn('     The app will fall back to template-based generation.');
    console.warn('');
  }
});
