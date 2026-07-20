/**
 * src/ai/providers/geminiProvider.js
 *
 * Google Gemini 2.5 Flash provider implementation.
 * Implements the standard provider interface:
 *   { generateDocumentation(prompt: string, options?: object): Promise<string> }
 *
 * Environment variables consumed:
 *   GEMINI_API_KEY        — required
 *   AI_MAX_OUTPUT_TOKENS  — optional, default 8192
 *   AI_TIMEOUT_SECONDS    — optional, default 60
 */

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');


/**
 * Returns a fresh Gemini model instance on every call.
 * No caching — so GEMINI_MODEL_NAME changes in .env are reflected immediately.
 * getGenerativeModel() is a pure local factory with no network I/O.
 */
function getModel() {
  // NOTE: Model is not cached so GEMINI_MODEL_NAME changes in .env take effect
  // without restarting the server (when dotenv is re-evaluated per request).
  // getGenerativeModel() is a cheap local operation — no network call.

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. ' +
      'Copy .env.example to .env and add your key from https://aistudio.google.com/app/apikey'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Model can be overridden via GEMINI_MODEL_NAME in .env.
  // Default: gemini-flash-latest (alias → latest stable Flash).
  // Your key's available models: GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
  const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-flash-latest';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.4,       // factual, deterministic output
      topP: 0.95,
      maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '8192', 10),
    },
    // Safety settings: relaxed for technical documentation content
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  });

  return model;
}

/**
 * Generates documentation markdown using Gemini 2.5 Flash.
 *
 * @param {string} prompt  — fully built prompt from docPrompts.js
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs=60000] — abort after this many ms
 * @returns {Promise<string>} — raw Markdown string
 * @throws {AIProviderError}
 */
async function generateDocumentation(prompt, opts = {}) {
  const timeoutMs = opts.timeoutMs
    ?? parseInt(process.env.AI_TIMEOUT_SECONDS || '60', 10) * 1000;

  const model = getModel(); // may throw if API key missing

  // Race the Gemini call against a timeout promise
  const generationPromise = model.generateContent(prompt);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AIProviderError(
        `Gemini API request timed out after ${timeoutMs / 1000}s.`,
        'TIMEOUT'
      ));
    }, timeoutMs);
  });

  let result;
  try {
    result = await Promise.race([generationPromise, timeoutPromise]);
  } catch (err) {
    if (err instanceof AIProviderError) throw err;

    // Map Gemini SDK errors to typed errors
    const message = err.message || String(err);
    if (message.includes('API_KEY_INVALID') || message.includes('401')) {
      throw new AIProviderError('Gemini API key is invalid. Check GEMINI_API_KEY in .env.', 'AUTH');
    }
    if (message.includes('quota') || message.includes('429')) {
      throw new AIProviderError('Gemini quota exceeded. Wait a moment and try again.', 'QUOTA');
    }
    if (message.includes('SAFETY')) {
      throw new AIProviderError('Gemini blocked the response due to safety filters.', 'SAFETY');
    }
    throw new AIProviderError(`Gemini API error: ${message}`, 'API_ERROR');
  }

  // Extract text from the response
  const text = result?.response?.text?.();
  if (!text || text.trim().length === 0) {
    throw new AIProviderError('Gemini returned an empty response.', 'EMPTY_RESPONSE');
  }

  return text.trim();
}

/**
 * Typed error class for AI provider failures.
 * code values: TIMEOUT | AUTH | QUOTA | SAFETY | API_ERROR | EMPTY_RESPONSE | CONFIG
 */
class AIProviderError extends Error {
  constructor(message, code = 'API_ERROR') {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
  }
}

module.exports = { generateDocumentation, AIProviderError };
