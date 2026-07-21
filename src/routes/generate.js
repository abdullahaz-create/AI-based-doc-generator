/**
 * src/routes/generate.js
 *
 * POST /api/generate
 *
 * Request body:
 *   {
 *     docType:         string,   // readme | installation | api | architecture | contributing | changelog
 *     analysisContext: object    // serialized analysis from analyzer.js
 *   }
 *
 * Success response (200):
 *   { success: true,  docType: string, content: string }
 *
 * Error response (4xx / 5xx):
 *   { success: false, error: string, code: string }
 */

'use strict';

const express = require('express');
const router = express.Router();

const { buildPrompt, SUPPORTED_DOC_TYPES } = require('../prompts/docPrompts');
const { generateDocumentation } = require('../ai/aiProvider');
const { AIProviderError } = require('../ai/providers/geminiProvider');

/* ─────────────────────────────────────────────────────────────────────
   Input validation
───────────────────────────────────────────────────────────────────── */
function validateRequest(body) {
  const { docType, analysisContext } = body || {};

  if (!docType || typeof docType !== 'string') {
    return 'Missing required field: docType';
  }
  if (!SUPPORTED_DOC_TYPES.includes(docType)) {
    return `Unsupported docType "${docType}". Supported: ${SUPPORTED_DOC_TYPES.join(', ')}`;
  }
  if (!analysisContext || typeof analysisContext !== 'object') {
    return 'Missing required field: analysisContext (must be an object)';
  }
  if (!analysisContext.projectName && !analysisContext.primaryLanguage) {
    return 'analysisContext must include at least projectName or primaryLanguage';
  }

  return null; // valid
}

/* ─────────────────────────────────────────────────────────────────────
   Map AI provider error codes → HTTP status codes
───────────────────────────────────────────────────────────────────── */
function httpStatusForCode(code) {
  switch (code) {
    case 'AUTH':
      return 401;
    case 'QUOTA':
      return 429;
    case 'TIMEOUT':
      return 504;
    case 'SAFETY':
      return 422;
    default:
      return 502;
  }
}

/* ─────────────────────────────────────────────────────────────────────
   POST /api/generate
───────────────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  // ── 1. Validate input ──────────────────────────────────────────────
  const validationError = validateRequest(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError, code: 'VALIDATION' });
  }

  const { docType, analysisContext } = req.body;

  // ── 2. Build prompt ────────────────────────────────────────────────
  let prompt;
  try {
    prompt = buildPrompt(docType, analysisContext);
  } catch (err) {
    console.error('[generate] Prompt build error:', err.message);
    return res.status(400).json({ success: false, error: err.message, code: 'PROMPT_BUILD' });
  }

  // ── 3. Call AI provider ────────────────────────────────────────────
  let content;
  try {
    console.log(
      `[generate] Requesting AI doc: ${docType} for "${analysisContext.projectName || 'unknown'}"`
    );
    content = await generateDocumentation(prompt);
    const elapsed = Date.now() - startTime;
    console.log(`[generate] ✅ ${docType} generated in ${elapsed}ms (${content.length} chars)`);
  } catch (err) {
    const elapsed = Date.now() - startTime;

    if (err instanceof AIProviderError) {
      console.error(
        `[generate] ❌ AIProviderError [${err.code}] after ${elapsed}ms: ${err.message}`
      );
      const status = httpStatusForCode(err.code);
      return res.status(status).json({
        success: false,
        error: err.message,
        code: err.code,
      });
    }

    // Unexpected errors
    console.error(`[generate] ❌ Unexpected error after ${elapsed}ms:`, err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while generating documentation.',
      code: 'INTERNAL',
    });
  }

  // ── 4. Return result ───────────────────────────────────────────────
  return res.status(200).json({ success: true, docType, content });
});

module.exports = router;
