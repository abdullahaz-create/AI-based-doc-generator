/**
 * src/ai/aiProvider.js
 *
 * AI Provider Factory — the single point of extensibility.
 *
 * To add a new provider (e.g., OpenAI, Claude):
 *   1. Create src/ai/providers/openaiProvider.js exporting { generateDocumentation }
 *   2. Register it in PROVIDERS below
 *   3. Set AI_PROVIDER=openai in your .env
 *   No other files need to change.
 *
 * Provider interface contract:
 *   generateDocumentation(prompt: string, opts?: object): Promise<string>
 */

'use strict';

/** Registry of available providers. Add new providers here. */
const PROVIDERS = {
  gemini: () => require('./providers/geminiProvider'),
  // openai:  () => require('./providers/openaiProvider'),
  // claude:  () => require('./providers/claudeProvider'),
};

/** Cached provider instance (one per process lifetime) */
let _activeProvider = null;

/**
 * Returns the configured AI provider.
 * Provider is determined by the AI_PROVIDER env var (default: 'gemini').
 *
 * @returns {{ generateDocumentation: Function, providerName: string }}
 * @throws {Error} if the configured provider is not registered
 */
function getProvider() {
  if (_activeProvider) return _activeProvider;

  const providerName = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const loader = PROVIDERS[providerName];

  if (!loader) {
    const available = Object.keys(PROVIDERS).join(', ');
    throw new Error(
      `Unknown AI_PROVIDER="${providerName}". ` +
        `Available providers: ${available}. ` +
        `Check your .env file.`
    );
  }

  const implementation = loader();
  _activeProvider = {
    providerName,
    generateDocumentation: implementation.generateDocumentation,
  };

  return _activeProvider;
}

/**
 * Convenience wrapper — resolves the active provider and calls generateDocumentation.
 *
 * @param {string} prompt
 * @param {object} [opts]
 * @returns {Promise<string>}
 */
async function generateDocumentation(prompt, opts = {}) {
  return getProvider().generateDocumentation(prompt, opts);
}

module.exports = { getProvider, generateDocumentation };
