/**
 * js/aiClient.js — Frontend AI API client
 *
 * Single responsibility: talk to the backend /api/generate endpoint.
 * This file has ZERO knowledge of the AI provider — it only knows about
 * the REST contract exposed by server.js.
 *
 * Usage (from app.js):
 *   const markdown = await requestAIDoc('readme', analysis);
 *
 * Error handling:
 *   Throws an AIClientError with a user-friendly .message and a
 *   machine-readable .code for the calling code to handle gracefully.
 */

/* ─────────────────────────────────────────────────────────────────────
   Configuration
───────────────────────────────────────────────────────────────────── */
const AI_CLIENT_CONFIG = Object.freeze({
  /** Base URL of the backend. Auto-detected from the current origin when served by the server. */
  baseUrl: '', // empty = same origin (works for both dev server and production)

  /** How long to wait for the server to respond (ms). Should be longer than server-side timeout. */
  timeoutMs: 75_000, // 75 seconds

  /** How many times to retry on transient network errors before giving up. */
  maxRetries: 1,

  /** Delay between retries (ms). */
  retryDelay: 1_500,
});

/* ─────────────────────────────────────────────────────────────────────
   Typed client error
───────────────────────────────────────────────────────────────────── */
class AIClientError extends Error {
  /**
   * @param {string} message  — user-friendly message
   * @param {string} code     — NETWORK | TIMEOUT | AUTH | QUOTA | SERVER | VALIDATION | UNKNOWN
   * @param {number} [status] — HTTP status code (if available)
   */
  constructor(message, code = 'UNKNOWN', status = 0) {
    super(message);
    this.name = 'AIClientError';
    this.code = code;
    this.status = status;
  }
}

/* ─────────────────────────────────────────────────────────────────────
   Core fetch with timeout
───────────────────────────────────────────────────────────────────── */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AIClientError(
        `The AI request timed out after ${timeoutMs / 1000}s. ` +
          'This can happen with large projects — try again.',
        'TIMEOUT'
      );
    }
    throw new AIClientError(
      'Cannot reach the documentation server. ' + 'Make sure `npm run dev` is running.',
      'NETWORK'
    );
  } finally {
    clearTimeout(timerId);
  }
}

/* ─────────────────────────────────────────────────────────────────────
   Response parser
   Maps HTTP status codes and server error codes → user-friendly messages
───────────────────────────────────────────────────────────────────── */
async function parseResponse(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new AIClientError(
      'Received an unexpected response from the server.',
      'SERVER',
      response.status
    );
  }

  if (response.ok && body.success) {
    return body.content; // ✅ Happy path
  }

  // Map server error codes to user-friendly messages
  const serverCode = body.code || 'UNKNOWN';
  const serverMsg = body.error || 'Unknown error';

  switch (response.status) {
    case 400:
      throw new AIClientError(`Request error: ${serverMsg}`, 'VALIDATION', 400);
    case 401:
      throw new AIClientError(
        'AI service is not configured. Please add a valid GEMINI_API_KEY to the server.',
        'AUTH',
        401
      );
    case 422:
      throw new AIClientError('The AI model declined to generate this content.', 'SAFETY', 422);
    case 429:
      throw new AIClientError(
        'AI quota exceeded. Please wait a moment and try again.',
        'QUOTA',
        429
      );
    case 502:
    case 503:
      throw new AIClientError(
        'The AI service is temporarily unavailable. Please try again shortly.',
        'SERVER',
        response.status
      );
    case 504:
      throw new AIClientError(
        'The AI request timed out on the server side. Try again with a smaller project.',
        'TIMEOUT',
        504
      );
    default:
      throw new AIClientError(
        `AI generation failed (${serverCode}): ${serverMsg}`,
        serverCode,
        response.status
      );
  }
}

/* ─────────────────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────────────────── */

/**
 * Requests AI-generated documentation from the backend.
 *
 * @param {string} docType         — readme | installation | api | architecture | contributing | changelog
 * @param {object} analysisContext — the analysis object from analyzer.js
 * @returns {Promise<string>}      — generated Markdown string
 * @throws {AIClientError}         — on any failure
 */
async function requestAIDoc(docType, analysisContext) {
  const url = `${AI_CLIENT_CONFIG.baseUrl}/api/generate`;
  const body = JSON.stringify({ docType, analysisContext });

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  };

  let lastError;
  const attempts = AI_CLIENT_CONFIG.maxRetries + 1;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, AI_CLIENT_CONFIG.timeoutMs);
      return await parseResponse(response);
    } catch (err) {
      lastError = err;

      // Don't retry on non-transient errors
      if (err instanceof AIClientError) {
        if (['AUTH', 'VALIDATION', 'QUOTA', 'SAFETY'].includes(err.code)) {
          throw err; // permanent failure — no retry
        }
        if (err.code === 'TIMEOUT' && attempt < attempts) {
          // Wait before retrying a timeout
          await new Promise((r) => setTimeout(r, AI_CLIENT_CONFIG.retryDelay));
          continue;
        }
      }

      // Retry on network errors
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, AI_CLIENT_CONFIG.retryDelay));
      }
    }
  }

  throw lastError;
}

/**
 * Checks whether the backend AI service is available and configured.
 * @returns {Promise<{available: boolean, keyConfigured: boolean, provider: string}>}
 */
async function checkAIServiceHealth() {
  try {
    const response = await fetchWithTimeout(
      `${AI_CLIENT_CONFIG.baseUrl}/api/health`,
      { method: 'GET' },
      5_000 // 5 second health check timeout
    );
    if (!response.ok) return { available: false, keyConfigured: false, provider: 'unknown' };
    const data = await response.json();
    return { available: true, keyConfigured: data.keyConfigured, provider: data.provider };
  } catch {
    return { available: false, keyConfigured: false, provider: 'unknown' };
  }
}

// Expose to global scope (loaded as a plain <script> tag)
window._aiClient = { requestAIDoc, checkAIServiceHealth, AIClientError };
