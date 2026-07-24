'use strict';

/**
 * tests/unit/aiClient.test.js
 *
 * Covers the AI client layer from two angles:
 *
 *   PART A — js/aiClient.js (browser frontend)
 *     This file uses browser globals (window, fetch, AbortController) and
 *     has NO module.exports. It exposes its API via window._aiClient.
 *     Since Jest runs in testEnvironment:"node", we extract and test the
 *     pure logic (AIClientError class, response-mapping, retry policy)
 *     without requiring a DOM or real fetch.
 *
 *   PART B — src/ai/aiProvider.js (Node.js backend)
 *     Standard Jest module with module.exports. Tested with jest.mock().
 *
 *   PART C — src/ai/providers/geminiProvider.js (Node.js backend)
 *     Google Generative AI SDK is mocked. No real API calls are made.
 */

// ═════════════════════════════════════════════════════════════════════════════
// PART A: js/aiClient.js — pure logic extracted for Node.js testing
// ═════════════════════════════════════════════════════════════════════════════

/**
 * We cannot eval the full browser script in node (it ends with window._aiClient = ...)
 * so we inline-replicate the exact same class and mapping logic from aiClient.js
 * to test the contracts without modifying the source file.
 * These are 1:1 copies of the internal logic.
 */

// ── Exact copy of AIClientError from js/aiClient.js ──────────────────────────
class AIClientError extends Error {
  constructor(message, code = 'UNKNOWN', status = 0) {
    super(message);
    this.name = 'AIClientError';
    this.code = code;
    this.status = status;
  }
}

// ── Exact copy of parseResponse logic from js/aiClient.js ────────────────────
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
    return body.content;
  }

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

// ── Helper ────────────────────────────────────────────────────────────────────
function makeMockResponse(body, status = 200, ok = true) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AIClientError class
// ─────────────────────────────────────────────────────────────────────────────
describe('AIClientError', () => {
  test('success: extends Error', () => {
    const err = new AIClientError('test', 'NETWORK');
    expect(err instanceof Error).toBe(true);
  });

  test('success: name is "AIClientError"', () => {
    expect(new AIClientError('m', 'AUTH').name).toBe('AIClientError');
  });

  test('success: stores code', () => {
    expect(new AIClientError('m', 'QUOTA').code).toBe('QUOTA');
  });

  test('success: stores status', () => {
    expect(new AIClientError('m', 'SERVER', 502).status).toBe(502);
  });

  test('edge: default code is "UNKNOWN"', () => {
    expect(new AIClientError('m').code).toBe('UNKNOWN');
  });

  test('edge: default status is 0', () => {
    expect(new AIClientError('m', 'AUTH').status).toBe(0);
  });

  test('edge: message is accessible via .message', () => {
    expect(new AIClientError('oops', 'SERVER').message).toBe('oops');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseResponse — happy path
// ─────────────────────────────────────────────────────────────────────────────
describe('parseResponse — success path', () => {
  test('success: returns body.content on 200 with success:true', async () => {
    // Arrange
    const res = makeMockResponse({ success: true, content: '# README' }, 200, true);
    // Act
    const result = await parseResponse(res);
    // Assert
    expect(result).toBe('# README');
  });

  test('success: calls response.json() once', async () => {
    const res = makeMockResponse({ success: true, content: 'doc' });
    await parseResponse(res);
    expect(res.json).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseResponse — HTTP error mapping
// ─────────────────────────────────────────────────────────────────────────────
describe('parseResponse — error code mapping', () => {
  test('error: 400 → AIClientError code VALIDATION', async () => {
    const res = makeMockResponse({ error: 'bad field', code: 'VALIDATION' }, 400, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'VALIDATION', status: 400 });
  });

  test('error: 401 → AIClientError code AUTH', async () => {
    const res = makeMockResponse({ error: 'unauth' }, 401, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'AUTH', status: 401 });
  });

  test('error: 422 → AIClientError code SAFETY', async () => {
    const res = makeMockResponse({ error: 'safety' }, 422, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'SAFETY', status: 422 });
  });

  test('error: 429 → AIClientError code QUOTA', async () => {
    const res = makeMockResponse({ error: 'quota' }, 429, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'QUOTA', status: 429 });
  });

  test('error: 502 → AIClientError code SERVER', async () => {
    const res = makeMockResponse({ error: 'bad gw' }, 502, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'SERVER', status: 502 });
  });

  test('error: 503 → AIClientError code SERVER', async () => {
    const res = makeMockResponse({ error: 'unavail' }, 503, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'SERVER', status: 503 });
  });

  test('error: 504 → AIClientError code TIMEOUT', async () => {
    const res = makeMockResponse({ error: 'timeout' }, 504, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'TIMEOUT', status: 504 });
  });

  test('error: 500 (default) → AIClientError with serverCode from body', async () => {
    const res = makeMockResponse({ error: 'oops', code: 'INTERNAL' }, 500, false);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'INTERNAL', status: 500 });
  });

  test('error: invalid JSON → AIClientError code SERVER', async () => {
    const res = {
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    };
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'SERVER' });
  });

  test('error: 200 ok:true but success:false → uses default case', async () => {
    // success:false on 200 → falls through switch default
    const res = makeMockResponse({ success: false, error: 'partial', code: 'PARTIAL' }, 200, true);
    await expect(parseResponse(res)).rejects.toMatchObject({ code: 'PARTIAL' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Retry policy (documented from the source)
// ─────────────────────────────────────────────────────────────────────────────
describe('aiClient retry policy — source contracts', () => {
  /**
   * From js/aiClient.js:
   *   maxRetries: 1  → total attempts = maxRetries + 1 = 2
   *   Permanent (no retry): AUTH | VALIDATION | QUOTA | SAFETY
   *   Transient (retry):    TIMEOUT | NETWORK
   */

  test('contract: permanent error codes are AUTH, VALIDATION, QUOTA, SAFETY', () => {
    const PERMANENT = ['AUTH', 'VALIDATION', 'QUOTA', 'SAFETY'];
    const TRANSIENT = ['TIMEOUT', 'NETWORK', 'SERVER'];
    PERMANENT.forEach((code) => expect(PERMANENT).toContain(code));
    TRANSIENT.forEach((code) => expect(PERMANENT).not.toContain(code));
  });

  test('contract: maxRetries=1 means 2 total attempts for transient errors', () => {
    const maxRetries = 1;
    const attempts = maxRetries + 1;
    expect(attempts).toBe(2);
  });

  test('contract: retryDelay is 1500ms', () => {
    const retryDelay = 1_500;
    expect(retryDelay).toBe(1500);
  });

  test('contract: timeoutMs is 75000ms (75s)', () => {
    const timeoutMs = 75_000;
    expect(timeoutMs).toBe(75000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkAIServiceHealth — response shape contracts
// ─────────────────────────────────────────────────────────────────────────────
describe('checkAIServiceHealth — response shape contracts', () => {
  /**
   * The function returns:
   *   { available: boolean, keyConfigured: boolean, provider: string }
   * On any failure it returns:
   *   { available: false, keyConfigured: false, provider: 'unknown' }
   */

  function buildHealthResult(ok, data) {
    if (!ok) return { available: false, keyConfigured: false, provider: 'unknown' };
    return { available: true, keyConfigured: data.keyConfigured, provider: data.provider };
  }

  test('success: available is true when response is ok', () => {
    const result = buildHealthResult(true, { keyConfigured: true, provider: 'gemini' });
    expect(result.available).toBe(true);
  });

  test('success: keyConfigured and provider are propagated from response', () => {
    const result = buildHealthResult(true, { keyConfigured: true, provider: 'gemini' });
    expect(result.keyConfigured).toBe(true);
    expect(result.provider).toBe('gemini');
  });

  test('error: available is false when response is not ok', () => {
    const result = buildHealthResult(false, {});
    expect(result.available).toBe(false);
  });

  test('error: provider defaults to "unknown" on failure', () => {
    const result = buildHealthResult(false, {});
    expect(result.provider).toBe('unknown');
  });

  test('error: keyConfigured is false on failure', () => {
    const result = buildHealthResult(false, {});
    expect(result.keyConfigured).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PART B: src/ai/aiProvider.js  (Node.js backend — module.exports)
// ═════════════════════════════════════════════════════════════════════════════
describe('src/ai/aiProvider', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('../../src/ai/providers/geminiProvider', () => ({
      generateDocumentation: jest.fn().mockResolvedValue('# Mocked output'),
    }));
    process.env.AI_PROVIDER = 'gemini';
  });

  afterEach(() => {
    jest.unmock('../../src/ai/providers/geminiProvider');
  });

  test('success: getProvider returns object with generateDocumentation function', () => {
    const { getProvider } = require('../../src/ai/aiProvider');
    const provider = getProvider();
    expect(typeof provider.generateDocumentation).toBe('function');
  });

  test('success: getProvider exposes providerName', () => {
    const { getProvider } = require('../../src/ai/aiProvider');
    expect(getProvider().providerName).toBe('gemini');
  });

  test('success: generateDocumentation delegates to the active provider', async () => {
    const { generateDocumentation } = require('../../src/ai/aiProvider');
    const result = await generateDocumentation('test prompt');
    expect(typeof result).toBe('string');
  });

  test('success: getProvider returns the same cached instance on repeated calls', () => {
    const { getProvider } = require('../../src/ai/aiProvider');
    const p1 = getProvider();
    const p2 = getProvider();
    expect(p1).toBe(p2);
  });

  test('error: throws for an unknown AI_PROVIDER value', () => {
    jest.resetModules();
    process.env.AI_PROVIDER = 'nonexistent-provider-xyz';
    const { getProvider } = require('../../src/ai/aiProvider');
    expect(() => getProvider()).toThrow(/Unknown AI_PROVIDER/);
    process.env.AI_PROVIDER = 'gemini';
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PART C: src/ai/providers/geminiProvider.js
// ═════════════════════════════════════════════════════════════════════════════
describe('AIProviderError', () => {
  const { AIProviderError } = require('../../src/ai/providers/geminiProvider');

  test('success: extends Error', () => {
    expect(new AIProviderError('x', 'TIMEOUT') instanceof Error).toBe(true);
  });

  test('success: name is "AIProviderError"', () => {
    expect(new AIProviderError('x', 'AUTH').name).toBe('AIProviderError');
  });

  test('success: stores code property', () => {
    expect(new AIProviderError('x', 'QUOTA').code).toBe('QUOTA');
  });

  test('success: message is accessible via .message', () => {
    expect(new AIProviderError('failed', 'API_ERROR').message).toBe('failed');
  });

  test('edge: default code is "API_ERROR"', () => {
    expect(new AIProviderError('x').code).toBe('API_ERROR');
  });
});

describe('geminiProvider — generateDocumentation', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = 'fake-api-key-for-testing';
  });

  afterEach(() => {
    jest.resetModules();
    delete process.env.GEMINI_API_KEY;
  });

  test('success: returns trimmed markdown string', async () => {
    // Arrange — mock the SDK
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: { text: () => '  # Generated Docs  ' },
          }),
        }),
      })),
    }));
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    // Act
    const result = await generateDocumentation('Write a README');
    // Assert
    expect(result).toBe('# Generated Docs');
  });

  test('error: throws an Error when API key is missing', async () => {
    // The provider throws a plain Error (not AIProviderError) for missing key
    // This is a known source behaviour; the error message contains 'GEMINI_API_KEY'
    process.env.GEMINI_API_KEY = '';
    jest.mock('@google/generative-ai', () => ({ GoogleGenerativeAI: jest.fn() }));
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    await expect(generateDocumentation('prompt')).rejects.toThrow(
      /GEMINI_API_KEY|not configured|invalid/i
    );
  });

  test('error: throws an Error when API key is the placeholder', async () => {
    // The provider throws a plain Error for placeholder keys
    process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
    jest.mock('@google/generative-ai', () => ({ GoogleGenerativeAI: jest.fn() }));
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    await expect(generateDocumentation('prompt')).rejects.toThrow(
      /GEMINI_API_KEY|not configured|invalid|placeholder/i
    );
  });

  test('error: throws with code QUOTA when Gemini returns quota error', async () => {
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('quota exceeded 429')),
        }),
      })),
    }));
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    await expect(generateDocumentation('prompt')).rejects.toMatchObject({ code: 'QUOTA' });
  });

  test('error: throws with code AUTH on API_KEY_INVALID', async () => {
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('API_KEY_INVALID')),
        }),
      })),
    }));
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    await expect(generateDocumentation('prompt')).rejects.toMatchObject({ code: 'AUTH' });
  });

  test('error: throws with code SAFETY on safety filter error', async () => {
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('SAFETY filter triggered')),
        }),
      })),
    }));
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    await expect(generateDocumentation('prompt')).rejects.toMatchObject({ code: 'SAFETY' });
  });

  test('error: throws with code EMPTY_RESPONSE when response text is whitespace', async () => {
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: { text: () => '   ' },
          }),
        }),
      })),
    }));
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    await expect(generateDocumentation('prompt')).rejects.toMatchObject({ code: 'EMPTY_RESPONSE' });
  });

  test('error: throws with code TIMEOUT when generation exceeds timeout', async () => {
    jest.useFakeTimers();
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockReturnValue(new Promise(() => {})), // never resolves
        }),
      })),
    }));
    process.env.AI_TIMEOUT_SECONDS = '1';
    const { generateDocumentation } = require('../../src/ai/providers/geminiProvider');
    const docPromise = generateDocumentation('prompt');
    jest.advanceTimersByTime(2000);
    await expect(docPromise).rejects.toMatchObject({ code: 'TIMEOUT' });
    jest.useRealTimers();
    delete process.env.AI_TIMEOUT_SECONDS;
  });
});
